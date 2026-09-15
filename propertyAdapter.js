const PURPOSE_LABELS = { rent: 'Rent', buy: 'Buy', land: 'Land' }

const FEATURE_FIELDS = [
  ['generator', 'Generator backup'],
  ['petFriendly', 'Pet friendly'],
  ['internetReady', 'Wi-Fi ready'],
  ['nearShops', 'Near shops'],
  ['nearBusStop', 'Near bus stop'],
  ['mainRoadAccess', 'Main-road access'],
  ['parking', 'Parking'],
  ['security', 'Security'],
  ['airConditioning', 'Air conditioning'],
  ['reliableWater', 'Reliable water'],
]

export function displayWords(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function propertyToListing(property) {
  const purpose = PURPOSE_LABELS[property.listingType] || displayWords(property.listingType)
  const township = displayWords(property.township) || 'Township not stated'
  const type = displayWords(property.propertyType) || (purpose === 'Land' ? 'Land' : 'Property')
  const image = property.imageUrl || (purpose === 'Land' ? '/images/land-roadside.png' : '/images/two-bedroom.png')
  const images = Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : [image]
  const source = property.sourceSite || 'the source website'
  const features = FEATURE_FIELDS.filter(([key]) => property[key] === true).map(([, label]) => label)

  return {
    id: property.id,
    purpose,
    title: property.title || `${type} listing`,
    township,
    address: township === 'Township not stated' ? 'Yangon' : `${township} Township, Yangon`,
    price: property.priceMmk,
    beds: Number.isFinite(property.bedrooms) ? property.bedrooms : null,
    baths: Number.isFinite(property.bathrooms) ? property.bathrooms : null,
    maxOccupants: Number.isFinite(property.maxOccupants) ? property.maxOccupants : Number.isFinite(property.bedrooms) && property.bedrooms > 0 ? property.bedrooms * 2 : null,
    sqft: Number.isFinite(property.areaSqft) ? property.areaSqft : null,
    floor: Number.isFinite(property.floor) ? property.floor : null,
    type,
    built: null,
    image,
    images,
    description: `This listing was imported from ${source}. Verify its current availability and any details not stated here with the source website.`,
    features,
    sourceUrl: property.sourceUrl || null,
    sourceSite: property.sourceSite || null,
    fetchedOn: property.fetchedOn || null,
    availabilityStatus: property.availabilityStatus || 'available',
    commute: {
      nearBusStop: property.nearBusStop ?? null,
      mainRoadAccess: property.mainRoadAccess ?? null,
    },
    isApiListing: true,
    agentContact: property.agentContact || null,
  }
}
