import { readFile, writeFile } from 'node:fs/promises'

const dataPath = new URL('../server/data/properties.json', import.meta.url)
const roomImageByListing = new Map([
  ['real_rent_002', '/images/listing-bedroom-01.png'],
  ['real_rent_003', '/images/listing-kitchen-01.png'],
  ['real_rent_009', '/images/listing-kitchen-02.png'],
  ['real_rent_012', '/images/listing-living-room-01.png'],
  ['real_rent_018', '/images/listing-empty-room-01.png'],
  ['real_buy_003', '/images/listing-kitchen-03.png'],
  ['real_buy_014', '/images/listing-empty-room-02.png'],
  ['real_buy_036', '/images/listing-living-room-02.png'],
  ['real_buy_050', '/images/listing-empty-room-03.png'],
  ['real_buy_054', '/images/listing-living-room-03.png'],
  ['real_rent_005', '/images/listing-empty-room-04.png'],
  ['real_rent_021', '/images/listing-bathroom-laundry-01.png'],
  ['real_buy_002', '/images/listing-kitchen-04.png'],
  ['real_buy_044', '/images/listing-kitchen-05.png'],
  ['real_buy_055', '/images/listing-upstairs-landing-01.png'],
])

const properties = JSON.parse(await readFile(dataPath, 'utf8'))

for (const property of properties) {
  const roomImage = roomImageByListing.get(property.id)
  if (!roomImage) continue

  const currentImages = Array.isArray(property.images)
    ? property.images
    : [property.imageUrl].filter(Boolean)

  property.images = [...new Set([...currentImages, roomImage])]
}

await writeFile(dataPath, `${JSON.stringify(properties, null, 2)}\n`)
console.log(`Added categorized room photos to ${roomImageByListing.size} listing galleries.`)
