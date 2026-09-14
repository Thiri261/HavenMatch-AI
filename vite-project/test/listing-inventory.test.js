import test from 'node:test'
import assert from 'node:assert/strict'
import { availableListingOptions } from '../src/data/listingInventory.js'

const listings = [
  { purpose: 'Rent', township: 'Hlaing', type: 'Apartment' },
  { purpose: 'Rent', township: 'South Okkalapa', type: 'Condominium' },
  { purpose: 'Rent', township: 'Insein', type: 'Vacant Land' },
  { purpose: 'Buy', township: 'Bahan', type: 'House' },
]

test('builds matching choices only from eligible listings for the selected purpose', () => {
  assert.deepEqual(availableListingOptions(listings, 'Rent'), {
    townships: ['Hlaing', 'South Okkalapa'],
    propertyTypes: ['Apartment', 'Condominium'],
  })
})

test('does not offer a shared home unless one exists in the inventory', () => {
  assert.ok(!availableListingOptions(listings, 'Rent').propertyTypes.includes('Shared home'))
  listings.push({ purpose: 'Rent', township: 'Kamayut', type: 'Shared Apartment' })
  assert.ok(availableListingOptions(listings, 'Rent').propertyTypes.includes('Shared home'))
})
