import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const propertiesPath = path.join(projectRoot, 'server', 'data', 'properties.json')
const properties = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'))

const resolveImage = (imageUrl) => imageUrl.startsWith('/api/uploads/')
  ? path.join(projectRoot, 'server', 'data', 'uploads', imageUrl.replace(/^\/api\/uploads\//, ''))
  : path.join(projectRoot, 'public', imageUrl.replace(/^\//, ''))

const sameScenePairs = [
  ['/images/myanmar-apartment-interior.png', '/images/myanmar-apartment-interior-2.png'],
  ['/images/user-condo-exterior-02.png', '/images/myanmar-condo-exterior.png'],
]

test('every property has a valid two-to-four-photo gallery', () => {
  for (const property of properties) {
    assert.ok(property.images?.length >= 2, `${property.id} must have at least two photos`)
    assert.ok(property.images.length <= 4, `${property.id} must have at most four photos`)
    assert.equal(property.images[0], property.imageUrl, `${property.id} cover photo must be first`)
    assert.equal(
      new Set(property.images).size,
      property.images.length,
      `${property.id} must not repeat a photo`,
    )

    for (const imageUrl of property.images) {
      assert.equal(fs.existsSync(resolveImage(imageUrl)), true, `${property.id} is missing ${imageUrl}`)
    }
  }
})

test('a gallery never includes two angles of the same room', () => {
  for (const property of properties) {
    for (const [first, second] of sameScenePairs) {
      assert.equal(
        property.images.includes(first) && property.images.includes(second),
        false,
        `${property.id} repeats the same room from two angles`,
      )
    }
  }
})
