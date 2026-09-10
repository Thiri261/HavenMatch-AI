const VALID_INTENTS = new Set(['rent', 'buy', 'land'])
const RENT_HOME_TYPES = new Set(['apartment', 'condominium', 'house', 'shared_apartment'])
const BUY_HOME_TYPES = new Set(['apartment', 'condominium', 'house'])

const PROPERTY_TYPE_ALIASES = {
  apartment: 'apartment', condo: 'condominium', condominium: 'condominium',
  house: 'house', shared: 'shared_apartment', shared_home: 'shared_apartment',
  shared_apartment: 'shared_apartment', land: 'vacant_land', vacant_land: 'vacant_land',
}

const FACILITY_ALIASES = {
  reliable_electricity: 'reliable_electricity', electricity: 'reliable_electricity',
  generator_backup_power: 'generator', backup_power: 'generator', generator: 'generator',
  reliable_water: 'reliable_water', water: 'reliable_water',
  wi_fi_internet: 'internet_ready', wifi_internet: 'internet_ready', internet: 'internet_ready', internet_ready: 'internet_ready',
  air_conditioning: 'air_conditioning', parking: 'parking', security: 'security', pets_allowed: 'pets_allowed',
  near_shops_or_markets: 'near_shops', near_shops: 'near_shops', shops: 'near_shops',
  near_ybs_bus_stop: 'near_bus_stop', near_bus_stop: 'near_bus_stop',
  near_main_road: 'main_road_access', main_road_access: 'main_road_access',
}

export const FACILITY_RULES = [
  ['reliable_electricity', 'reliableElectricity', 'reliable electricity'],
  ['generator', 'generator', 'generator or backup power'],
  ['reliable_water', 'reliableWater', 'a reliable water supply'],
  ['internet_ready', 'internetReady', 'internet readiness'],
  ['air_conditioning', 'airConditioning', 'air conditioning'],
  ['parking', 'parking', 'parking'],
  ['security', 'security', 'security'],
  ['pets_allowed', 'petFriendly', 'pet-friendly accommodation'],
  ['near_shops', 'nearShops', 'nearby shops or markets'],
  ['near_bus_stop', 'nearBusStop', 'a nearby YBS bus stop'],
  ['main_road_access', 'mainRoadAccess', 'main-road access'],
]

const REASON_TEXT = {
  within_budget: 'This property is within your maximum budget.',
  preferred_township: 'It is located in your preferred township.',
  preferred_property_type: 'It matches your preferred property type.',
  enough_bedrooms: 'It provides the required number of bedrooms.',
  enough_bathrooms: 'It provides the required number of bathrooms.',
  sufficient_area: 'Its listed area meets your minimum size requirement.',
  reliable_electricity_available: 'The listing confirms reliable electricity.',
  backup_power_available: 'The listing confirms generator or backup power.',
  reliable_water_available: 'The listing confirms a reliable water supply.',
  internet_available: 'The listing confirms internet readiness.',
  air_conditioning_available: 'The listing confirms air conditioning.',
  parking_available: 'The listing confirms parking availability.',
  security_available: 'The listing confirms security.',
  pets_allowed: 'The listing confirms that pets are allowed.',
  near_shops: 'The listing confirms nearby shops or markets.',
  near_bus_stop: 'The listing confirms a nearby YBS bus stop.',
  main_road_access: 'The listing confirms main-road access.',
}

const REASON_BY_FACILITY = {
  reliable_electricity: 'reliable_electricity_available', generator: 'backup_power_available',
  reliable_water: 'reliable_water_available', internet_ready: 'internet_available',
  air_conditioning: 'air_conditioning_available', parking: 'parking_available', security: 'security_available',
  pets_allowed: 'pets_allowed', near_shops: 'near_shops', near_bus_stop: 'near_bus_stop', main_road_access: 'main_road_access',
}

const PROPERTY_FIELD_BY_REASON = {
  within_budget: 'priceMmk', preferred_township: 'township', preferred_property_type: 'propertyType',
  enough_bedrooms: 'bedrooms', enough_bathrooms: 'bathrooms', sufficient_area: 'areaSqft',
  ...Object.fromEntries(FACILITY_RULES.map(([requestKey, propertyKey]) => [REASON_BY_FACILITY[requestKey], propertyKey])),
}

const FAILED_REQUIREMENT_TEXT = {
  over_budget: 'Price is above your maximum budget.',
  different_township: 'Located outside your preferred township.',
  different_property_type: 'Property type differs from your selection.',
  not_enough_bedrooms: 'Has fewer bedrooms than requested.',
  not_enough_bathrooms: 'Has fewer bathrooms than requested.',
  area_too_small: 'Listed area is below your minimum size.',
}

export class MatchValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MatchValidationError'
    this.statusCode = 400
  }
}

export function isPropertyEligibleForIntent(property, intent) {
  if (!property || property.listingType !== intent) return false
  if (intent === 'land') return property.propertyType === 'vacant_land'
  if (intent === 'rent') return RENT_HOME_TYPES.has(property.propertyType)
  if (intent === 'buy') return BUY_HOME_TYPES.has(property.propertyType)
  return false
}

const normalizeKey = (value) => String(value ?? '').trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const match = String(value).replaceAll(',', '').trim().match(/^-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

function normalizePriority(value) {
  const priority = normalizeKey(value)
  if (priority === 'must' || priority === 'must_have') return 'must_have'
  if (priority === 'prefer' || priority === 'preferred') return 'prefer'
  return null
}

function normalizeFacilities(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const facilities = {}
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = FACILITY_ALIASES[normalizeKey(rawKey)]
    const priority = normalizePriority(rawValue)
    if (key && priority) facilities[key] = priority
  }
  return facilities
}

function booleanPreference(value) {
  const normalized = normalizeKey(value)
  if (value === true || normalized === 'yes' || normalized === 'true') return true
  if (value === false || normalized === 'no' || normalized === 'false') return false
  return null
}

export function normalizeRequest(input = {}) {
  const intent = normalizeKey(input.intent)
  const rawType = normalizeKey(input.propertyType)
  const facilities = normalizeFacilities(input.facilities)
  const pets = booleanPreference(input.pets)
  if (pets === true && !facilities.pets_allowed) facilities.pets_allowed = 'must_have'

  return {
    intent: VALID_INTENTS.has(intent) ? intent : intent || null,
    maximumBudget: numberOrNull(input.maximumBudget ?? input.budget),
    township: input.township && normalizeKey(input.township) !== 'all_yangon' ? normalizeKey(input.township) : null,
    propertyType: intent === 'land' ? 'vacant_land' : PROPERTY_TYPE_ALIASES[rawType] || (rawType && rawType !== 'any_type' ? rawType : null),
    bedrooms: numberOrNull(input.bedrooms ?? input.beds),
    bathrooms: numberOrNull(input.bathrooms),
    minimumAreaSqft: numberOrNull(input.minimumAreaSqft ?? input.areaSqft),
    pets,
    facilities,
  }
}

const supplied = (value) => value !== '' && value !== null && value !== undefined

export function validateMatchRequest(input, request = normalizeRequest(input)) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new MatchValidationError('Request body must be a JSON object.')
  if (!VALID_INTENTS.has(request.intent)) throw new MatchValidationError('Choose whether you want to rent, buy a home, or buy land.')
  if (supplied(input.maximumBudget ?? input.budget) && request.maximumBudget === null) throw new MatchValidationError('Maximum budget must be a number.')
  if (request.maximumBudget !== null && request.maximumBudget <= 0) throw new MatchValidationError('Maximum budget must be greater than zero.')

  const numericFields = [
    ['Bedrooms', input.bedrooms ?? input.beds, request.bedrooms],
    ['Bathrooms', input.bathrooms, request.bathrooms],
    ['Minimum area', input.minimumAreaSqft ?? input.areaSqft, request.minimumAreaSqft],
  ]
  for (const [label, raw, normalized] of numericFields) {
    if (supplied(raw) && normalized === null) throw new MatchValidationError(`${label} must be a number.`)
    if (normalized !== null && normalized < 0) throw new MatchValidationError(`${label} cannot be negative.`)
  }
  if (supplied(input.facilities) && (!input.facilities || typeof input.facilities !== 'object' || Array.isArray(input.facilities))) {
    throw new MatchValidationError('Facilities must be a JSON object.')
  }
  return request
}

const mustHave = (facilities, key) => facilities[key] === 'must_have'
const preferred = (facilities, key) => facilities[key] === 'prefer' || facilities[key] === 'must_have'

function propertyTypeMatches(actual, requested) {
  if (!requested) return true
  if (requested === 'apartment') return actual === 'apartment' || actual === 'condominium'
  return actual === requested
}

export function calculateSelectedWeight(request) {
  let weight = 0
  if (request.maximumBudget !== null) weight += 40
  if (request.township) weight += 25
  // Land purpose already limits candidates to land, so its automatic
  // vacant-land type is a filter rather than a scored preference.
  if (request.propertyType && request.intent !== 'land') weight += 10
  if (request.bedrooms !== null) weight += 20
  if (request.bathrooms !== null) weight += 5
  if (request.minimumAreaSqft !== null) weight += 5
  for (const [requestKey] of FACILITY_RULES) {
    if (mustHave(request.facilities, requestKey)) weight += 3
    else if (preferred(request.facilities, requestKey)) weight += 2
  }
  return weight
}

export function calculateMatch(property, request) {
  const reasons = []
  const failedRequirements = []
  let matchedWeight = 0
  const add = (points, reason) => { matchedWeight += points; reasons.push(reason) }

  if (property.listingType !== request.intent) failedRequirements.push('different_listing_type')
  if (request.maximumBudget !== null && property.priceMmk > request.maximumBudget) failedRequirements.push('over_budget')
  else if (request.maximumBudget !== null) add(40, 'within_budget')
  if (request.township && property.township !== request.township) failedRequirements.push('different_township')
  else if (request.township) add(25, 'preferred_township')
  if (request.propertyType && !propertyTypeMatches(property.propertyType, request.propertyType)) failedRequirements.push('different_property_type')
  else if (request.propertyType && request.intent !== 'land') add(10, 'preferred_property_type')

  if (request.bedrooms !== null) {
    if (!Number.isFinite(property.bedrooms) || property.bedrooms < request.bedrooms) failedRequirements.push('not_enough_bedrooms')
    else add(20, 'enough_bedrooms')
  }
  if (request.bathrooms !== null && Number.isFinite(property.bathrooms)) {
    if (property.bathrooms < request.bathrooms) failedRequirements.push('not_enough_bathrooms')
    else add(5, 'enough_bathrooms')
  }
  if (request.minimumAreaSqft !== null && Number.isFinite(property.areaSqft)) {
    if (property.areaSqft < request.minimumAreaSqft) failedRequirements.push('area_too_small')
    else add(5, 'sufficient_area')
  }

  for (const [requestKey, propertyKey] of FACILITY_RULES) {
    if (!preferred(request.facilities, requestKey)) continue
    const actual = property[propertyKey]
    if (mustHave(request.facilities, requestKey) && actual === false) failedRequirements.push(`${requestKey}_required`)
    else if (actual === true) add(mustHave(request.facilities, requestKey) ? 3 : 2, REASON_BY_FACILITY[requestKey])
  }
  const selectedWeight = calculateSelectedWeight(request)
  const scoreStatus = selectedWeight === 0 ? 'not_scored' : 'scored'
  const score = selectedWeight === 0 ? 0 : Math.min(100, Math.round((matchedWeight / selectedWeight) * 100))
  return { score, scoreStatus, matchedWeight, selectedWeight, reasons, failedRequirements }
}

function buildWarnings(property, request) {
  const warnings = []
  const add = (code, text) => warnings.push({ code, text })
  for (const failure of Array.isArray(property.failedRequirements) ? property.failedRequirements : []) {
    const facilityKey = failure.endsWith('_required') ? failure.slice(0, -'_required'.length) : null
    const facility = facilityKey ? FACILITY_RULES.find(([requestKey]) => requestKey === facilityKey) : null
    const text = FAILED_REQUIREMENT_TEXT[failure] || (facility ? `Does not meet your must-have requirement for ${facility[2]}.` : String(failure).replaceAll('_', ' '))
    add(`unmet_${failure}`, text)
  }
  if (request.bathrooms !== null && !Number.isFinite(property.bathrooms)) {
    add('bathroom_information_unavailable', 'The listing does not state the bathroom count; verify it with the agent.')
  }
  if (request.minimumAreaSqft !== null && !Number.isFinite(property.areaSqft)) {
    add('area_information_unavailable', 'The listing does not state a usable area; verify the size before deciding.')
  }
  for (const [requestKey, propertyKey, label] of FACILITY_RULES) {
    if (preferred(request.facilities, requestKey) && (property[propertyKey] === null || property[propertyKey] === undefined)) {
      add(`${requestKey}_information_unavailable`, `The listing does not confirm ${label}; verify it with the agent.`)
    }
  }
  const syntheticFields = new Set(Array.isArray(property.syntheticFields) ? property.syntheticFields : [])
  const selectedSyntheticFields = []
  if (request.bedrooms !== null && syntheticFields.has('bedrooms')) selectedSyntheticFields.push('bedrooms')
  if (request.bathrooms !== null && syntheticFields.has('bathrooms')) selectedSyntheticFields.push('bathrooms')
  if (request.minimumAreaSqft !== null && syntheticFields.has('areaSqft')) selectedSyntheticFields.push('areaSqft')
  for (const [requestKey, propertyKey] of FACILITY_RULES) {
    if (preferred(request.facilities, requestKey) && syntheticFields.has(propertyKey)) selectedSyntheticFields.push(propertyKey)
  }
  if (selectedSyntheticFields.length) {
    add(
      'synthetic_demo_data_used',
      `Demo-generated values influenced this match: ${[...new Set(selectedSyntheticFields)].join(', ')}. Verify them on the original listing before making a decision.`,
    )
  }
  return warnings
}

export function enrichMatch(match, request) {
  // Keep API explanations stable even if an external rule engine emits the
  // same reason more than once.
  const reasons = [...new Set(Array.isArray(match.reasons) ? match.reasons : [])]
  const syntheticFields = new Set(Array.isArray(match.syntheticFields) ? match.syntheticFields : [])
  const explanations = reasons.map((code) => {
    const text = REASON_TEXT[code] || String(code).replaceAll('_', ' ')
    const isSynthetic = syntheticFields.has(PROPERTY_FIELD_BY_REASON[code])
    return { code, text: isSynthetic ? `Demo estimate: ${text.replace(/^The listing confirms /, '').replace(/^It /, 'it ').replace(/^This property /, 'this property ')}` : text, isSynthetic }
  })
  const warnings = buildWarnings(match, request)
  const selectedWeight = Number.isFinite(Number(match.selectedWeight)) ? Number(match.selectedWeight) : calculateSelectedWeight(request)
  const matchedWeight = Number.isFinite(Number(match.matchedWeight)) ? Number(match.matchedWeight) : null
  const scoreStatus = match.scoreStatus === 'not_scored' || selectedWeight === 0 ? 'not_scored' : 'scored'
  return {
    ...match,
    score: scoreStatus === 'not_scored' ? 0 : Math.max(0, Math.min(100, Number(match.score) || 0)),
    scoreStatus,
    matchedWeight,
    selectedWeight,
    reasons,
    explanations,
    warnings,
    dataQuality: syntheticFields.size ? 'contains_synthetic_demo_data' : 'source_listing_data',
    isPartialMatch: match.isPartialMatch === true,
    explanationSummary: `${explanations.length} preference${explanations.length === 1 ? '' : 's'} matched${warnings.length ? `; ${warnings.length} listing detail${warnings.length === 1 ? '' : 's'} need verification` : ''}.`,
  }
}
