import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
export const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/
export const passwordPolicyMessage = 'Password must have at least 8 characters, including an uppercase letter, a number, and a special character.'
export const validLoginPassword = (password) => typeof password === 'string' && password.length > 0 && password.length <= 128

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64)
  return `${salt}:${Buffer.from(hash).toString('hex')}`
}

export async function passwordMatches(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false
  const [salt, expectedHex] = stored.split(':')
  const actual = Buffer.from(await scrypt(password, salt, 64))
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
