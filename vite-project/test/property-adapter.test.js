import test from 'node:test'
import assert from 'node:assert/strict'
import { propertyToListing } from '../src/data/propertyAdapter.js'

test('maps backend buy properties without inventing missing details', () => {
  const listing = propertyToListing({
    id: 'real_buy_026', listingType: 'buy', propertyType: 'apartment',
    title: 'Apartment For Sale', township: 'mayangone', priceMmk: 92_000_000,
    bedrooms: null, bathrooms: null, areaSqft: null, imageUrl: '/images/two-bedroom.png',
    sourceSite: 'myanmarhouse.com.mm', sourceUrl: 'https://example.com/property',
    availabilityStatus: 'unverified', generator: null,
  })

  assert.equal(listing.id, 'real_buy_026')
  assert.equal(listing.purpose, 'Buy')
  assert.equal(listing.price, 92_000_000)
  assert.equal(listing.township, 'Mayangone')
  assert.equal(listing.beds, null)
  assert.equal(listing.baths, null)
  assert.equal(listing.sqft, null)
  assert.deepEqual(listing.features, [])
  assert.equal(listing.isApiListing, true)
})

test('maps only confirmed backend facilities to feature labels', () => {
  const listing = propertyToListing({
    id: 'real_rent_001', listingType: 'rent', propertyType: 'condominium',
    township: 'north_okkalapa', priceMmk: 800_000, generator: true,
    parking: false, security: null,
  })

  assert.equal(listing.purpose, 'Rent')
  assert.equal(listing.type, 'Condominium')
  assert.equal(listing.address, 'North Okkalapa Township, Yangon')
  assert.deepEqual(listing.features, ['Generator backup'])
})

test('preserves a property photo gallery while retaining the cover image', () => {
  const listing = propertyToListing({
    id: 'real_rent_001', listingType: 'rent', propertyType: 'condominium',
    imageUrl: '/images/cover.png',
    images: ['/images/cover.png', '/images/bedroom.png', '/images/kitchen.png'],
  })

  assert.equal(listing.image, '/images/cover.png')
  assert.deepEqual(listing.images, [
    '/images/cover.png',
    '/images/bedroom.png',
    '/images/kitchen.png',
  ])
})
