import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import { propertyToListing } from '../data/propertyAdapter'
import { filterAndSortListings } from '../data/listingSearch'
import useSession from '../hooks/useSession'

const money = new Intl.NumberFormat('en-US')

export default function BrowseHomesPage() {
  const { session } = useSession()
  const savedKey = session ? `havenmatch-saved-${session.email}` : null
  const pendingSearch = session ? JSON.parse(localStorage.getItem(`havenmatch-open-search-${session.email}`) || 'null') : null
  const initialPurpose = pendingSearch?.purpose || (window.location.hash.includes('/buy') ? 'Buy' : window.location.hash.includes('/land') ? 'Land' : 'Rent')
  const [purpose, setPurpose] = useState(initialPurpose)
  const [budget, setBudget] = useState(pendingSearch?.budget || 'Any budget')
  const [beds, setBeds] = useState(pendingSearch?.beds || 'Any beds')
  const [type, setType] = useState(pendingSearch?.type || 'Any type')
  const [sort, setSort] = useState('Newest')
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
  const [compare, setCompare] = useState([])
  const [searchSaved, setSearchSaved] = useState(false)

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
  const toggleCompare = (id) => setCompare((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current)
  const saveSearch = () => {
    if (!session) {
      localStorage.setItem('havenmatch_auth_message', 'Log in to save this search.')
      window.location.assign('#signin')
      return
    }
    const key = `havenmatch-searches-${session.email}`
    const searches = JSON.parse(localStorage.getItem(key) || '[]')
    const search = { id: Date.now(), purpose, query, township: 'All Yangon', budget, beds, type }
    localStorage.setItem(key, JSON.stringify([search, ...searches].slice(0, 10)))
    setSearchSaved(true)
  }
  const matchHref = purpose === 'Land' ? '#land/area' : `#housing/${purpose.toLowerCase()}`

  return (
    <div className="browse-page">
      <Header />
      <main className="browse-main">
        <header className="browse-heading"><div><p>EXPLORE YANGON PROPERTIES</p><h1>Browse available {purpose === 'Land' ? 'land' : 'homes'}</h1><span>Explore listings yourself or ask HavenMatch AI to compare them for you.</span></div><a href={matchHref}>Find my best match with AI</a></header>
        <section className="browse-filters" aria-label="Browse filters">
          <label className="browse-query"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search township, title, or property type" aria-label="Search listings" /></label>
          <select value={purpose} onChange={(event) => { setPurpose(event.target.value); setBudget('Any budget'); setSearchSaved(false) }} aria-label="Purpose"><option>Rent</option><option>Buy</option><option>Land</option></select>
          <select value={budget} onChange={(event) => setBudget(event.target.value)} aria-label="Maximum budget"><option>Any budget</option>{purpose === 'Rent' ? <><option value="1000000">Up to 1 million MMK</option><option value="2500000">Up to 2.5 million MMK</option><option value="5000000">Up to 5 million MMK</option><option value="10000000">Up to 10 million MMK</option></> : <><option value="250000000">Up to 250 million MMK</option><option value="500000000">Up to 500 million MMK</option><option value="1000000000">Up to 1 billion MMK</option><option value="5000000000">Up to 5 billion MMK</option><option value="10000000000">Up to 10 billion MMK</option></>}</select>
          {purpose !== 'Land' && <select value={beds} onChange={(event) => setBeds(event.target.value)} aria-label="Bedrooms"><option>Any beds</option><option value="1">1+ bed</option><option value="2">2+ beds</option><option value="3">3+ beds</option></select>}
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Property type"><option>Any type</option>{purpose === 'Land' ? <option>Land</option> : <><option>Apartment</option><option>Condominium</option><option>House</option><option>Shared home</option></>}</select>
          <button className="browse-save-search" type="button" onClick={saveSearch}>{searchSaved ? 'Search saved ✓' : 'Save search'}</button>
        </section>
        <div className="browse-list-controls"><div className="browse-count">{loading ? 'Loading properties…' : `${filtered.length} properties available`}</div><div className="browse-result-actions"><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort listings"><option>Newest</option><option>Lowest price</option><option>Highest price</option></select>{session ? <button className={savedOnly ? 'is-active' : ''} type="button" onClick={() => setSavedOnly((value) => !value)}>♥ Saved homes ({saved.length})</button> : <a className="browse-signin-save" href="#signin">Log in to save favourites</a>}</div></div>
        {loadError && <div className="browse-empty" role="alert"><h2>Listings could not be loaded</h2><p>{loadError} Make sure the HavenMatch API is running, then refresh this page.</p></div>}
        <section className="browse-grid">
          {filtered.map((listing) => <article className="browse-card" key={listing.id}>
            <div className="browse-card-image"><img src={listing.image} alt="" /><button className={saved.includes(listing.id) ? 'is-saved' : ''} type="button" onClick={() => toggleSaved(listing.id)} aria-label={`Save ${listing.title}`}>{saved.includes(listing.id) ? '♥' : '♡'}</button></div>
            <div className="browse-card-copy"><strong>{money.format(listing.price)} MMK {listing.purpose === 'Rent' && <small>/ month</small>}</strong><h2>{listing.title}</h2><p>{listing.township}{listing.purpose === 'Land' ? listing.sqft ? ` · ${money.format(listing.sqft)} sq ft` : '' : ` · ${listing.beds ?? '—'} bed · ${listing.baths ?? '—'} bath`}</p><label className="compare-choice"><input type="checkbox" checked={compare.includes(listing.id)} onChange={() => toggleCompare(listing.id)} disabled={!compare.includes(listing.id) && compare.length >= 3} /> Add to compare</label><div><a className="browse-details-link" href={`#listing/${listing.id}`}>View details</a><a href={matchHref}>Check my AI match</a></div></div>
          </article>)}
        </section>
        {!loading && !loadError && !filtered.length && <div className="browse-empty"><h2>No listings found</h2><p>Try changing one of your filters.</p></div>}
      </main>
      {compare.length > 0 && <div className="compare-bar"><div><strong>Compare homes</strong><span>{compare.length} of 3 selected</span></div><div>{compare.map((id) => { const home = listings.find((item) => item.id === id); return home ? <button type="button" key={id} onClick={() => toggleCompare(id)}>{home.title} ×</button> : null })}</div><a href={`#listing/${compare[0]}`}>Compare now</a></div>}
    </div>
  )
}
