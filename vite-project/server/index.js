/* global process */
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { getProperties, matchProperties, saveProperties } from './matching.js'
import { hashPassword, passwordMatches, passwordPolicyMessage, strongPassword, validLoginPassword } from './passwords.js'
import { validateAvailabilityStatus, validatePropertyInput } from './property-validation.js'

const execFileAsync = promisify(execFile)
const port = Number(process.env.PORT || 3001)
const serverDirectory = dirname(fileURLToPath(import.meta.url))
const dataFile = process.env.USER_DATA_FILE || join(serverDirectory, 'data', 'users.json')
const distDirectory = join(serverDirectory, '..', 'dist')
const sessions = new Map()
const attempts = new Map()
const prologExecutable = process.env.SWIPL_PATH || (process.platform === 'win32' ? 'swipl.exe' : 'swipl')
let prologHealth = { status: 'checking', executable: prologExecutable }

async function getUsers() {
  try { return JSON.parse(await readFile(dataFile, 'utf8')) } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return []
  }
}

async function saveUsers(users) {
  await mkdir(dirname(dataFile), { recursive: true })
  await writeFile(dataFile, JSON.stringify(users, null, 2))
}

function cookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => { const index = part.indexOf('='); return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))] }))
}

function respond(response, status, body, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    ...headers,
  })
  response.end(JSON.stringify(body))
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

async function serveFrontend(request, response, pathname) {
  if (!['GET', 'HEAD'].includes(request.method)) return false

  let decodedPath
  try { decodedPath = decodeURIComponent(pathname) } catch { return false }
  const relativePath = decodedPath.replace(/^\/+/, '') || 'index.html'
  const requestedFile = resolve(distDirectory, relativePath)
  if (requestedFile !== distDirectory && !requestedFile.startsWith(`${distDirectory}${sep}`)) return false

  let file = requestedFile
  let contents
  try {
    contents = await readFile(file)
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error
    if (extname(relativePath)) return false
    file = join(distDirectory, 'index.html')
    contents = await readFile(file)
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
  })
  response.end(request.method === 'HEAD' ? undefined : contents)
  return true
}

async function body(request) {
  let raw = ''
  for await (const chunk of request) {
    raw += chunk
    if (raw.length > 20_000) {
      const error = new Error('Request body is too large.')
      error.statusCode = 413
      throw error
    }
  }
  try {
    return JSON.parse(raw || '{}')
  } catch {
    const error = new Error('Request body must contain valid JSON.')
    error.statusCode = 400
    throw error
  }
}

function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role || 'user', status: user.status || 'active', createdAt: user.createdAt, lastLoginAt: user.lastLoginAt || null } }
function sessionCookie(token, maxAge = 60 * 60 * 24 * 7) { return `havenmatch_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}` }

function activeSession(request) {
  const session = sessions.get(cookies(request).havenmatch_session)
  if (!session || session.expiresAt < Date.now()) return null
  return session
}

function requireUser(request, response) {
  const session = activeSession(request)
  if (!session) { respond(response, 401, { message: 'Log in to continue.' }); return null }
  if (session.user.status === 'suspended') { respond(response, 403, { message: 'This account has been suspended.' }); return null }
  return session
}

function requireAdmin(request, response) {
  const session = activeSession(request)
  if (!session) { respond(response, 401, { message: 'Log in with an admin account.' }); return null }
  if (session.user.role !== 'admin') { respond(response, 403, { message: 'Admin access is required.' }); return null }
  return session
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`)

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      })
      return response.end()
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return respond(response, 200, { status: 'ok', service: 'havenmatch-api', prolog: prologHealth })
    }

    if (request.method === 'GET' && url.pathname === '/api/properties') {
      if (!requireUser(request, response)) return
      const properties = await getProperties()
      const listingType = url.searchParams.get('listingType')
      const township = url.searchParams.get('township')
      const filtered = properties.filter((property) => (property.availabilityStatus || 'available') === 'available' && (!listingType || property.listingType === listingType) && (!township || property.township === township))
      return respond(response, 200, { properties: filtered })
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/properties') {
      if (!requireAdmin(request, response)) return
      return respond(response, 200, { properties: await getProperties() })
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/users') {
      if (!requireAdmin(request, response)) return
      const users = await getUsers()
      return respond(response, 200, { users: users.map(publicUser) })
    }

    if (request.method === 'PATCH' && url.pathname.startsWith('/api/admin/users/') && url.pathname.endsWith('/status')) {
      const adminSession = requireAdmin(request, response)
      if (!adminSession) return
      const id = decodeURIComponent(url.pathname.slice('/api/admin/users/'.length, -'/status'.length))
      const input = await body(request)
      if (!['active', 'suspended'].includes(input.status)) return respond(response, 400, { message: 'User status must be active or suspended.' })
      const users = await getUsers()
      const user = users.find((item) => item.id === id)
      if (!user) return respond(response, 404, { message: 'User not found.' })
      if (user.id === adminSession.user.id) return respond(response, 400, { message: 'You cannot change your own account status.' })
      if ((user.role || 'user') === 'admin') return respond(response, 403, { message: 'Admin accounts cannot be suspended here.' })
      user.status = input.status
      user.updatedAt = new Date().toISOString()
      await saveUsers(users)
      if (input.status === 'suspended') {
        for (const [token, session] of sessions) if (session.user.id === user.id) sessions.delete(token)
      }
      return respond(response, 200, { user: publicUser(user) })
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/properties/')) {
      if (!requireUser(request, response)) return
      const id = decodeURIComponent(url.pathname.slice('/api/properties/'.length))
      const property = (await getProperties()).find((item) => item.id === id)
      return property && (property.availabilityStatus || 'available') === 'available' ? respond(response, 200, { property }) : respond(response, 404, { message: 'Property not found.' })
    }

    if (request.method === 'POST' && url.pathname === '/api/match') {
      if (!requireUser(request, response)) return
      const input = await body(request)
      const result = await matchProperties(input)
      return respond(response, 200, result)
    }

    if (!url.pathname.startsWith('/api/')) {
      if (await serveFrontend(request, response, url.pathname)) return
      return respond(response, 404, { message: 'Not found.' })
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      const session = activeSession(request)
      return respond(response, 200, { user: session?.user || null })
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      sessions.delete(cookies(request).havenmatch_session)
      return respond(response, 200, { user: null }, { 'Set-Cookie': sessionCookie('', 0) })
    }

    if (request.method === 'POST' && url.pathname === '/api/properties') {
      if (!requireAdmin(request, response)) return
      const input = validatePropertyInput(await body(request))
      const properties = await getProperties()
      const property = {
        ...input,
        id: `admin_${Date.now()}_${randomBytes(3).toString('hex')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      properties.unshift(property)
      await saveProperties(properties)
      return respond(response, 201, { property })
    }

    if (request.method === 'PUT' && url.pathname.startsWith('/api/properties/')) {
      if (!requireAdmin(request, response)) return
      const id = decodeURIComponent(url.pathname.slice('/api/properties/'.length))
      const input = validatePropertyInput(await body(request))
      const properties = await getProperties()
      const index = properties.findIndex((item) => item.id === id)
      if (index < 0) return respond(response, 404, { message: 'Property not found.' })
      const property = {
        ...properties[index],
        ...input,
        id,
        updatedAt: new Date().toISOString(),
      }
      properties[index] = property
      await saveProperties(properties)
      return respond(response, 200, { property })
    }

    if (request.method === 'PATCH' && url.pathname.startsWith('/api/properties/') && url.pathname.endsWith('/status')) {
      if (!requireAdmin(request, response)) return
      const id = decodeURIComponent(url.pathname.slice('/api/properties/'.length, -'/status'.length))
      const input = await body(request)
      const availabilityStatus = validateAvailabilityStatus(input.availabilityStatus)
      const properties = await getProperties()
      const property = properties.find((item) => item.id === id)
      if (!property) return respond(response, 404, { message: 'Property not found.' })
      property.availabilityStatus = availabilityStatus
      property.updatedAt = new Date().toISOString()
      await saveProperties(properties)
      return respond(response, 200, { property })
    }

    if (request.method === 'DELETE' && url.pathname.startsWith('/api/properties/')) {
      if (!requireAdmin(request, response)) return
      const id = decodeURIComponent(url.pathname.slice('/api/properties/'.length))
      const properties = await getProperties()
      const filtered = properties.filter((item) => item.id !== id)
      if (filtered.length === properties.length) return respond(response, 404, { message: 'Property not found.' })
      await saveProperties(filtered)
      return respond(response, 200, { deleted: true })
    }

    if (!url.pathname.startsWith('/api/auth/')) return respond(response, 404, { message: 'Not found.' })

    if (request.method === 'POST' && url.pathname === '/api/auth/change-password') {
      const token = cookies(request).havenmatch_session
      const activeSession = sessions.get(token)
      if (!activeSession || activeSession.expiresAt < Date.now()) return respond(response, 401, { message: 'Log in again to change your password.' })
      const input = await body(request)
      const currentPassword = String(input.currentPassword || '')
      const newPassword = String(input.newPassword || '')
      if (!strongPassword.test(newPassword)) return respond(response, 400, { message: passwordPolicyMessage })
      if (currentPassword === newPassword) return respond(response, 400, { message: 'Your new password must be different from your current password.' })
      const users = await getUsers()
      const user = users.find((item) => item.id === activeSession.user.id)
      if (!user || !(await passwordMatches(currentPassword, user.passwordHash))) return respond(response, 400, { message: 'Current password is incorrect.' })
      user.passwordHash = await hashPassword(newPassword)
      user.passwordChangedAt = new Date().toISOString()
      await saveUsers(users)
      for (const [sessionToken, session] of sessions) {
        if (sessionToken !== token && session.user.id === user.id) sessions.delete(sessionToken)
      }
      return respond(response, 200, { message: 'Password changed successfully.' })
    }

    if (request.method !== 'POST') return respond(response, 405, { message: 'Method not allowed.' })
    const ip = request.socket.remoteAddress || 'unknown'
    const recent = (attempts.get(ip) || []).filter((time) => Date.now() - time < 60_000)
    if (recent.length >= 10) return respond(response, 429, { message: 'Too many attempts. Please wait one minute.' })
    attempts.set(ip, [...recent, Date.now()])

    const input = await body(request)
    const email = String(input.email || '').trim().toLowerCase()
    const password = String(input.password || '')
    if (!/^\S+@\S+\.\S+$/.test(email)) return respond(response, 400, { message: 'Enter a valid email address.' })
    if (url.pathname === '/api/auth/signup' && !strongPassword.test(password)) return respond(response, 400, { message: passwordPolicyMessage })
    if (url.pathname === '/api/auth/login' && !validLoginPassword(password)) return respond(response, 400, { message: 'Enter your password.' })
    const users = await getUsers()
    let user = users.find((item) => item.email === email)

    if (url.pathname === '/api/auth/signup') {
      const name = String(input.name || '').trim()
      if (name.length < 2 || name.length > 80) return respond(response, 400, { message: 'Enter your full name.' })
      if (user) return respond(response, 409, { message: 'An account with this email already exists.' })
      user = { id: randomBytes(12).toString('hex'), name, email, role: 'user', status: 'active', passwordHash: await hashPassword(password), createdAt: new Date().toISOString(), lastLoginAt: null }
      users.push(user)
      await saveUsers(users)
      return respond(response, 201, { user: publicUser(user), requiresLogin: true, message: 'Account created. Log in to continue.' })
    } else if (url.pathname === '/api/auth/login') {
      if (!user || !(await passwordMatches(password, user.passwordHash))) return respond(response, 401, { message: 'Incorrect email or password.' })
      if ((user.status || 'active') === 'suspended') return respond(response, 403, { message: 'This account has been suspended. Contact an administrator.' })
      user.lastLoginAt = new Date().toISOString()
      await saveUsers(users)
    } else return respond(response, 404, { message: 'Not found.' })

    const token = randomBytes(32).toString('hex')
    sessions.set(token, { user: publicUser(user), expiresAt: Date.now() + 604_800_000 })
    return respond(response, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(token) })
  } catch (error) {
    const status = Number(error.statusCode) || 500
    const message = status < 500 ? error.message : 'Something went wrong. Please try again.'
    return respond(response, status, { message })
  }
})

setInterval(() => { for (const [token, session] of sessions) if (session.expiresAt < Date.now()) sessions.delete(token) }, 3_600_000).unref()
execFileAsync(prologExecutable, ['--version'])
  .then(({ stdout, stderr }) => { prologHealth = { status: 'available', executable: prologExecutable, version: (stdout || stderr).trim() } })
  .catch((error) => { prologHealth = { status: 'unavailable', executable: prologExecutable, message: error.message } })
server.listen(port, '0.0.0.0', () => console.log(`HavenMatch full-stack server running on port ${port}`))
