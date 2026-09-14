import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

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
    try { if ((await fetch(`${baseUrl}/api/health`)).ok) return } catch { /* still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('Timed out waiting for the test server.')
}

test('creating an account requires a separate login', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'havenmatch-signup-'))
  const propertyFile = join(directory, 'properties.json')
  const userFile = join(directory, 'users.json')
  await writeFile(propertyFile, '[]\n')
  await writeFile(userFile, '[]\n')
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

  const signup = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'New User', email: 'new@example.com', password: 'NewUserPass1!' }),
  })
  const signupBody = await signup.json()
  assert.equal(signup.status, 201)
  assert.equal(signupBody.user.email, 'new@example.com')
  assert.equal(signupBody.user.role, 'user')
  assert.equal(signupBody.user.status, 'active')
  assert.equal(signupBody.requiresLogin, true)
  assert.equal(signup.headers.get('set-cookie'), null)
  assert.equal((await fetch(`${baseUrl}/api/properties`)).status, 401)

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'new@example.com', password: 'NewUserPass1!' }),
  })
  assert.equal(login.status, 200)
  const cookie = login.headers.get('set-cookie').split(';')[0]
  const session = await fetch(`${baseUrl}/api/auth/session`, { headers: { Cookie: cookie } })
  assert.equal((await session.json()).user.email, 'new@example.com')
  assert.equal((await fetch(`${baseUrl}/api/properties`, { headers: { Cookie: cookie } })).status, 200)

  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie } })
  assert.equal(logout.status, 200)
  assert.equal((await fetch(`${baseUrl}/api/properties`, { headers: { Cookie: cookie } })).status, 401)
})
