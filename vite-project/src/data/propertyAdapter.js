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
    sqft: Number.isFinite(property.areaSqft) ? property.areaSqft : null,
    floor: Number.isFinite(property.floor) ? property.floor : null,
    type,
    built: null,
    image,
    images: [image],
    description: `This listing was imported from ${source}. Verify its current availability and any details not stated here with the source website.`,
    features,
    sourceUrl: property.sourceUrl || null,
    sourceSite: property.sourceSite || null,
    fetchedOn: property.fetchedOn || null,
    availabilityStatus: property.availabilityStatus || 'unverified',
    isApiListing: true,
  }
}
