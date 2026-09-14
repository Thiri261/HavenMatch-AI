import test from 'node:test'
import assert from 'node:assert/strict'
import { PropertyValidationError, validateAvailabilityStatus, validatePropertyInput } from '../server/property-validation.js'

const validHome = {
  title: 'Two-bedroom apartment', listingType: 'rent', propertyType: 'apartment',
  township: 'South Okkalapa', priceMmk: '750000', areaSqft: '900', bedrooms: '2', bathrooms: '1',
  availabilityStatus: 'available', images: ['/images/cover.png', '/images/bedroom.png'],
}

test('normalizes valid property input for storage', () => {
  const property = validatePropertyInput(validHome)
  assert.equal(property.township, 'south_okkalapa')
  assert.equal(property.priceMmk, 750000)
  assert.equal(property.areaSqft, 900)
  assert.equal(property.bedrooms, 2)
  assert.equal(property.imageUrl, '/images/cover.png')
})

test('rejects invalid listing fields', () => {
  for (const input of [
    { ...validHome, title: ' ' },
    { ...validHome, priceMmk: 0 },
    { ...validHome, listingType: 'lease' },
    { ...validHome, township: '' },
    { ...validHome, areaSqft: -1 },
    { ...validHome, bedrooms: -1 },
    { ...validHome, availabilityStatus: 'published' },
    { ...validHome, images: ['/images/only-one.png'] },
    { ...validHome, images: ['/images/repeated.png', '/images/repeated.png'] },
    { ...validHome, images: ['javascript:alert(1)', '/images/valid.png'] },
  ]) assert.throws(() => validatePropertyInput(input), PropertyValidationError)
})

test('removes room fields from land and validates its type', () => {
  const land = validatePropertyInput({ ...validHome, listingType: 'land', propertyType: 'vacant_land' })
  assert.equal(land.bedrooms, null)
  assert.equal(land.bathrooms, null)
  assert.throws(() => validatePropertyInput({ ...validHome, listingType: 'land', propertyType: 'house' }), PropertyValidationError)
})

test('validates status-only updates', () => {
  assert.equal(validateAvailabilityStatus(' Available '), 'available')
  assert.throws(() => validateAvailabilityStatus('archived'), PropertyValidationError)
})
