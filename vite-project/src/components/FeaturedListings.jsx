import { useEffect, useRef, useState } from 'react'
import { propertyToListing } from '../data/propertyAdapter'

const money = new Intl.NumberFormat('en-US')

export default function FeaturedListings() {
  const track = useRef(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const move = (direction) => track.current?.scrollBy({ left: direction * 390, behavior: 'smooth' })

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/properties', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !Array.isArray(result.properties)) throw new Error('Unable to load properties.')
        return result.properties
      })
      .then((properties) => {
        const browseRentals = properties
          .map(propertyToListing)
          .filter((listing) => listing.purpose === 'Rent')
          .slice(0, 4)
        setListings(browseRentals)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setListings([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <section className="featured-listings" aria-labelledby="featured-title">
      <div className="container">
        <header className="featured-heading">
          <div><p>FEATURED LISTINGS</p><h2 id="featured-title">Explore homes and land in Yangon</h2><span>Browse selected properties before starting your personalized AI match.</span></div>
          <div className="featured-actions"><a href="#browse/rent">Browse all properties</a><button type="button" onClick={() => move(-1)} aria-label="Previous listings">←</button><button type="button" onClick={() => move(1)} aria-label="Next listings">→</button></div>
        </header>
        <div className="featured-track" ref={track}>
          {listings.map((listing) => <a className="featured-card" href={`#listing/${listing.id}`} key={listing.id}>
            <div className="featured-image"><img src={listing.image} alt="" /><span>Featured</span><i>♡</i></div>
            <div className="featured-copy"><strong>{money.format(listing.price)} MMK {listing.purpose === 'Rent' && <small>/ month</small>}</strong><h3>{listing.title}</h3><p>{listing.township} Township, Yangon</p><small>{listing.beds ?? '—'} bed · {listing.baths ?? '—'} bath · {listing.type}</small></div>
          </a>)}
          {loading && <p className="featured-status">Loading featured properties…</p>}
          {!loading && !listings.length && <p className="featured-status">Featured properties are temporarily unavailable.</p>}
        </div>
      </div>
    </section>
  )
}
