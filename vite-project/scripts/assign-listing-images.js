import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'server', 'data', 'properties.json')
const properties = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

const centralTownships = new Set([
  'ahlone', 'bahan', 'botahtaung', 'kamayut', 'kyauktada', 'kyimyindaing',
  'lanmadaw', 'mingala_taungnyunt', 'pabedan', 'sanchaung', 'tamwe', 'yankin',
])

const imagePools = {
  apartmentBasic: [
    '/images/user-apartment-basic-01.png',
    '/images/user-apartment-basic-02.png',
    '/images/user-apartment-empty-01.png',
    '/images/user-apartment-empty-02.png',
    '/images/user-apartment-hallway-01.png',
    '/images/user-apartment-furnished-01.png',
  ],
  apartmentModern: [
    '/images/user-apartment-room-modern-01.png',
    '/images/apartment-bedroom.png',
    '/images/apartment-kitchen.png',
    '/images/one-bedroom.png',
    '/images/shared-apartment.png',
    '/images/myanmar-apartment-interior.png',
    '/images/myanmar-apartment-interior-2.png',
  ],
  condoStandard: [
    '/images/user-condo-exterior-01.png',
    '/images/user-condo-exterior-02.png',
    '/images/user-condo-interior-01.png',
    '/images/user-condo-interior-02.png',
    '/images/user-condo-bedroom-01.png',
    '/images/myanmar-condo-exterior.png',
  ],
  condoPremium: [
    '/images/user-condo-interior-premium-01.png',
    '/images/myanmar-condo-exterior-2.png',
    '/images/myanmar-condo-interior-2.png',
    '/images/two-bedroom.png',
  ],
  houseStandard: [
    '/images/myanmar-house-compact-2.png',
    '/images/myanmar-house-exterior.png',
    '/images/house-listing-1.png',
    '/images/house-listing-2.png',
    '/images/house-listing-3.png',
    '/images/house-listing-4.png',
    '/images/user-house-interior-empty-01.png',
  ],
  houseLarge: [
    '/images/myanmar-house-large-2.png',
    '/images/house-listing-5.png',
    '/images/house-listing-6.png',
    '/images/house-listing-7.png',
    '/images/user-house-interior-lived-01.png',
    '/images/user-house-interior-modern-01.png',
  ],
  landUrban: [
    '/images/myanmar-land-urban-2.png',
    '/images/land-frontage.png',
    '/images/myanmar-vacant-land.png',
  ],
  landSuburban: [
    '/images/myanmar-land-suburban-2.png',
    '/images/land-roadside.png',
    '/images/land-sunset.png',
  ],
}

const poolPositions = new Map()

function nextFromPool(pool) {
  const position = poolPositions.get(pool) || 0
  poolPositions.set(pool, position + 1)
  return pool[position % pool.length]
}

function chooseImage(property) {
  let pool

  if (property.propertyType === 'vacant_land') {
    pool = centralTownships.has(property.township) ? imagePools.landUrban : imagePools.landSuburban
  } else if (property.propertyType === 'house') {
    pool = property.areaSqft >= 2400 || property.bedrooms >= 5
      ? imagePools.houseLarge
      : imagePools.houseStandard
  } else if (property.propertyType === 'condominium') {
    const premium = property.listingType === 'rent'
      ? property.priceMmk >= 4_000_000
      : property.priceMmk >= 500_000_000
    pool = premium ? imagePools.condoPremium : imagePools.condoStandard
  } else {
    pool = property.areaSqft >= 1200 || property.bedrooms >= 3
      ? imagePools.apartmentModern
      : imagePools.apartmentBasic
  }

  return nextFromPool(pool)
}

const updated = properties.map((property) => ({
  ...property,
  imageUrl: chooseImage(property),
}))

fs.writeFileSync(dataPath, `${JSON.stringify(updated, null, 2)}\n`)

const counts = updated.reduce((result, property) => {
  result[property.imageUrl] = (result[property.imageUrl] || 0) + 1
  return result
}, {})

console.log(`Assigned ${Object.keys(counts).length} images across ${updated.length} listings.`)
