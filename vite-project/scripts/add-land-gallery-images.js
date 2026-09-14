import { readFile, writeFile } from 'node:fs/promises'

const dataPath = new URL('../server/data/properties.json', import.meta.url)
const landImageByListing = new Map([
  ['real_land_001', '/images/listing-land-walled-infill-01.png'],
  ['real_land_004', '/images/listing-land-cleared-residential-01.png'],
  ['real_land_005', '/images/listing-land-green-suburban-01.png'],
  ['real_rent_027', '/images/listing-land-corner-urban-01.png'],
  ['real_land_006', '/images/listing-land-roadside-outskirts-01.png'],
  ['real_land_011', '/images/listing-land-semirural-01.png'],
])

const properties = JSON.parse(await readFile(dataPath, 'utf8'))

for (const property of properties) {
  const landImage = landImageByListing.get(property.id)
  if (!landImage) continue

  const currentImages = Array.isArray(property.images)
    ? property.images
    : [property.imageUrl].filter(Boolean)

  property.images = [...new Set([...currentImages, landImage])]
}

await writeFile(dataPath, `${JSON.stringify(properties, null, 2)}\n`)
console.log(`Added generated land photos to ${landImageByListing.size} listing galleries.`)
