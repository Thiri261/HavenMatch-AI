import { useRef } from 'react'

const listings = [
  { title: 'Light-filled apartment in Hlaing', price: '450,000 MMK', details: '2 beds · 1 bath · Apartment', location: 'Hlaing Township, Yangon', image: '/images/two-bedroom.png', label: 'Featured', href: '#listing/1' },
  { title: 'Comfortable home in Sanchaung', price: '360,000 MMK', details: '1 bed · 1 bath · Apartment', location: 'Sanchaung Township, Yangon', image: '/images/one-bedroom.png', label: 'Featured', href: '#listing/2' },
  { title: 'Affordable shared home', price: '250,000 MMK', details: '1 room · Shared facilities', location: 'Kamayut Township, Yangon', image: '/images/shared-apartment.png', label: 'Featured', href: '#listing/3' },
  { title: 'Residential land near main road', price: '95,000,000 MMK', details: '2,400 sq ft · Residential land', location: 'North Dagon, Yangon', image: '/images/land-roadside.png', label: 'Featured', href: '#listing/6' },
]

export default function FeaturedListings() {
  const track = useRef(null)
  const move = (direction) => track.current?.scrollBy({ left: direction * 390, behavior: 'smooth' })

  return (
    <section className="featured-listings" aria-labelledby="featured-title">
      <div className="container">
        <header className="featured-heading">
          <div><p>FEATURED LISTINGS</p><h2 id="featured-title">Explore homes and land in Yangon</h2><span>Browse selected properties before starting your personalized AI match.</span></div>
          <div className="featured-actions"><a href="#browse/rent">Browse all properties</a><button type="button" onClick={() => move(-1)} aria-label="Previous listings">←</button><button type="button" onClick={() => move(1)} aria-label="Next listings">→</button></div>
        </header>
        <div className="featured-track" ref={track}>
          {listings.map((listing) => <a className="featured-card" href={listing.href} key={listing.title}>
            <div className="featured-image"><img src={listing.image} alt="" /><span>{listing.label}</span><i>♡</i></div>
            <div className="featured-copy"><strong>{listing.price}</strong><h3>{listing.title}</h3><p>{listing.details}</p><small>{listing.location}</small></div>
          </a>)}
        </div>
      </div>
    </section>
  )
}
