import { readFile, writeFile } from 'node:fs/promises'

const propertiesUrl = new URL('../server/data/properties.json', import.meta.url)
const properties = JSON.parse(await readFile(propertiesUrl, 'utf8'))

function hash(value, salt = '') {
  let result = 2166136261
  for (const character of `${value}:${salt}`) {
    result ^= character.charCodeAt(0)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function choose(property, salt, values) {
  return values[hash(property.id, salt) % values.length]
}

function setSynthetic(property, field, value, syntheticFields) {
  if (property[field] !== null && property[field] !== undefined) return
  property[field] = value
  syntheticFields.push(field)
}

const facilityProfiles = {
  apartment: {
    reliableElectricity: [true, true, true, false], generator: [true, false, false],
    reliableWater: [true, true, true, false], internetReady: [true, true, false],
    airConditioning: [true, true, false], parking: [true, false, false], security: [true, true, false],
    petFriendly: [true, false, false], nearShops: [true, true, true, false],
    nearBusStop: [true, true, false], mainRoadAccess: [true, true, false],
  },
  condominium: {
    reliableElectricity: [true, true, true, false], generator: [true, true, false],
    reliableWater: [true, true, true, false], internetReady: [true, true, true, false],
    airConditioning: [true, true, true, false], parking: [true, true, false],
    security: [true, true, true, false], petFriendly: [true, false, false],
    nearShops: [true, true, false], nearBusStop: [true, true, false], mainRoadAccess: [true, true, false],
  },
  house: {
    reliableElectricity: [true, true, false], generator: [true, false], reliableWater: [true, true, false],
    internetReady: [true, true, false], airConditioning: [true, true, false],
    parking: [true, true, true, false], security: [true, false], petFriendly: [true, true, false],
    nearShops: [true, true, false], nearBusStop: [true, false], mainRoadAccess: [true, true, true, false],
  },
  shared_apartment: {
    reliableElectricity: [true, true, false], generator: [true, false, false], reliableWater: [true, true, false],
    internetReady: [true, true, true, false], airConditioning: [true, false], parking: [true, false, false],
    security: [true, false], petFriendly: [true, false, false], nearShops: [true, true, true, false],
    nearBusStop: [true, true, true, false], mainRoadAccess: [true, true, false],
  },
}

for (const property of properties) {
  const syntheticFields = Array.isArray(property.syntheticFields) ? [...property.syntheticFields] : []
  const isLand = property.propertyType === 'vacant_land'

  if (isLand) {
    setSynthetic(property, 'areaSqft', choose(property, 'land-area', [1200, 2400, 3600, 4800, 7200, 10800, 21780]), syntheticFields)
  } else {
    const bedroomOptions = property.propertyType === 'house'
      ? [2, 3, 3, 4, 5, 6]
      : property.propertyType === 'shared_apartment' ? [1] : [1, 2, 2, 3, 3, 4]
    setSynthetic(property, 'bedrooms', choose(property, 'bedrooms', bedroomOptions), syntheticFields)

    const bedroomCount = property.bedrooms || 1
    const bathroomOptions = bedroomCount <= 1 ? [1]
      : bedroomCount === 2 ? [1, 2]
        : bedroomCount === 3 ? [2, 2, 3] : [2, 3, 3, 4]
    setSynthetic(property, 'bathrooms', choose(property, 'bathrooms', bathroomOptions), syntheticFields)

    const areaOptions = property.propertyType === 'house'
      ? [1200, 1500, 1800, 2200, 2800, 3600]
      : property.propertyType === 'shared_apartment'
        ? [350, 450, 550, 650]
        : [450, 600, 750, 900, 1100, 1400, 1800]
    setSynthetic(property, 'areaSqft', choose(property, 'home-area', areaOptions), syntheticFields)

    const profile = facilityProfiles[property.propertyType] || facilityProfiles.apartment
    for (const [field, values] of Object.entries(profile)) {
      setSynthetic(property, field, choose(property, field, values), syntheticFields)
    }
  }

  if (syntheticFields.length) {
    property.syntheticFields = [...new Set(syntheticFields)].sort()
    property.hasSyntheticDemoData = true
  }
}

await writeFile(propertiesUrl, `${JSON.stringify(properties, null, 2)}\n`, 'utf8')
console.log(`Enriched ${properties.length} properties with deterministic synthetic demo values.`)
