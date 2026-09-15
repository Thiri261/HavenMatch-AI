const TOWNSHIPS = [
  'Ahlone', 'Bahan', 'Botahtaung', 'Dala', 'East Dagon', 'Hlaing', 'Insein', 'Kamayut',
  'Kyauktada', 'Kyimyindaing', 'Lanmadaw', 'Mayangone', 'Mingala Taungnyunt', 'Mingaladon',
  'North Dagon', 'North Okkalapa', 'Pabedan', 'Sanchaung', 'Shwepyithar', 'South Dagon',
  'South Okkalapa', 'Tamwe', 'Thanlyin', 'Thaketa', 'Thingangyun', 'Yankin',
]

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }

function firstNumber(query, expression) {
  const match = query.match(expression)
  if (!match) return null
  return Number(NUMBER_WORDS[match[1]] || match[1].replaceAll(',', ''))
}

function parseBudget(query) {
  const match = query.match(/(?:under|below|maximum|max|up to|budget(?: of)?|less than)\s*(?:mmk\s*)?([\d,.]+(?:\.\d+)?)\s*(billion|million|m|k|thousand)?(?:\s*mmk)?/i)
  if (!match) return null
  const amount = Number(match[1].replaceAll(',', ''))
  const multiplier = { billion: 1_000_000_000, million: 1_000_000, m: 1_000_000, k: 1_000, thousand: 1_000 }[match[2]?.toLowerCase()] || 1
  const value = Math.round(amount * multiplier)
  return Number.isFinite(value) && value > 0 ? value : null
}

function selectedFacilities(query) {
  const facilities = {}
  const phrases = [
    ['Reliable electricity', /reliable electricity|stable electricity/],
    ['Generator / backup power', /generator|backup power/],
    ['Reliable water', /reliable water|water supply/],
    ['Wi-Fi / internet', /wi[ -]?fi|internet/],
    ['Air conditioning', /air con(?:ditioning)?|aircon|\ba\/c\b/],
    ['Parking', /parking|car park/],
    ['Pets allowed', /pet[ -]?friendly|pets? allowed|with (?:a )?pet/],
    ['Near shops or markets', /near (?:shops?|markets?)|close to (?:shops?|markets?)/],
  ]
  for (const [name, expression] of phrases) {
    if (expression.test(query)) facilities[name] = /must have|required|essential/.test(query) ? 'Must have' : 'Prefer'
  }
  return facilities
}

export function parseNaturalSearch(input) {
  const query = String(input || '').trim().toLowerCase()
  if (!query) return null

  const township = TOWNSHIPS.find((name) => query.includes(name.toLowerCase())) || 'All Yangon'
  const purpose = /\bland\b|plot/.test(query) ? 'Land' : /\bbuy\b|for sale|purchase/.test(query) ? 'Buy' : 'Rent'
  const bedrooms = firstNumber(query, /\b(one|two|three|four|five|six|[1-6])[ -]*(?:\+\s*)?(?:bed|bedroom)/)
  const bathrooms = firstNumber(query, /\b(one|two|three|four|five|six|[1-6])[ -]*(?:\+\s*)?(?:bath|bathroom)/)
  const area = firstNumber(query, /(?:at least|minimum|min|over)?\s*([\d,]+)\s*(?:sq\.?\s*ft|square feet)/)
  const budget = parseBudget(query)

  let propertyType = 'Any type'
  if (/\bcondo(?:minium)?\b/.test(query)) propertyType = 'Apartment'
  else if (/shared (?:home|apartment|room)/.test(query)) propertyType = 'Shared home'
  else if (/\bapartment\b|\bflat\b/.test(query)) propertyType = 'Apartment'
  else if (/\bhouse\b|\bhome\b/.test(query)) propertyType = 'House'

  let roomSize = ''
  if (area >= 1_000) roomSize = '1,000 sq ft or more'
  else if (area >= 500) roomSize = '500–999 sq ft'
  else if (area !== null) roomSize = 'Under 500 sq ft'

  const pets = /no pets?|without pets?/.test(query) ? 'No' : /pet[ -]?friendly|pets? allowed|with (?:a )?pet/.test(query) ? 'Yes' : ''
  const commute = /ybs|bus stop/.test(query) ? 'Near YBS bus stop' : /main road/.test(query) ? 'Near main road' : /short commute|near (?:work|school|university)/.test(query) ? 'Short commute' : ''
  const areaPreference = /quiet|residential/.test(query) ? 'Quiet residential area' : /city cent(?:re|er)|downtown/.test(query) ? 'City centre' : /suburban/.test(query) ? 'Suburban area' : /near (?:shops?|markets?)/.test(query) ? 'Near shops and markets' : ''

  return {
    purpose,
    township,
    propertyType: purpose === 'Land' ? 'Any type' : propertyType,
    beds: bedrooms === null ? 'Any beds' : String(bedrooms),
    details: {
      bathrooms: bathrooms === null ? '' : `${bathrooms} bathroom${bathrooms === 1 ? '' : 's'}`,
      roomSize,
      pets,
      commute,
      area: areaPreference,
      facilities: selectedFacilities(query),
      maximumBudget: budget,
      landSizeSqft: purpose === 'Land' ? area : null,
    },
  }
}
