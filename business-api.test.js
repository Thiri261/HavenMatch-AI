import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { hashPassword } from '../server/passwords.js'

async function freePort() {
  const probe = createServer()
  probe.listen(0, '127.0.0.1')
  await once(probe, 'listening')
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}

async function waitForServer(baseUrl, child) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Test server stopped with exit code ${child.exitCode}.`)
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('Timed out waiting for the test server.')
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  return { status: response.status, body: await response.json() }
}

async function login(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  })
  assert.equal(response.status, 200)
  return response.headers.get('set-cookie').split(';')[0]
}

async function approveSignup(baseUrl, adminCookie, userId) {
  const response = await request(baseUrl, `/api/admin/users/${encodeURIComponent(userId)}/approval`, {
    method: 'PATCH', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: 'approve' }),
  })
  assert.equal(response.status, 200, (response.body && response.body.message) || 'signup approval failed')
  return response.body.user
}

const listing = {
  title: 'Business-posted apartment in Bahan', listingType: 'rent', propertyType: 'apartment',
  township: 'Bahan', priceMmk: 950000, areaSqft: 880, bedrooms: 2, bathrooms: 1,
  images: ['/images/house-listing-1.png', '/images/listing-bedroom-01.png', '/images/listing-kitchen.png', '/images/listing-bath.png'],
}

test('vendors submit listings that require admin approval before purchasers see them', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-business-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  const activityFile = join(directory, 'activity.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, `${JSON.stringify([
    { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', passwordHash: await hashPassword('AdminPass1!'), createdAt: '2026-01-01T00:00:00.000Z' },
  ], null, 2)}\n`)
  await writeFile(activityFile, '[]\n')
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile, ACTIVITY_DATA_FILE: activityFile, TOUR_REQUEST_DATA_FILE: join(directory, 'tour-requests.json') },
    stdio: 'ignore',
  })
  context.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    await rm(directory, { recursive: true, force: true })
  })
  await waitForServer(baseUrl, child)

  // A vendor signs up as role 'business' with contact details.
  const signup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Agent Maya', email: 'agent@example.com', password: 'AgentPass1!', role: 'business', phone: '+95 9 700 111 222', contactEmail: 'maya.agent@example.com', location: 'No. 5, Pyay Road, Yangon' }),
  })
  assert.equal(signup.status, 201)
  assert.equal(signup.body.user.role, 'business')
  assert.equal(signup.body.user.contactStatus, 'pending')

  // The vendor cannot log in until an admin approves the signup.
  const deniedLogin = await request(baseUrl, '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'agent@example.com', password: 'AgentPass1!' }),
  })
  assert.equal(deniedLogin.status, 403)

  // Admin approves the vendor signup (contact included), then the agent can log in and post immediately.
  const adminCookie = await login(baseUrl, 'admin@example.com', 'AdminPass1!')
  const approvedUser = await approveSignup(baseUrl, adminCookie, signup.body.user.id)
  assert.equal(approvedUser.contactStatus, 'approved')
  const agentCookie = await login(baseUrl, 'agent@example.com', 'AgentPass1!')

  // A separate purchaser account (default role 'user').
  const userSignup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Simple Purchaser', email: 'simple@example.com', password: 'SimpleUser1!' }),
  })
  assert.equal(userSignup.status, 201)
  assert.equal(userSignup.body.user.role, 'user')
  const userCookie = await login(baseUrl, 'simple@example.com', 'SimpleUser1!')

  // A vendor can post a listing, which starts as pending review.
  const created = await request(baseUrl, '/api/business/properties', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' }, body: JSON.stringify(listing),
  })
  assert.equal(created.status, 201)
  assert.equal(created.body.property.availabilityStatus, 'pending')
  assert.equal(created.body.property.ownerId !== undefined, true)
  const id = created.body.property.id

  // Pending listings are not visible to purchasers yet.
  assert.equal((await request(baseUrl, '/api/properties', { headers: { Cookie: userCookie } })).body.properties.length, 0)
  assert.equal((await request(baseUrl, `/api/properties/${encodeURIComponent(id)}`, { headers: { Cookie: userCookie } })).status, 404)

  // A vendor can edit and re-submit their own listing.
  const edited = await request(baseUrl, `/api/business/properties/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...listing, title: 'Updated business listing', priceMmk: 1000000 }),
  })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.property.availabilityStatus, 'pending')
  assert.equal(edited.body.property.priceMmk, 1000000)

  // The agent's own list includes the pending posting.
  const own = await request(baseUrl, '/api/business/properties', { headers: { Cookie: agentCookie } })
  assert.equal(own.body.properties.length, 1)

  // A purchaser cannot post or delete business listings.
  const forbidden = await request(baseUrl, '/api/business/properties', {
    method: 'POST', headers: { Cookie: userCookie, 'Content-Type': 'application/json' }, body: JSON.stringify(listing),
  })
  assert.equal(forbidden.status, 403)

  // Admin approves the listing; now a purchaser sees it.
  const approved = await request(baseUrl, `/api/properties/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ availabilityStatus: 'available' }),
  })
  assert.equal(approved.status, 200)
  assert.equal((await request(baseUrl, '/api/properties', { headers: { Cookie: userCookie } })).body.properties.length, 1)

  // Admin can reject a listing and it disappears for purchasers.
  const rejectCreated = await request(baseUrl, '/api/business/properties', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...listing, title: 'Rejected business listing' }),
  })
  const rejectId = rejectCreated.body.property.id
  const rejected = await request(baseUrl, `/api/properties/${encodeURIComponent(rejectId)}/status`, {
    method: 'PATCH', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ availabilityStatus: 'rejected' }),
  })
  assert.equal(rejected.status, 200)
  assert.equal((await request(baseUrl, '/api/properties', { headers: { Cookie: userCookie } })).body.properties.length, 1)
  assert.equal((await request(baseUrl, `/api/business/properties/${encodeURIComponent(rejectId)}`, { headers: { Cookie: agentCookie } })).body.property.availabilityStatus, 'rejected')

  // A vendor can delete their rejected listing.
  const deleted = await request(baseUrl, `/api/business/properties/${encodeURIComponent(rejectId)}`, { method: 'DELETE', headers: { Cookie: agentCookie } })
  assert.equal(deleted.status, 200)

  // The activity log records logins and posting events for the admin.
  const activity = await request(baseUrl, '/api/admin/activity', { headers: { Cookie: adminCookie } })
  assert.equal(activity.status, 200)
  const actions = activity.body.activity.map((entry) => entry.action)
  assert.ok(actions.includes('login'))
  assert.ok(actions.includes('listing_submit'))
  assert.ok(actions.includes('listing_status'))
})

test('vendors can upload a cover photo and use it in a listing', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-business-upload-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  const activityFile = join(directory, 'activity.json')
  const uploadsDir = join(directory, 'uploads')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, `${JSON.stringify([
    { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', passwordHash: await hashPassword('AdminPass1!'), createdAt: '2026-01-01T00:00:00.000Z' },
  ], null, 2)}\n`)
  await writeFile(activityFile, '[]\n')
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile, ACTIVITY_DATA_FILE: activityFile, TOUR_REQUEST_DATA_FILE: join(directory, 'tour-requests.json'), UPLOADS_DIR: uploadsDir }, stdio: 'ignore',
  })
  context.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    await rm(directory, { recursive: true, force: true })
  })
  await waitForServer(baseUrl, child)

  const signup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Agent Upload', email: 'upload@example.com', password: 'UploadPass1!', role: 'business', phone: '+95 9 800 222 333', contactEmail: 'upload.agent@example.com', location: 'No. 10, Insein Road, Yangon' }),
  })
  assert.equal(signup.status, 201)
  const uploadAdminCookie = await login(baseUrl, 'admin@example.com', 'AdminPass1!')
  const uploadApproved = await approveSignup(baseUrl, uploadAdminCookie, signup.body.user.id)
  assert.equal(uploadApproved.contactStatus, 'approved')
  const agentCookie = await login(baseUrl, 'upload@example.com', 'UploadPass1!')

  // A tiny 1x1 red PNG encoded as a base64 data URL.
  const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

  // A purchaser cannot upload images.
  const userSignup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Upload User', email: 'uploaduser@example.com', password: 'UploadUser1!' }),
  })
  assert.equal(userSignup.status, 201)
  const simpleCookie = await login(baseUrl, 'uploaduser@example.com', 'UploadUser1!')
  const denied = await request(baseUrl, '/api/business/upload', {
    method: 'POST', headers: { Cookie: simpleCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: pngDataUrl }),
  })
  assert.equal(denied.status, 403)

  // The vendor uploads the photo and gets back a served URL.
  const uploaded = await request(baseUrl, '/api/business/upload', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: pngDataUrl }),
  })
  assert.equal(uploaded.status, 201)
  assert.match(uploaded.body.url, /^\/api\/uploads\/.+\.png$/)

  // The uploaded image is publicly served.
  const imageResponse = await fetch(`${baseUrl}${uploaded.body.url}`)
  assert.equal(imageResponse.status, 200)
  assert.match(imageResponse.headers.get('content-type'), /image\/png/)

  // The uploaded URL can be used as the cover image in a submitted listing.
  const created = await request(baseUrl, '/api/business/properties', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...listing, title: 'Listing with uploaded photo', images: [uploaded.body.url, '/images/listing-bedroom-01.png', '/images/listing-kitchen.png', '/images/listing-bath.png'] }),
  })
  assert.equal(created.status, 201)
  assert.equal(created.body.property.imageUrl, uploaded.body.url)

  // Invalid data URLs are rejected.
  const invalid = await request(baseUrl, '/api/business/upload', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: 'not-an-image' }),
  })
  assert.equal(invalid.status, 400)
})

test('vendor contact details require admin approval before they appear on listings', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-business-contact-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  const activityFile = join(directory, 'activity.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, `${JSON.stringify([
    { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', passwordHash: await hashPassword('AdminPass1!'), createdAt: '2026-01-01T00:00:00.000Z' },
  ], null, 2)}\n`)
  await writeFile(activityFile, '[]\n')
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile, ACTIVITY_DATA_FILE: activityFile, TOUR_REQUEST_DATA_FILE: join(directory, 'tour-requests.json') }, stdio: 'ignore',
  })
  context.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    await rm(directory, { recursive: true, force: true })
  })
  await waitForServer(baseUrl, child)

  // A vendor signs up, submitting their contact details with the signup.
  const signup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Khin Contacts', email: 'contacts@example.com', password: 'ContactPass1!', role: 'business', phone: '+95 9 400 123 456', contactEmail: 'khin.agent@example.com', location: 'No. 12, Insein Road, Yangon' }),
  })
  assert.equal(signup.status, 201)
  assert.equal(signup.body.user.contactStatus, 'pending')
  const contactAdminCookie = await login(baseUrl, 'admin@example.com', 'AdminPass1!')
  const approvedUser = await approveSignup(baseUrl, contactAdminCookie, signup.body.user.id)
  assert.equal(approvedUser.contactStatus, 'approved')
  assert.deepEqual(approvedUser.approvedContact, { phone: '+95 9 400 123 456', email: 'khin.agent@example.com', location: 'No. 12, Insein Road, Yangon' })
  const agentCookie = await login(baseUrl, 'contacts@example.com', 'ContactPass1!')

  // Invalid contact data is rejected.
  const invalid = await request(baseUrl, '/api/business/contact', {
    method: 'PUT', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '123', email: 'not-an-email', location: '' }),
  })
  assert.equal(invalid.status, 400)

  // The approved agent can post a listing immediately.
  const created = await request(baseUrl, '/api/business/properties', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' }, body: JSON.stringify(listing),
  })
  assert.equal(created.status, 201)
  const id = created.body.property.id
  await request(baseUrl, `/api/properties/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', headers: { Cookie: contactAdminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ availabilityStatus: 'available' }),
  })

  // Now the purchaser sees Khin's contact on the approved listing.
  const userSignup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Contact Viewer', email: 'viewer@example.com', password: 'ViewerPass1!' }),
  })
  assert.equal(userSignup.status, 201)
  const userCookie = await login(baseUrl, 'viewer@example.com', 'ViewerPass1!')
  const detail = await request(baseUrl, `/api/properties/${encodeURIComponent(id)}`, { headers: { Cookie: userCookie } })
  assert.equal(detail.status, 200)
  assert.equal(detail.body.property.agentContact.name, 'Khin Contacts')
  assert.equal(detail.body.property.agentContact.phone, '+95 9 400 123 456')
  assert.equal(detail.body.property.agentContact.email, 'khin.agent@example.com')
  assert.equal(detail.body.property.agentContact.location, 'No. 12, Insein Road, Yangon')

  // Updating the contact sends it back to pending; new postings are blocked again.
  await request(baseUrl, '/api/business/contact', {
    method: 'PUT', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+95 9 999 888 777', email: 'khin.agent@example.com', location: 'No. 12, Insein Road, Yangon' }),
  })
  const blockAgain = await request(baseUrl, '/api/business/properties', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...listing, title: 'Blocked while contact pending' }),
  })
  assert.equal(blockAgain.status, 403)

  const reject = await request(baseUrl, `/api/admin/users/${encodeURIComponent(signup.body.user.id)}/contact`, {
    method: 'PATCH', headers: { Cookie: contactAdminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject' }),
  })
  assert.equal(reject.status, 200)
  assert.equal(reject.body.user.contactStatus, 'rejected')
})

test('business signup rejects invalid roles', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-business-role-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  const activityFile = join(directory, 'activity.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, '[]\n')
  await writeFile(activityFile, '[]\n')
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile, ACTIVITY_DATA_FILE: activityFile, TOUR_REQUEST_DATA_FILE: join(directory, 'tour-requests.json') }, stdio: 'ignore',
  })
  context.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    await rm(directory, { recursive: true, force: true })
  })
  await waitForServer(baseUrl, child)
  const invalidRoles = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bad Role', email: 'bad@example.com', password: 'BadRolePass1!', role: 'superuser' }),
  })
  assert.equal(invalidRoles.status, 400)

  // Business signups must include the contact details that the admin will approve.
  const missingContact = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'No Contact', email: 'nocontact@example.com', password: 'NoContactPass1!', role: 'business' }),
  })
  assert.equal(missingContact.status, 400)
  assert.match(missingContact.body.message, /contact phone/i)

  // A business signup with contact details is accepted and starts pending.
  const withContact = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Has Contact', email: 'hascontact@example.com', password: 'HasContactPass1!', role: 'business', phone: '+95 9 555 666 777', contactEmail: 'has.agent@example.com', location: 'No. 9, Merchant Road, Yangon' }),
  })
  assert.equal(withContact.status, 201)
  assert.equal(withContact.body.user.status, 'pending')
  assert.equal(withContact.body.user.contactStatus, 'pending')
})

test('vendor signups require admin approval and rejected accounts stay blocked', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-business-signup-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  const activityFile = join(directory, 'activity.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, `${JSON.stringify([
    { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', passwordHash: await hashPassword('AdminPass1!'), createdAt: '2026-01-01T00:00:00.000Z' },
  ], null, 2)}\n`)
  await writeFile(activityFile, '[]\n')
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile, ACTIVITY_DATA_FILE: activityFile, TOUR_REQUEST_DATA_FILE: join(directory, 'tour-requests.json') }, stdio: 'ignore',
  })
  context.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    await rm(directory, { recursive: true, force: true })
  })
  await waitForServer(baseUrl, child)

  const adminCookie = await login(baseUrl, 'admin@example.com', 'AdminPass1!')

  // A purchaser signs up and logs in immediately (no approval needed).
  const userSignup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Simple Agent', email: 'simpleagent@example.com', password: 'SimpleAgent1!' }),
  })
  assert.equal(userSignup.status, 201)
  assert.equal(userSignup.body.user.status, 'active')
  await login(baseUrl, 'simpleagent@example.com', 'SimpleAgent1!')

  // A business signup starts pending and gets a review message.
  const signup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pending Business', email: 'pending@example.com', password: 'PendingBusiness1!', role: 'business', phone: '+95 9 111 222 333', contactEmail: 'pending.agent@example.com', location: 'No. 1, Strand Road, Yangon' }),
  })
  assert.equal(signup.status, 201)
  assert.equal(signup.body.user.status, 'pending')
  assert.equal(signup.body.user.contactStatus, 'pending')
  assert.match(signup.body.message, /admin must approve/i)

  // Pending login is blocked with a clear message.
  const blocked = await request(baseUrl, '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pending@example.com', password: 'PendingBusiness1!' }),
  })
  assert.equal(blocked.status, 403)
  assert.match(blocked.body.message, /awaiting admin approval/i)

  // The admin sees the pending signup in the user list.
  const users = await request(baseUrl, '/api/admin/users', { headers: { Cookie: adminCookie } })
  assert.equal(users.body.users.some((user) => user.email === 'pending@example.com' && user.status === 'pending'), true)

  // Reject the signup; the agent remains blocked.
  const rejected = await request(baseUrl, `/api/admin/users/${encodeURIComponent(signup.body.user.id)}/approval`, {
    method: 'PATCH', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: 'reject' }),
  })
  assert.equal(rejected.status, 200)
  assert.equal(rejected.body.user.status, 'rejected')
  const stillBlocked = await request(baseUrl, '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pending@example.com', password: 'PendingBusiness1!' }),
  })
  assert.equal(stillBlocked.status, 403)
  assert.match(stillBlocked.body.message, /not approved/i)

  // A second business signup is approved, unlocking the account and its contact at once.
  const second = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Approved Business', email: 'approved@example.com', password: 'ApprovedBusiness1!', role: 'business', phone: '+95 9 222 333 444', contactEmail: 'approved.agent@example.com', location: 'No. 2, Bogyoke Road, Yangon' }),
  })
  assert.equal(second.status, 201)
  assert.equal(second.body.user.status, 'pending')
  const approved = await request(baseUrl, `/api/admin/users/${encodeURIComponent(second.body.user.id)}/approval`, {
    method: 'PATCH', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: 'approve' }),
  })
  assert.equal(approved.status, 200)
  assert.equal(approved.body.user.status, 'active')
  assert.equal(approved.body.user.contactStatus, 'approved')
  const agentCookie = await login(baseUrl, 'approved@example.com', 'ApprovedBusiness1!')

  // An approved agent can reach business endpoints (e.g. their own listing list).
  const own = await request(baseUrl, '/api/business/properties', { headers: { Cookie: agentCookie } })
  assert.equal(own.status, 200)

  // An approved agent can post immediately (contact was approved with the account).
  const posted = await request(baseUrl, '/api/business/properties', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' }, body: JSON.stringify(listing),
  })
  assert.equal(posted.status, 201)

  // A reviewed account cannot be reviewed a second time.
  const reReview = await request(baseUrl, `/api/admin/users/${encodeURIComponent(second.body.user.id)}/approval`, {
    method: 'PATCH', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: 'reject' }),
  })
  assert.equal(reReview.status, 409)

  // The activity log records the approval decision.
  const activity = await request(baseUrl, '/api/admin/activity', { headers: { Cookie: adminCookie } })
  const actions = activity.body.activity.map((entry) => entry.action)
  assert.ok(actions.includes('business_approve'))
  assert.ok(actions.includes('business_reject'))
})

test('tour requests notify the listing agent and the admin', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-tour-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  const activityFile = join(directory, 'activity.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, `${JSON.stringify([
    { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', passwordHash: await hashPassword('AdminPass1!'), createdAt: '2026-01-01T00:00:00.000Z' },
  ], null, 2)}\n`)
  await writeFile(activityFile, '[]\n')
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile, ACTIVITY_DATA_FILE: activityFile, TOUR_REQUEST_DATA_FILE: join(directory, 'tour-requests.json') }, stdio: 'ignore',
  })
  context.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    await rm(directory, { recursive: true, force: true })
  })
  await waitForServer(baseUrl, child)

  const adminCookie = await login(baseUrl, 'admin@example.com', 'AdminPass1!')

  // Set up an approved vendor who posts a listing.
  const signup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tour Business', email: 'tourbiz@example.com', password: 'TourBusiness1!', role: 'business', phone: '+95 9 333 444 555', contactEmail: 'tour.agent@example.com', location: 'No. 3, Kaba Aye Pagoda Road, Yangon' }),
  })
  assert.equal(signup.status, 201)
  await approveSignup(baseUrl, adminCookie, signup.body.user.id)
  const agentCookie = await login(baseUrl, 'tourbiz@example.com', 'TourBusiness1!')
  const posted = await request(baseUrl, '/api/business/properties', {
    method: 'POST', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' }, body: JSON.stringify(listing),
  })
  assert.equal(posted.status, 201)
  const listingId = posted.body.property.id
  assert.ok(listingId)

  // The admin approves the listing so purchasers can request a tour.
  const approvedListing = await request(baseUrl, `/api/properties/${encodeURIComponent(listingId)}/status`, {
    method: 'PATCH', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ availabilityStatus: 'available' }),
  })
  assert.equal(approvedListing.status, 200)
  assert.equal(approvedListing.body.property.availabilityStatus, 'available')

  // A purchaser signs up, logs in, then requests a tour for the listing.
  const userSignup = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tour Seeker', email: 'seeker@example.com', password: 'SeekerPass1!' }),
  })
  assert.equal(userSignup.status, 201)
  const userCookie = await login(baseUrl, 'seeker@example.com', 'SeekerPass1!')
  const tour = await request(baseUrl, `/api/properties/${encodeURIComponent(listingId)}/tour-request`, {
    method: 'POST', headers: { Cookie: userCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'Saturday around 10am, thanks!' }),
  })
  assert.equal(tour.status, 201)
  assert.equal(tour.body.tourRequest.listingId, listingId)
  assert.equal(tour.body.tourRequest.requesterEmail, 'seeker@example.com')
  assert.equal(tour.body.tourRequest.seen, false)

  // An unauthenticated tour request is rejected.
  const unauth = await request(baseUrl, `/api/properties/${encodeURIComponent(listingId)}/tour-request`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  })
  assert.equal(unauth.status, 401)

  // A tour request for a missing listing is rejected.
  const missing = await request(baseUrl, '/api/properties/nope/tour-request', {
    method: 'POST', headers: { Cookie: userCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  })
  assert.equal(missing.status, 404)

  // The listing agent sees the request in their dashboard feed.
  const agentFeed = await request(baseUrl, '/api/business/tour-requests', { headers: { Cookie: agentCookie } })
  assert.equal(agentFeed.status, 200)
  assert.equal(agentFeed.body.tourRequests.length, 1)
  assert.equal(agentFeed.body.tourRequests[0].listingTitle, listing.title)

  // The agent marks the request as seen.
  const seen = await request(baseUrl, `/api/business/tour-requests/${encodeURIComponent(tour.body.tourRequest.id)}/seen`, {
    method: 'PATCH', headers: { Cookie: agentCookie, 'Content-Type': 'application/json' },
  })
  assert.equal(seen.status, 200)
  assert.equal(seen.body.tourRequest.seen, true)

  // Tour requests notify only the vendor: no admin tour-request feed exists.
  const adminFeed = await request(baseUrl, '/api/admin/tour-requests', { headers: { Cookie: adminCookie } })
  assert.equal(adminFeed.status, 404)

  // Another vendor does not see someone else's tour requests.
  const other = await request(baseUrl, '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Other Business', email: 'otherbiz@example.com', password: 'OtherBusiness1!', role: 'business', phone: '+95 9 444 555 666', contactEmail: 'other.agent@example.com', location: 'No. 4, Hledan Road, Yangon' }),
  })
  assert.equal(other.status, 201)
  await approveSignup(baseUrl, adminCookie, other.body.user.id)
  const otherCookie = await login(baseUrl, 'otherbiz@example.com', 'OtherBusiness1!')
  const otherFeed = await request(baseUrl, '/api/business/tour-requests', { headers: { Cookie: otherCookie } })
  assert.equal(otherFeed.status, 200)
  assert.equal(otherFeed.body.tourRequests.length, 0)
})