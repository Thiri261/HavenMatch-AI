import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, passwordMatches, strongPassword, validLoginPassword } from '../server/passwords.js'

test('hashes passwords and verifies only the correct value', async () => {
  const stored = await hashPassword('ValidPass1!', 'fixed-test-salt')
  assert.equal(await passwordMatches('ValidPass1!', stored), true)
  assert.equal(await passwordMatches('WrongPass1!', stored), false)
  assert.equal(await passwordMatches('ValidPass1!', 'invalid'), false)
})

test('requires a strong replacement password', () => {
  assert.equal(strongPassword.test('ValidPass1!'), true)
  assert.equal(strongPassword.test('weakpass'), false)
  assert.equal(strongPassword.test('NoSpecial1'), false)
})

test('allows existing account passwords to be checked without applying the sign-up policy', () => {
  assert.equal(validLoginPassword('older-password'), true)
  assert.equal(validLoginPassword(''), false)
  assert.equal(validLoginPassword('x'.repeat(129)), false)
})
