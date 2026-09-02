/* global process, Buffer */
import { createServer } from 'node:http'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const port = Number(process.env.PORT || 3001)
const dataFile = join(dirname(fileURLToPath(import.meta.url)), 'data', 'users.json')
const sessions = new Map()
const attempts = new Map()
const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/

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

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64)
  return `${salt}:${Buffer.from(hash).toString('hex')}`
}

async function passwordMatches(password, stored) {
  const [salt, expectedHex] = stored.split(':')
  const actual = Buffer.from(await scrypt(password, salt, 64))
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function cookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => { const index = part.indexOf('='); return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))] }))
}

function respond(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
  response.end(JSON.stringify(body))
}

async function body(request) {
  let raw = ''
  for await (const chunk of request) {
    raw += chunk
    if (raw.length > 20_000) throw new Error('Request too large')
  }
  return JSON.parse(raw || '{}')
}

function publicUser(user) { return { id: user.id, name: user.name, email: user.email } }
function sessionCookie(token, maxAge = 60 * 60 * 24 * 7) { return `havenmatch_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}` }

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`)
    if (!url.pathname.startsWith('/api/auth/')) return respond(response, 404, { message: 'Not found.' })

    if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      const session = sessions.get(cookies(request).havenmatch_session)
      return respond(response, 200, { user: session?.user || null })
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      sessions.delete(cookies(request).havenmatch_session)
      return respond(response, 200, { user: null }, { 'Set-Cookie': sessionCookie('', 0) })
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
    if (!strongPassword.test(password)) return respond(response, 400, { message: 'Password must have at least 8 characters, including an uppercase letter, a number, and a special character.' })
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
  } catch {
    return respond(response, 500, { message: 'Something went wrong. Please try again.' })
  }
})

setInterval(() => { for (const [token, session] of sessions) if (session.expiresAt < Date.now()) sessions.delete(token) }, 3_600_000).unref()
server.listen(port, () => console.log(`HavenMatch API running at http://localhost:${port}`))
