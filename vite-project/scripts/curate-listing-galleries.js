import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'server', 'data', 'properties.json')
const properties = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

const image = (name) => `/images/${name}`

const relatedByCover = new Map([
  ['user-apartment-basic-01.png', ['user-apartment-basic-02.png']],
  ['user-apartment-basic-02.png', ['user-apartment-basic-01.png']],
  ['user-apartment-empty-01.png', ['user-apartment-room-modern-01.png']],
  ['user-apartment-empty-02.png', ['user-apartment-hallway-01.png']],
  ['user-apartment-hallway-01.png', ['user-apartment-empty-02.png']],
  ['user-apartment-furnished-01.png', ['user-apartment-basic-01.png', 'user-apartment-basic-02.png']],
  ['user-apartment-room-modern-01.png', ['user-apartment-empty-01.png']],
  ['apartment-bedroom.png', ['apartment-kitchen.png', 'one-bedroom.png', 'shared-apartment.png']],
  ['apartment-kitchen.png', ['apartment-bedroom.png', 'one-bedroom.png', 'shared-apartment.png']],
  ['one-bedroom.png', ['shared-apartment.png', 'apartment-bedroom.png', 'apartment-kitchen.png']],
  ['shared-apartment.png', ['one-bedroom.png', 'apartment-bedroom.png', 'apartment-kitchen.png']],
  ['myanmar-apartment-interior.png', ['myanmar-apartment-bedroom.png', 'myanmar-apartment-kitchen.png']],
  ['myanmar-apartment-interior-2.png', ['myanmar-apartment-bedroom.png', 'myanmar-apartment-kitchen.png']],

  ['user-condo-exterior-01.png', ['myanmar-condo-exterior-2.png']],
  ['myanmar-condo-exterior-2.png', ['user-condo-exterior-01.png']],
  ['user-condo-exterior-02.png', ['user-condo-bedroom-01.png']],
  ['myanmar-condo-exterior.png', ['user-condo-interior-02.png']],
  ['user-condo-interior-01.png', ['myanmar-condo-interior-2.png']],
  ['user-condo-interior-02.png', ['user-condo-bedroom-01.png']],
  ['user-condo-bedroom-01.png', ['user-condo-interior-02.png']],
  ['user-condo-interior-premium-01.png', [
    'real_rent_001-bedroom.png',
    'real_rent_001-kitchen.png',
    'real_rent_001-balcony.png',
  ]],
  ['myanmar-condo-interior-2.png', ['two-bedroom.png', 'apartment-bedroom.png']],
  ['two-bedroom.png', ['apartment-bedroom.png', 'apartment-kitchen.png', 'shared-apartment.png']],

  ['myanmar-house-compact-2.png', ['house-listing-1.png', 'house-listing-2.png']],
  ['myanmar-house-exterior.png', ['myanmar-house-large-2.png']],
  ['myanmar-house-large-2.png', ['myanmar-house-exterior.png']],
  ['house-listing-1.png', ['house-listing-2.png', 'house-listing-3.png']],
  ['house-listing-2.png', ['house-listing-1.png', 'house-listing-3.png']],
  ['house-listing-3.png', ['house-listing-1.png', 'house-listing-2.png']],
  ['house-listing-4.png', ['house-listing-5.png', 'house-listing-6.png', 'house-listing-7.png']],
  ['house-listing-5.png', ['house-listing-4.png', 'house-listing-6.png', 'house-listing-7.png']],
  ['house-listing-6.png', ['house-listing-4.png', 'house-listing-5.png', 'house-listing-7.png']],
  ['house-listing-7.png', ['house-listing-4.png', 'house-listing-5.png', 'house-listing-6.png']],
  ['user-house-interior-empty-01.png', ['house-listing-4.png']],
  ['user-house-interior-lived-01.png', ['user-house-interior-modern-01.png']],
  ['user-house-interior-modern-01.png', ['user-house-interior-lived-01.png']],

  ['myanmar-land-urban-2.png', ['land-frontage.png']],
  ['land-frontage.png', ['myanmar-vacant-land.png']],
  ['myanmar-vacant-land.png', ['land-frontage.png']],
  ['myanmar-land-suburban-2.png', ['land-roadside.png', 'land-sunset.png', 'myanmar-vacant-land.png']],
  ['land-roadside.png', ['myanmar-land-suburban-2.png', 'land-sunset.png']],
  ['land-sunset.png', ['land-roadside.png', 'myanmar-land-suburban-2.png']],
])

function curatedGallery(property) {
  if (property.id === 'real_rent_001') return property.images.slice(0, 4)

  const coverName = path.posix.basename(property.imageUrl)
  const related = relatedByCover.get(coverName)
  if (!related) throw new Error(`No curated gallery mapping for ${property.id}: ${coverName}`)

  return [property.imageUrl, ...related.map(image)].slice(0, 4)
}

const updated = properties.map((property) => ({
  ...property,
  images: curatedGallery(property),
}))

const invalid = updated.filter((property) => (
  property.images.length < 2
  || property.images.length > 4
  || property.images[0] !== property.imageUrl
  || new Set(property.images).size !== property.images.length
))

if (invalid.length > 0) {
  throw new Error(`Invalid curated galleries: ${invalid.map(({ id }) => id).join(', ')}`)
}

fs.writeFileSync(dataPath, `${JSON.stringify(updated, null, 2)}\n`)
console.log(`Curated ${updated.length} galleries to contain two to four related photos.`)
