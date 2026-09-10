import test from 'node:test'
import assert from 'node:assert/strict'
import { filterAndSortListings } from '../src/data/listingSearch.js'

const listings = [
  { id: '1', purpose: 'Rent', title: 'North Dagon Condo', township: 'North Dagon', address: 'Yangon', type: 'Condominium', price: 2_000_000, beds: 2 },
  { id: '2', purpose: 'Rent', title: 'Family House', township: 'Hlaing', address: 'Yangon', type: 'House', price: 4_000_000, beds: 3 },
  { id: '3', purpose: 'Buy', title: 'City Apartment', township: 'Bahan', address: 'Yangon', type: 'Apartment', price: 200_000_000, beds: 1 },
]

const defaults = { purpose: 'Rent', budget: 'Any budget', beds: 'Any beds', type: 'Any type', query: '', savedOnly: false, saved: [], sort: 'Newest' }

test('searches API listings by normalized township and title text', () => {
  assert.deepEqual(filterAndSortListings(listings, { ...defaults, query: 'north-dagon' }).map((item) => item.id), ['1'])
  assert.deepEqual(filterAndSortListings(listings, { ...defaults, query: 'family' }).map((item) => item.id), ['2'])
  assert.deepEqual(filterAndSortListings(listings, { ...defaults, query: 'HLAING' }).map((item) => item.id), ['2'])
  assert.deepEqual(filterAndSortListings(listings, { ...defaults, query: 'fAmIlY hOuSe' }).map((item) => item.id), ['2'])
})

test('filters purpose, budget, bedrooms, and property type and sorts prices', () => {
  assert.deepEqual(filterAndSortListings(listings, { ...defaults, type: 'Apartment' }).map((item) => item.id), ['1'])
  assert.deepEqual(filterAndSortListings(listings, { ...defaults, budget: '3000000', beds: '2' }).map((item) => item.id), ['1'])
  assert.deepEqual(filterAndSortListings(listings, { ...defaults, sort: 'Highest price' }).map((item) => item.id), ['2', '1'])
})
