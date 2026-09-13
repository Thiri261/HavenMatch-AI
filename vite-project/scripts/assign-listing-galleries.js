import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'server', 'data', 'properties.json')
const properties = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

const pools = {
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
  land: [
    '/images/myanmar-land-urban-2.png',
    '/images/land-frontage.png',
    '/images/myanmar-vacant-land.png',
    '/images/myanmar-land-suburban-2.png',
    '/images/land-roadside.png',
    '/images/land-sunset.png',
  ],
}

function poolFor(property) {
  if (property.propertyType === 'vacant_land') return pools.land

  if (property.propertyType === 'house') {
    return property.areaSqft >= 2400 || property.bedrooms >= 5
      ? pools.houseLarge
      : pools.houseStandard
  }

  if (property.propertyType === 'condominium') {
    const premium = property.listingType === 'rent'
      ? property.priceMmk >= 4_000_000
      : property.priceMmk >= 500_000_000
    return premium ? pools.condoPremium : pools.condoStandard
  }

  return property.areaSqft >= 1200 || property.bedrooms >= 3
    ? pools.apartmentModern
    : pools.apartmentBasic
}

function galleryFor(property) {
  if (Array.isArray(property.images) && property.images.length >= 4) {
    return property.images.slice(0, 4)
  }

  const cover = property.imageUrl
  const pool = poolFor(property)
  const coverIndex = pool.indexOf(cover)
  const start = coverIndex >= 0 ? coverIndex : 0
  const gallery = cover ? [cover] : []

  for (let offset = 1; gallery.length < 4 && offset <= pool.length; offset += 1) {
    const candidate = pool[(start + offset) % pool.length]
    if (!gallery.includes(candidate)) gallery.push(candidate)
  }

  return gallery
}

const updated = properties.map((property) => ({
  ...property,
  images: galleryFor(property),
}))

fs.writeFileSync(dataPath, `${JSON.stringify(updated, null, 2)}\n`)

const invalid = updated.filter((property) => (
  property.images.length !== 4
  || property.images[0] !== property.imageUrl
  || new Set(property.images).size !== property.images.length
))

if (invalid.length > 0) {
  throw new Error(`Invalid galleries: ${invalid.map(({ id }) => id).join(', ')}`)
}

console.log(`Assigned four-photo galleries to ${updated.length} listings.`)
