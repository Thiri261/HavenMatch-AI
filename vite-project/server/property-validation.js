const LISTING_TYPES = new Set(['rent', 'buy', 'land'])
const HOME_TYPES = new Set(['apartment', 'condominium', 'house', 'shared_apartment'])
const LAND_TYPES = new Set(['vacant_land'])
const LISTING_STATUSES = new Set(['draft', 'available', 'unavailable'])

export class PropertyValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PropertyValidationError'
    this.statusCode = 400
  }
}

const normalizedKey = (value) => String(value ?? '').trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

function requiredNumber(value, label, { integer = true, minimum = 1 } = {}) {
  if (value === '' || value === null || value === undefined) throw new PropertyValidationError(`${label} is required.`)
  const number = Number(value)
  if (!Number.isFinite(number) || (integer && !Number.isInteger(number)) || number < minimum) {
    throw new PropertyValidationError(`${label} must be ${integer ? 'a whole number' : 'a number'} of at least ${minimum}.`)
  }
  return number
}

function optionalNumber(value, label, { minimum = 0 } = {}) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  if (!Number.isFinite(number) || !Number.isInteger(number) || number < minimum) {
    throw new PropertyValidationError(`${label} must be a whole number of at least ${minimum}.`)
  }
  return number
}

export function validatePropertyInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PropertyValidationError('Property data must be a JSON object.')

  const title = String(input.title || '').trim()
  if (title.length < 3 || title.length > 150) throw new PropertyValidationError('Title must contain between 3 and 150 characters.')

  const listingType = normalizedKey(input.listingType)
  if (!LISTING_TYPES.has(listingType)) throw new PropertyValidationError('Listing type must be rent, buy, or land.')

  const propertyType = normalizedKey(input.propertyType)
  const allowedTypes = listingType === 'land' ? LAND_TYPES : HOME_TYPES
  if (!allowedTypes.has(propertyType)) throw new PropertyValidationError(listingType === 'land' ? 'Land listings must use the vacant_land property type.' : 'Choose a valid home property type.')

  const township = normalizedKey(input.township)
  if (!township || township.length > 60) throw new PropertyValidationError('Township is required and must not exceed 60 characters.')

  const availabilityStatus = normalizedKey(input.availabilityStatus || 'draft')
  if (!LISTING_STATUSES.has(availabilityStatus)) throw new PropertyValidationError('Availability must be draft, available, or unavailable.')

  const bedrooms = listingType === 'land' ? null : optionalNumber(input.bedrooms, 'Bedrooms')
  const bathrooms = listingType === 'land' ? null : optionalNumber(input.bathrooms, 'Bathrooms')
  const images = Array.isArray(input.images) ? input.images.map((image) => String(image || '').trim()).filter(Boolean) : []
  if (images.length < 2 || images.length > 4) throw new PropertyValidationError('Add between 2 and 4 property images.')
  if (new Set(images).size !== images.length) throw new PropertyValidationError('Property images must not be repeated.')
  if (images.some((image) => !/^(?:\/|https?:\/\/)/i.test(image))) throw new PropertyValidationError('Each property image must use a local /images path or an http(s) URL.')

  return {
    ...input,
    title,
    listingType,
    propertyType,
    township,
    availabilityStatus,
    priceMmk: requiredNumber(input.priceMmk, 'Price'),
    areaSqft: requiredNumber(input.areaSqft, 'Area'),
    bedrooms,
    bathrooms,
    floor: listingType === 'land' ? null : optionalNumber(input.floor, 'Floor'),
    maxOccupants: listingType === 'land' ? null : optionalNumber(input.maxOccupants, 'Maximum occupants', { minimum: 1 }),
    imageUrl: images[0],
    images,
  }
}

export function validateAvailabilityStatus(value) {
  const availabilityStatus = normalizedKey(value)
  if (!LISTING_STATUSES.has(availabilityStatus)) throw new PropertyValidationError('Availability must be draft, available, or unavailable.')
  return availabilityStatus
}
