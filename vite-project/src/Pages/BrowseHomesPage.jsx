import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import { propertyToListing } from '../data/propertyAdapter'
import { filterAndSortListings } from '../data/listingSearch'
import { availableListingOptions } from '../data/listingInventory'
import useSession from '../hooks/useSession'

const money = new Intl.NumberFormat('en-US')
const budgetOptions = {
  Rent: [
    ['1500000', 'Up to 15 lakhs'],
    ['2500000', 'Up to 25 lakhs'],
    ['4000000', 'Up to 40 lakhs'],
    ['6000000', 'Up to 60 lakhs'],
    ['9000000', 'Up to 90 lakhs'],
  ],
  Buy: [
    ['250000000', 'Up to 2,500 lakhs'],
    ['500000000', 'Up to 5,000 lakhs'],
    ['1000000000', 'Up to 10,000 lakhs'],
    ['2500000000', 'Up to 25,000 lakhs'],
    ['5000000000', 'Up to 50,000 lakhs'],
    ['7500000000', 'Up to 75,000 lakhs'],
  ],
  Land: [
    ['500000000', 'Up to 5,000 lakhs'],
    ['1500000000', 'Up to 15,000 lakhs'],
    ['3000000000', 'Up to 30,000 lakhs'],
    ['6500000000', 'Up to 65,000 lakhs'],
    ['10000000000', 'Up to 100,000 lakhs'],
    ['18000000000', 'Up to 180,000 lakhs'],
  ],
}

export default function BrowseHomesPage() {
  const { session } = useSession()
  const savedKey = session ? `havenmatch-saved-${session.email}` : null
  const pendingSearch = session ? JSON.parse(localStorage.getItem(`havenmatch-open-search-${session.email}`) || 'null') : null
  const initialPurpose = pendingSearch?.purpose || (window.location.hash.includes('/buy') ? 'Buy' : window.location.hash.includes('/land') ? 'Land' : 'Rent')
  const [purpose, setPurpose] = useState(initialPurpose)
  const [budget, setBudget] = useState(pendingSearch?.budget || 'Any budget')
  const [beds, setBeds] = useState(pendingSearch?.beds || 'Any beds')
  const [type, setType] = useState(pendingSearch?.type || 'Any type')
  const [sort, setSort] = useState('Lowest price')
  const [query, setQuery] = useState(pendingSearch?.query || (pendingSearch?.township !== 'All Yangon' ? pendingSearch?.township : '') || '')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [savedRevision, setSavedRevision] = useState(0)
  const saved = useMemo(() => {
    void savedRevision
    return savedKey ? JSON.parse(localStorage.getItem(savedKey) || '[]') : []
  }, [savedKey, savedRevision])
  const [savedOnly, setSavedOnly] = useState(false)
  const hasActiveFilters = Boolean(query.trim()) || budget !== 'Any budget' || beds !== 'Any beds' || type !== 'Any type'

  useEffect(() => {
    if (session) localStorage.removeItem(`havenmatch-open-search-${session.email}`)
  }, [session])

  useEffect(() => {
    const controller = new AbortController()
    async function loadListings() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await fetch('/api/properties', { signal: controller.signal })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Unable to load properties.')
        if (!Array.isArray(result.properties)) throw new Error('The property service returned an invalid response.')
        setListings(result.properties.map(propertyToListing))
      } catch (error) {
        if (error.name !== 'AbortError') setLoadError(error.message || 'Unable to load properties.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadListings()
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => {
    return filterAndSortListings(listings, { purpose, budget, beds, type, query, savedOnly, saved, sort })
  }, [listings, purpose, budget, beds, type, sort, query, savedOnly, saved])
  const listingOptions = useMemo(() => availableListingOptions(listings, purpose), [listings, purpose])

  const toggleSaved = (id) => {
    if (!session) {
      localStorage.setItem('havenmatch_auth_message', 'Log in to save your favourite listings.')
      window.location.assign('#signin')
      return
    }
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]
    localStorage.setItem(savedKey, JSON.stringify(next))
    setSavedRevision((revision) => revision + 1)
  }
  const clearFilters = () => {
    setQuery('')
    setBudget('Any budget')
    setBeds('Any beds')
    setType('Any type')
  }
  const matchHref = purpose === 'Land' ? '#land/area' : `#housing/${purpose.toLowerCase()}`

  return (
    <div className="browse-page">
      <Header />
      <main className="browse-main">
        <header className="browse-heading"><div><p>EXPLORE YANGON PROPERTIES</p><h1>Browse available {purpose === 'Land' ? 'land' : 'homes'}</h1><span>Explore listings yourself or ask HavenMatch AI to compare them for you.</span></div><a href={matchHref}>Find my best match with AI</a></header>
        <section className="browse-filters" aria-label="Browse filters">
          <label className="browse-query"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by township, title, or property type" aria-label="Search listings" /></label>
          <div className="browse-filter-row">
            <select value={purpose} onChange={(event) => { setPurpose(event.target.value); setBudget('Any budget'); setBeds('Any beds'); setType('Any type') }} aria-label="Purpose"><option>Rent</option><option>Buy</option><option>Land</option></select>
            <select value={budget} onChange={(event) => setBudget(event.target.value)} aria-label="Maximum budget"><option value="Any budget">Budget</option>{budgetOptions[purpose].map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>
            {purpose !== 'Land' && <select value={beds} onChange={(event) => setBeds(event.target.value)} aria-label="Bedrooms"><option value="Any beds">Bedrooms</option><option value="1">1+ bed</option><option value="2">2+ beds</option><option value="3">3+ beds</option></select>}
            <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Property type"><option value="Any type">Property type</option>{purpose === 'Land' ? <option>Land</option> : listingOptions.propertyTypes.map((name) => <option key={name}>{name}</option>)}</select>
            {hasActiveFilters && <div className="browse-filter-actions"><button className="browse-clear-filters" type="button" onClick={clearFilters}>Clear all</button></div>}
          </div>
        </section>
        <div className="browse-list-controls"><div className="browse-count">{loading ? 'Loading properties…' : `${filtered.length} properties available`}</div><div className="browse-result-actions"><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort listings"><option>Lowest price</option><option>Highest price</option></select>{session ? <button className={savedOnly ? 'is-active' : ''} type="button" onClick={() => setSavedOnly((value) => !value)}>♥ Saved homes ({saved.length})</button> : <a className="browse-signin-save" href="#signin">Log in to save favourites</a>}</div></div>
        {loadError && <div className="browse-empty" role="alert"><h2>Listings could not be loaded</h2><p>{loadError} Make sure the HavenMatch API is running, then refresh this page.</p></div>}
        <section className="browse-grid">
          {filtered.map((listing) => <article className="browse-card" key={listing.id}>
            <div className="browse-card-image"><img src={listing.image} alt="" /><button className={saved.includes(listing.id) ? 'is-saved' : ''} type="button" onClick={() => toggleSaved(listing.id)} aria-label={`Save ${listing.title}`}>{saved.includes(listing.id) ? '♥' : '♡'}</button></div>
            <div className="browse-card-copy"><strong>{money.format(listing.price)} MMK {listing.purpose === 'Rent' && <small>/ month</small>}</strong><h2>{listing.title}</h2><p>{listing.township}{listing.purpose === 'Land' ? listing.sqft ? ` · ${money.format(listing.sqft)} sq ft` : '' : ` · ${listing.beds ?? '—'} bed · ${listing.baths ?? '—'} bath`}</p><div><a className="browse-details-link" href={`#listing/${listing.id}`}>View details</a><a href={matchHref}>Check my AI match</a></div></div>
          </article>)}
        </section>
        {!loading && !loadError && !filtered.length && <div className="browse-empty"><h2>No listings found</h2><p>Try changing one of your filters.</p></div>}
      </main>
    </div>
  )
}
