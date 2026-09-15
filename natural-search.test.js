import test from 'node:test'
import assert from 'node:assert/strict'
import { parseNaturalSearch } from '../src/data/naturalSearch.js'

test('parses a detailed rental request', () => {
  const result = parseNaturalSearch('Find me a quiet two-bedroom apartment in Hlaing near YBS with parking and pets allowed under 2.5 million MMK')
  assert.equal(result.purpose, 'Rent')
  assert.equal(result.township, 'Hlaing')
  assert.equal(result.propertyType, 'Apartment')
  assert.equal(result.beds, '2')
  assert.equal(result.details.maximumBudget, 2_500_000)
  assert.equal(result.details.commute, 'Near YBS bus stop')
  assert.equal(result.details.pets, 'Yes')
  assert.equal(result.details.facilities.Parking, 'Prefer')
})

test('parses buy, bathroom, size, and must-have facilities', () => {
  const result = parseNaturalSearch('Buy a 3 bedroom house in Yankin with 2 bathrooms, at least 1200 sq ft, must have generator and reliable water, budget 900 million MMK')
  assert.equal(result.purpose, 'Buy')
  assert.equal(result.township, 'Yankin')
  assert.equal(result.beds, '3')
  assert.equal(result.details.bathrooms, '2 bathrooms')
  assert.equal(result.details.roomSize, '1,000 sq ft or more')
  assert.equal(result.details.maximumBudget, 900_000_000)
  assert.equal(result.details.facilities['Generator / backup power'], 'Must have')
})

test('parses land area and price', () => {
  const result = parseNaturalSearch('Land plot in South Dagon, minimum 5000 sq ft, under 1.5 billion MMK near main road')
  assert.equal(result.purpose, 'Land')
  assert.equal(result.township, 'South Dagon')
  assert.equal(result.details.landSizeSqft, 5000)
  assert.equal(result.details.maximumBudget, 1_500_000_000)
  assert.equal(result.details.commute, 'Near main road')
})
