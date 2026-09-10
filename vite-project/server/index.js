/* global process */
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { getProperties, matchProperties } from './matching.js'
import { hashPassword, passwordMatches, passwordPolicyMessage, strongPassword } from './passwords.js'

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

function publicUser(user) { return { id: user.id, name: user.name, email: user.email } }
function sessionCookie(token, maxAge = 60 * 60 * 24 * 7) { return `havenmatch_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}` }

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`)

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      })
      return response.end()
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return respond(response, 200, { status: 'ok', service: 'havenmatch-api', prolog: prologHealth })
    }

    if (request.method === 'GET' && url.pathname === '/api/properties') {
      const properties = await getProperties()
      const listingType = url.searchParams.get('listingType')
      const township = url.searchParams.get('township')
      const filtered = properties.filter((property) => (!listingType || property.listingType === listingType) && (!township || property.township === township))
      return respond(response, 200, { properties: filtered })
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/properties/')) {
      const id = decodeURIComponent(url.pathname.slice('/api/properties/'.length))
      const property = (await getProperties()).find((item) => item.id === id)
      return property ? respond(response, 200, { property }) : respond(response, 404, { message: 'Property not found.' })
    }

    if (request.method === 'POST' && url.pathname === '/api/match') {
      const input = await body(request)
      const result = await matchProperties(input)
      return respond(response, 200, result)
    }

    if (!url.pathname.startsWith('/api/')) {
      if (await serveFrontend(request, response, url.pathname)) return
      return respond(response, 404, { message: 'Not found.' })
    }

    if (!url.pathname.startsWith('/api/auth/')) return respond(response, 404, { message: 'Not found.' })

    if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      const session = sessions.get(cookies(request).havenmatch_session)
      return respond(response, 200, { user: session?.user || null })
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      sessions.delete(cookies(request).havenmatch_session)
      return respond(response, 200, { user: null }, { 'Set-Cookie': sessionCookie('', 0) })
    }

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
    if (!strongPassword.test(password)) return respond(response, 400, { message: passwordPolicyMessage })
    const users = await getUsers()
    let user = users.find((item) => item.email === email)

    if (url.pathname === '/api/auth/signup') {
      const name = String(input.name || '').trim()
      if (name.length < 2 || name.length > 80) return respond(response, 400, { message: 'Enter your full name.' })
      if (user) return respond(response, 409, { message: 'An account with this email already exists.' })
      user = { id: randomBytes(12).toString('hex'), name, email, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() }
      users.push(user)
      await saveUsers(users)
    } else if (url.pathname === '/api/auth/login') {
      if (!user || !(await passwordMatches(password, user.passwordHash))) return respond(response, 401, { message: 'Incorrect email or password.' })
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
