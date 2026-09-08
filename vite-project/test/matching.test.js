/* global process */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateMatch,
  enrichMatch,
  isPropertyEligibleForIntent,
  matchProperties,
  normalizeRequest,
  validateMatchRequest,
} from '../server/matching.js'

const property = {
  id: 'test-rent-1', listingType: 'rent', propertyType: 'condominium', title: 'Test Condo',
  township: 'hlaing', priceMmk: 2_500_000, bedrooms: 2, bathrooms: 2, areaSqft: 900,
  parking: true, security: null, petFriendly: null, generator: false,
  airConditioning: null, reliableWater: null, internetReady: true, nearShops: null,
  nearBusStop: null, mainRoadAccess: null,
}

test('normalizes property, township, pets, and facility aliases', () => {
  const request = normalizeRequest({
    intent: 'Rent', township: 'North-Dagon', propertyType: 'Apartment', pets: 'Yes',
    facilities: { 'Generator / backup power': 'Prefer', Parking: 'Must have' },
  })
  assert.equal(request.intent, 'rent')
  assert.equal(request.township, 'north_dagon')
  assert.equal(request.propertyType, 'apartment')
  assert.equal(request.pets, true)
  assert.deepEqual(request.facilities, { generator: 'prefer', parking: 'must_have', pets_allowed: 'must_have' })
})

test('rejects invalid matching requests', () => {
  assert.throws(() => validateMatchRequest({ intent: 'exchange' }), /Choose whether/)
  assert.throws(() => validateMatchRequest({ intent: 'rent', maximumBudget: 'unknown' }), /must be a number/)
  assert.throws(() => validateMatchRequest({ intent: 'rent', bedrooms: -1 }), /cannot be negative/)
  assert.throws(() => validateMatchRequest({ intent: 'rent', facilities: [] }), /JSON object/)
})

test('keeps home and land candidates in their intended search categories', () => {
  const rentalHouse = { listingType: 'rent', propertyType: 'house' }
  const rentalLand = { listingType: 'rent', propertyType: 'vacant_land' }
  const saleApartment = { listingType: 'buy', propertyType: 'apartment' }
  const saleLand = { listingType: 'land', propertyType: 'vacant_land' }

  assert.equal(isPropertyEligibleForIntent(rentalHouse, 'rent'), true)
  assert.equal(isPropertyEligibleForIntent(rentalLand, 'rent'), false)
  assert.equal(isPropertyEligibleForIntent(saleApartment, 'buy'), true)
  assert.equal(isPropertyEligibleForIntent(saleLand, 'land'), true)
  assert.equal(isPropertyEligibleForIntent(saleLand, 'buy'), false)
})

test('normalizes matched points against the selected criteria', () => {
  const request = normalizeRequest({ intent: 'rent', maximumBudget: 3_000_000, township: 'Hlaing', propertyType: 'Apartment', bedrooms: 2 })
  const result = calculateMatch(property, request)
  assert.equal(result.matchedWeight, 95)
  assert.equal(result.selectedWeight, 95)
  assert.equal(result.score, 100)
  assert.equal(result.scoreStatus, 'scored')
  assert.deepEqual(result.failedRequirements, [])
  assert.deepEqual(result.reasons, ['within_budget', 'preferred_township', 'preferred_property_type', 'enough_bedrooms'])
})

test('scores a single matched preference as 100 percent and marks empty preferences as not scored', () => {
  const typeOnly = calculateMatch(property, normalizeRequest({ intent: 'rent', propertyType: 'Apartment' }))
  assert.equal(typeOnly.matchedWeight, 10)
  assert.equal(typeOnly.selectedWeight, 10)
  assert.equal(typeOnly.score, 100)

  const noPreferences = calculateMatch(property, normalizeRequest({ intent: 'rent' }))
  assert.equal(noPreferences.selectedWeight, 0)
  assert.equal(noPreferences.score, 0)
  assert.equal(noPreferences.scoreStatus, 'not_scored')

  const landPurposeOnly = calculateMatch(
    { ...property, listingType: 'land', propertyType: 'vacant_land', bedrooms: null },
    normalizeRequest({ intent: 'land' }),
  )
  assert.equal(landPurposeOnly.selectedWeight, 0)
  assert.equal(landPurposeOnly.scoreStatus, 'not_scored')
  assert.ok(!landPurposeOnly.reasons.includes('preferred_property_type'))
})

test('removes over-budget and known-false must-have properties', () => {
  const overBudget = calculateMatch(property, normalizeRequest({ intent: 'rent', maximumBudget: 2_000_000 }))
  assert.ok(overBudget.failedRequirements.includes('over_budget'))

  const generatorRequired = calculateMatch(property, normalizeRequest({ intent: 'rent', facilities: { generator: 'must_have' } }))
  assert.ok(generatorRequired.failedRequirements.includes('generator_required'))
})

test('checks known land area but retains unknown area for verification', () => {
  const request = normalizeRequest({ intent: 'land', minimumAreaSqft: 2_500 })
  const small = calculateMatch({ ...property, listingType: 'land', propertyType: 'vacant_land', bedrooms: null, areaSqft: 2_400 }, request)
  assert.ok(small.failedRequirements.includes('area_too_small'))

  const unknown = calculateMatch({ ...property, listingType: 'land', propertyType: 'vacant_land', bedrooms: null, areaSqft: null }, request)
  assert.deepEqual(unknown.failedRequirements, [])
})

test('returns readable explanations and transparent unknown-data warnings', () => {
  const request = normalizeRequest({ intent: 'rent', maximumBudget: 3_000_000, bathrooms: 2, facilities: { parking: 'prefer', security: 'must_have' } })
  const scored = calculateMatch(property, request)
  const result = enrichMatch({ ...property, score: scored.score, reasons: scored.reasons }, request)
  assert.ok(result.explanations.some((item) => item.text === 'This property is within your maximum budget.'))
  assert.ok(result.explanations.some((item) => item.code === 'parking_available'))
  assert.ok(result.warnings.some((item) => item.code === 'security_information_unavailable'))
})

test('removes duplicate reason codes before building explanations', () => {
  const request = normalizeRequest({ intent: 'buy', propertyType: 'apartment' })
  const result = enrichMatch({
    ...property,
    listingType: 'buy',
    score: 100,
    selectedWeight: 10,
    matchedWeight: 10,
    reasons: ['preferred_property_type', 'preferred_property_type'],
  }, request)

  assert.deepEqual(result.reasons, ['preferred_property_type'])
  assert.equal(result.explanations.length, 1)
})

test('uses the real Prolog engine when SWIPL_PATH is configured', { skip: !process.env.SWIPL_PATH }, async () => {
  const result = await matchProperties({ intent: 'rent', maximumBudget: 3_000_000, township: 'hlaing', bedrooms: 2, propertyType: 'apartment' })
  assert.equal(result.engine, 'prolog')
  assert.ok(result.matches.length > 0)
  assert.equal(result.matches[0].id, 'real_rent_023')
  assert.equal(result.matches[0].score, 100)
  assert.equal(result.matches[0].matchedWeight, 95)
  assert.equal(result.matches[0].selectedWeight, 95)
  assert.equal(result.matches[0].reasons.length, new Set(result.matches[0].reasons).size)
})
