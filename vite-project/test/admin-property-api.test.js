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

test('admin listing lifecycle controls public property visibility', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-property-api-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, `${JSON.stringify([{ id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', passwordHash: await hashPassword('AdminPass1!'), createdAt: '2026-01-01T00:00:00.000Z' }], null, 2)}\n`)
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile },
    stdio: 'ignore',
  })

  context.after(async () => {
    if (child.exitCode === null) {
      child.kill()
      await once(child, 'exit')
    }
    await rm(directory, { recursive: true, force: true })
  })

  await waitForServer(baseUrl, child)
  assert.equal((await request(baseUrl, '/api/properties')).status, 401)
  const cookie = await login(baseUrl, 'admin@example.com', 'AdminPass1!')
  const listing = {
    title: 'API lifecycle apartment', listingType: 'rent', propertyType: 'apartment',
    township: 'Bahan', priceMmk: 900000, areaSqft: 850, bedrooms: 2, bathrooms: 1,
    images: ['/images/house-listing-1.png', '/images/listing-bedroom-01.png'],
  }

  const created = await request(baseUrl, '/api/properties', {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(listing),
  })
  assert.equal(created.status, 201)
  assert.equal(created.body.property.availabilityStatus, 'draft')
  const id = created.body.property.id

  const adminDrafts = await request(baseUrl, '/api/admin/properties', { headers: { Cookie: cookie } })
  assert.equal(adminDrafts.body.properties.length, 1)
  assert.equal((await request(baseUrl, '/api/properties', { headers: { Cookie: cookie } })).body.properties.length, 0)

  const published = await request(baseUrl, `/api/properties/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ availabilityStatus: 'available' }),
  })
  assert.equal(published.status, 200)
  assert.equal((await request(baseUrl, '/api/properties', { headers: { Cookie: cookie } })).body.properties[0].id, id)
  assert.equal((await request(baseUrl, `/api/properties/${encodeURIComponent(id)}`, { headers: { Cookie: cookie } })).status, 200)

  const unavailable = await request(baseUrl, `/api/properties/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ availabilityStatus: 'unavailable' }),
  })
  assert.equal(unavailable.status, 200)
  assert.equal((await request(baseUrl, '/api/properties', { headers: { Cookie: cookie } })).body.properties.length, 0)
  assert.equal((await request(baseUrl, `/api/properties/${encodeURIComponent(id)}`, { headers: { Cookie: cookie } })).status, 404)

  const deleted = await request(baseUrl, `/api/properties/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Cookie: cookie } })
  assert.equal(deleted.status, 200)
  assert.equal((await request(baseUrl, '/api/admin/properties', { headers: { Cookie: cookie } })).body.properties.length, 0)
})

test('property APIs reject invalid listing data and status', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-property-validation-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, `${JSON.stringify([{ id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', passwordHash: await hashPassword('AdminPass1!'), createdAt: '2026-01-01T00:00:00.000Z' }], null, 2)}\n`)
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile }, stdio: 'ignore',
  })
  context.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    await rm(directory, { recursive: true, force: true })
  })
  await waitForServer(baseUrl, child)
  const cookie = await login(baseUrl, 'admin@example.com', 'AdminPass1!')

  const invalid = await request(baseUrl, '/api/properties', {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'No', listingType: 'rent', propertyType: 'apartment', township: '', priceMmk: 0, areaSqft: -1 }),
  })
  assert.equal(invalid.status, 400)
  assert.match(invalid.body.message, /Title/)
})

test('admin can list, suspend, and reactivate users without exposing password hashes', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-admin-users-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, `${JSON.stringify([
    { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', passwordHash: await hashPassword('AdminPass1!'), createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'user-1', name: 'Customer User', email: 'user@example.com', role: 'user', status: 'active', passwordHash: await hashPassword('CustomerPass1!'), createdAt: '2026-02-01T00:00:00.000Z' },
  ], null, 2)}\n`)
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.js'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), PROPERTY_DATA_FILE: propertyFile, USER_DATA_FILE: userFile }, stdio: 'ignore' })
  context.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    await rm(directory, { recursive: true, force: true })
  })
  await waitForServer(baseUrl, child)

  assert.equal((await request(baseUrl, '/api/admin/users')).status, 401)
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'AdminPass1!' }),
  })
  assert.equal(loginResponse.status, 200)
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const usersResponse = await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: cookie } })
  const usersBody = await usersResponse.json()
  assert.equal(usersResponse.status, 200)
  assert.equal(usersBody.users.length, 2)
  assert.equal('passwordHash' in usersBody.users[0], false)

  const userCookie = await login(baseUrl, 'user@example.com', 'CustomerPass1!')
  assert.equal((await request(baseUrl, '/api/admin/users', { headers: { Cookie: userCookie } })).status, 403)
  const forbiddenCreate = await request(baseUrl, '/api/properties', {
    method: 'POST', headers: { Cookie: userCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Forbidden listing', listingType: 'rent', propertyType: 'apartment', township: 'bahan', priceMmk: 500000, areaSqft: 500 }),
  })
  assert.equal(forbiddenCreate.status, 403)

  const suspended = await fetch(`${baseUrl}/api/admin/users/user-1/status`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'suspended' }),
  })
  assert.equal(suspended.status, 200)
  assert.equal((await suspended.json()).user.status, 'suspended')
  const suspendedLogin = await request(baseUrl, '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'user@example.com', password: 'CustomerPass1!' }),
  })
  assert.equal(suspendedLogin.status, 403)

  const selfSuspend = await fetch(`${baseUrl}/api/admin/users/admin-1/status`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'suspended' }),
  })
  assert.equal(selfSuspend.status, 400)
})
