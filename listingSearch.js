function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function searchableText(listing) {
  return normalizeSearchText([listing.title, listing.township, listing.type, listing.address]
    .filter(Boolean)
    .join(' '))
}

function typeMatches(actual, requested) {
  if (requested === 'Any type') return true
  if (requested === 'Apartment') return actual === 'Apartment' || actual === 'Condominium'
  if (requested === 'Shared home') return actual === 'Shared Apartment'
  return actual === requested
}

export function filterAndSortListings(listings, { purpose, budget, beds, type, query, savedOnly, saved, sort }) {
  const normalizedQuery = normalizeSearchText(query)
  const matches = listings.filter((listing) => {
    if (listing.purpose !== purpose) return false
    if (savedOnly && !saved.includes(listing.id)) return false
    if (budget !== 'Any budget' && listing.price > Number(budget)) return false
    if (beds !== 'Any beds' && (!Number.isFinite(listing.beds) || listing.beds < Number(beds))) return false
    if (!typeMatches(listing.type, type)) return false
    return !normalizedQuery || searchableText(listing).includes(normalizedQuery)
  })

  if (sort === 'Lowest price') return [...matches].sort((a, b) => a.price - b.price)
  if (sort === 'Highest price') return [...matches].sort((a, b) => b.price - a.price)
  return matches
}
