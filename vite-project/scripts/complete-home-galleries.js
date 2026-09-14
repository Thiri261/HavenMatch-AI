import { readFile, writeFile } from 'node:fs/promises'

const dataPath = new URL('../server/data/properties.json', import.meta.url)

const pools = {
  exterior: {
    condominium: ['/images/myanmar-condo-exterior.png', '/images/myanmar-condo-exterior-2.png', '/images/user-condo-exterior-01.png', '/images/user-condo-exterior-02.png'],
    apartment: ['/images/user-condo-exterior-02.png', '/images/myanmar-condo-exterior.png'],
    house: ['/images/myanmar-house-exterior.png', '/images/house-listing-1.png', '/images/house-listing-2.png', '/images/house-listing-3.png', '/images/house-listing-4.png'],
  },
  living_room: ['/images/listing-living-room-01.png', '/images/listing-living-room-02.png', '/images/listing-living-room-03.png', '/images/myanmar-apartment-interior.png', '/images/myanmar-apartment-interior-2.png', '/images/user-condo-interior-01.png', '/images/user-condo-interior-02.png', '/images/user-house-interior-modern-01.png'],
  bedroom: ['/images/listing-bedroom-01.png', '/images/apartment-bedroom.png', '/images/myanmar-apartment-bedroom.png', '/images/one-bedroom.png', '/images/two-bedroom.png', '/images/user-condo-bedroom-01.png', '/images/real_rent_001-bedroom.png'],
  kitchen: ['/images/listing-kitchen-01.png', '/images/listing-kitchen-02.png', '/images/listing-kitchen-03.png', '/images/listing-kitchen-04.png', '/images/listing-kitchen-05.png', '/images/apartment-kitchen.png', '/images/myanmar-apartment-kitchen.png', '/images/real_rent_001-kitchen.png'],
  bathroom: ['/images/listing-bathroom-laundry-01.png'],
  alternate: ['/images/listing-empty-room-01.png', '/images/listing-empty-room-02.png', '/images/listing-empty-room-03.png', '/images/listing-empty-room-04.png', '/images/listing-upstairs-landing-01.png'],
}

function category(path) {
  if (/exterior|house-listing/i.test(path)) return 'exterior'
  if (/kitchen/i.test(path)) return 'kitchen'
  if (/bedroom|one-bedroom|two-bedroom/i.test(path)) return 'bedroom'
  if (/bathroom/i.test(path)) return 'bathroom'
  if (/living|interior|shared-apartment|room-modern|furnished|basic/i.test(path)) return 'living_room'
  return 'alternate'
}

function desiredCategories(property) {
  if (property.propertyType === 'apartment') return ['living_room', 'bedroom', 'kitchen', 'bathroom']
  if (property.propertyType === 'house' && property.bedrooms >= 5) return ['exterior', 'living_room', 'bedroom', 'kitchen', 'alternate']
  return ['exterior', 'living_room', 'bedroom', 'kitchen']
}

function pick(pool, used, offset) {
  for (let step = 0; step < pool.length; step += 1) {
    const candidate = pool[(offset + step) % pool.length]
    if (!used.has(candidate)) return candidate
  }
  return null
}

const properties = JSON.parse(await readFile(dataPath, 'utf8'))
let completed = 0
let added = 0

for (let index = 0; index < properties.length; index += 1) {
  const property = properties[index]
  if (/land/.test(String(property.propertyType))) continue

  const target = property.propertyType === 'house' && property.bedrooms >= 5 ? 5 : 4
  const images = [...new Set(property.images || [property.imageUrl].filter(Boolean))]
  if (images.length >= target) continue

  const used = new Set(images)
  const present = new Set(images.map(category))
  const wanted = desiredCategories(property)

  for (const roomCategory of wanted) {
    if (images.length >= target) break
    if (present.has(roomCategory)) continue
    const sourcePool = roomCategory === 'exterior' ? pools.exterior[property.propertyType] : pools[roomCategory]
    const selected = pick(sourcePool, used, index)
    if (!selected) continue
    images.push(selected)
    used.add(selected)
    present.add(roomCategory)
    added += 1
  }

  const fallback = [...pools.alternate, ...pools.bedroom, ...pools.living_room, ...pools.kitchen]
  while (images.length < target) {
    const selected = pick(fallback, used, index + images.length)
    if (!selected) throw new Error(`No unique gallery image available for ${property.id}`)
    images.push(selected)
    used.add(selected)
    added += 1
  }

  property.images = images
  completed += 1
}

await writeFile(dataPath, `${JSON.stringify(properties, null, 2)}\n`)
console.log(`Completed ${completed} galleries with ${added} categorized image assignments.`)
