import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { displayWords, propertyToListing } from '../data/propertyAdapter'
import { listingAgent as fallbackAgent } from '../data/agents'
import useSession from '../hooks/useSession'

const money = new Intl.NumberFormat('en-US')
export default function ListingDetailPage() {
  const routeId = decodeURIComponent(window.location.hash.split('/')[1] || '')
  const [remoteResult, setRemoteResult] = useState({ routeId: null, state: 'loading', listing: null })
  const { session, loading } = useSession()
  const savedKey = session ? `havenmatch-saved-${session.email}` : null
  const [, refreshSavedState] = useState(0)
  const [contacted, setContacted] = useState(false)
  const [tourSent, setTourSent] = useState(false)
  const [tourNote, setTourNote] = useState('')
  const [tourBusy, setTourBusy] = useState(false)
  const [tourError, setTourError] = useState('')
  const [showContact, setShowContact] = useState(false)
  const [showPhotos, setShowPhotos] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/properties/${encodeURIComponent(routeId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.message || 'Property not found.')
        return payload.property
      })
      .then((property) => {
        setRemoteResult({ routeId, state: 'ready', listing: propertyToListing(property) })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setRemoteResult({ routeId, state: 'error', listing: null })
      })

    return () => controller.abort()
  }, [routeId])

  const listing = remoteResult.routeId === routeId ? remoteResult.listing : null
  const listingState = remoteResult.routeId === routeId ? remoteResult.state : 'loading'
  const saved = Boolean(savedKey && listing && JSON.parse(localStorage.getItem(savedKey) || '[]').includes(listing.id))
  const agent = listing?.agentContact
    ? { id: listing.id, name: listing.agentContact.name || 'Vendor', phone: listing.agentContact.phone || '', email: listing.agentContact.email || '', address: listing.agentContact.location || 'Yangon' }
    : fallbackAgent

  if (listingState !== 'ready' || !listing) {
    return <div className="listing-page"><Header /><main className="listing-detail-shell"><div className="browse-empty"><h2>{listingState === 'error' ? 'Property not found' : 'Loading property details…'}</h2>{listingState === 'error' && <p>The requested listing is unavailable or the API could not be reached.</p>}</div></main></div>
  }

  const requireSignIn = (message) => {
    if (session) return true
    localStorage.setItem('havenmatch_auth_message', message)
    localStorage.setItem('havenmatch_auth_redirect', `#listing/${listing.id}`)
    window.location.assign('#signin')
    return false
  }

  const rememberAgent = () => {
    const key = `havenmatch-contacted-agents-${session.email}`
    const current = JSON.parse(localStorage.getItem(key) || '[]')
    const contact = { ...agent, listingId: listing.id, listingTitle: listing.title, contactedAt: new Date().toISOString() }
    const withoutDuplicate = current.filter((item) => !(item.id === agent.id && item.listingId === listing.id))
    localStorage.setItem(key, JSON.stringify([contact, ...withoutDuplicate]))
  }

  const requestTour = async () => {
    if (!requireSignIn('Log in to request a property tour.')) return
    if (tourBusy) return
    setTourBusy(true)
    setTourError('')
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(listing.id)}/tour-request`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: tourNote }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || 'Unable to send the tour request.')
      rememberAgent()
      setTourSent(true)
      setContacted(true)
      const subject = `Tour request: ${listing.title}`
      const body = `Hello ${agent.name},\n\nI would like to arrange a viewing for ${listing.title}, located at ${listing.address}.\n\nMy HavenMatch account: ${session.email}\n\nPlease contact me with available viewing times.\n\nThank you.${tourNote ? `\n\nPreferred time/notes: ${tourNote}` : ''}`
      window.location.href = `mailto:${agent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } catch (error) {
      setTourError(error.message || 'Unable to send the tour request.')
    } finally {
      setTourBusy(false)
    }
  }

  const revealContact = () => {
    if (!requireSignIn('Log in to view the agent’s contact details.')) return
    rememberAgent()
    setShowContact((visible) => !visible)
  }

  const toggleSaved = () => {
    if (!session) { localStorage.setItem('havenmatch_auth_message', 'Log in to save your favourite listings.'); window.location.assign('#signin'); return }
    const current = JSON.parse(localStorage.getItem(savedKey) || '[]')
    const next = current.includes(listing.id) ? current.filter((item) => item !== listing.id) : [...current, listing.id]
    localStorage.setItem(savedKey, JSON.stringify(next)); refreshSavedState((version) => version + 1)
  }
  const isLandListing = listing.purpose === 'Land' || /land/i.test(listing.type)
  const occupancyCapacity = listing.maxOccupants ?? (Number.isFinite(listing.beds) && listing.beds > 0 ? listing.beds * 2 : null)
  const nearBusStop = listing.commute?.nearBusStop ?? listing.features.some((feature) => /bus|ybs/i.test(feature))
  const mainRoadAccess = listing.commute?.mainRoadAccess ?? listing.features.some((feature) => /main.?road|road access/i.test(feature))
  const facilityDetails = listing.features.filter((feature) => !/bus|ybs|main.?road|road access/i.test(feature))
  const backHref = isLandListing ? '#browse/land' : listing.purpose === 'Buy' ? '#browse/buy' : '#browse/rent'
  const availabilityLabel = listing.isApiListing
    ? `${displayWords(listing.availabilityStatus)} listing`
    : 'Available listing'

  return <div className="listing-page">
    <Header />
    <main className="listing-detail-shell">
      <nav className="listing-topbar" aria-label="Listing actions">
        <a href={backHref}>← <span>Back to search</span></a>
        <div><button type="button" onClick={toggleSaved}>{saved ? '♥ Saved' : '♡ Save'}</button></div>
      </nav>
      <section className="listing-gallery" aria-label="Property photos">
        {listing.images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${listing.title}, view ${index + 1}`} />)}
        {listing.images.length > 1 && <button type="button" onClick={() => setShowPhotos(true)}>▦ See all {listing.images.length} photos</button>}
      </section>
      <div className="listing-content-grid">
        <div className="listing-overview">
          <div className="listing-summary">
            <div><span className="listing-status">● {listing.purpose === 'Rent' ? 'For rent' : 'For sale'}</span><h1>{money.format(listing.price)} MMK {listing.purpose === 'Rent' && <small>/ month</small>}</h1><p>{listing.address}</p></div>
            <dl>{!isLandListing && <><div><dt>{listing.beds ?? '—'}</dt><dd>beds</dd></div><div><dt>{listing.baths ?? '—'}</dt><dd>baths</dd></div></>}<div><dt>{listing.sqft === null ? '—' : money.format(listing.sqft)}</dt><dd>sqft</dd></div></dl>
          </div>
            <div className="listing-facts">
              <span>⌂ {listing.type}</span>{listing.built && <span>◷ Built in {listing.built}</span>}{listing.floor !== null && listing.floor !== undefined && <span>▤ Floor {listing.floor}</span>}<span>▱ {listing.township}</span><span>{listing.isApiListing ? 'ⓘ' : '✓'} {availabilityLabel}</span>
            </div>
          <section className="listing-special"><p>PROPERTY DETAILS</p><h2>{listing.title}</h2><ul className="listing-detail-list">{!isLandListing && <><li><strong>Occupancy</strong><span>{occupancyCapacity ? `Up to ${occupancyCapacity} people` : 'Not specified'}</span></li><li><strong>YBS access</strong><span>{nearBusStop === true ? 'Near a YBS bus stop' : 'Not specified'}</span></li><li><strong>Road access</strong><span>{mainRoadAccess === true ? 'Near a main road' : 'Not specified'}</span></li></>}{facilityDetails.map((feature) => <li key={feature}><strong>Facility</strong><span>{feature}</span></li>)}</ul>{!listing.isApiListing && <p>{listing.description}</p>}</section>
        </div>
        <aside className="listing-contact-card">
          <p>Interested in this property?</p><h2>Arrange a viewing</h2><input className="tour-note-input" type="text" placeholder="Preferred date/time or note (optional)" value={tourNote} onChange={(event) => setTourNote(event.target.value)} aria-label="Preferred visit time or note" /><button className="request-tour-button" type="button" onClick={requestTour} disabled={loading || tourBusy}>{tourSent ? 'Tour request sent ✓' : tourBusy ? 'Sending…' : 'Request a tour'}</button><button className="contact-agent-button" type="button" onClick={revealContact} disabled={loading}>{showContact ? 'Hide agent details' : 'View agent details'}</button>{showContact && <address className="agent-contact-details"><strong>{agent.name}</strong><a href={`tel:${agent.phone.replace(/\s/g, '')}`}>{agent.phone}</a><a href={`mailto:${agent.email}`}>{agent.email}</a><span>{agent.address}</span></address>}{tourError && <small role="alert" style={{ color: '#a33', display: 'block', marginTop: 8 }}>{tourError}</small>}<small>{tourSent ? 'Your tour request was sent to the agent and the platform. A reminder email also opened with the details.' : contacted ? 'Your email app has opened with the tour request details.' : session ? 'Signed in — request a tour to notify the agent, or view agent details.' : 'Log in to request a tour or view agent details.'}</small>
        </aside>
      </div>
    </main>
    {showPhotos && <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={`${listing.title} photo gallery`} onClick={() => setShowPhotos(false)}>
      <div onClick={(event) => event.stopPropagation()}><header><div><p>PROPERTY PHOTOS</p><h2>{listing.title}</h2></div><button type="button" onClick={() => setShowPhotos(false)} aria-label="Close photo gallery">×</button></header><div className="photo-viewer-grid">{listing.images.map((image, index) => <img key={`${image}-full-${index}`} src={image} alt={`${listing.title}, full view ${index + 1}`} />)}</div></div>
    </div>}
  </div>
}
