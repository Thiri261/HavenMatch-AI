const HOME_TYPES = new Set(['Apartment', 'Condominium', 'House', 'Shared Apartment'])

export function availableListingOptions(listings, purpose) {
  const eligible = listings.filter((listing) => {
    if (listing.purpose !== purpose) return false
    return purpose === 'Land' ? listing.type === 'Vacant Land' : HOME_TYPES.has(listing.type)
  })

  return {
    townships: [...new Set(eligible.map((listing) => listing.township).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    propertyTypes: purpose === 'Land'
      ? []
      : [...new Set(eligible.map((listing) => listing.type))]
        .map((type) => type === 'Shared Apartment' ? 'Shared home' : type)
        .sort((a, b) => a.localeCompare(b)),
  }
}
