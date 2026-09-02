import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import listings from '../data/listings'
import useSession from '../hooks/useSession'

const money = new Intl.NumberFormat('en-US')

export default function DashboardPage() {
  const { session, loading } = useSession()
  const savedKey = session ? `havenmatch-saved-${session.email}` : ''
  const [savedRevision, setSavedRevision] = useState(0)
  const [searchRevision, setSearchRevision] = useState(0)
  const saved = useMemo(() => {
    void savedRevision
    return savedKey ? JSON.parse(localStorage.getItem(savedKey) || '[]') : []
  }, [savedKey, savedRevision])
  const savedSearches = useMemo(() => {
    void searchRevision
    return session ? JSON.parse(localStorage.getItem(`havenmatch-searches-${session.email}`) || '[]') : []
  }, [session, searchRevision])
  const contactedAgents = session ? JSON.parse(localStorage.getItem(`havenmatch-contacted-agents-${session.email}`) || '[]') : []
  const favourites = useMemo(() => listings.filter((listing) => saved.includes(listing.id)), [saved])

  useEffect(() => {
    if (!loading && !session) window.location.assign('#signin')
  }, [session, loading])

  const removeFavourite = (id) => {
    const next = saved.filter((item) => item !== id)
    localStorage.setItem(savedKey, JSON.stringify(next))
    setSavedRevision((revision) => revision + 1)
  }

  const openSearch = (search) => {
    localStorage.setItem(`havenmatch-open-search-${session.email}`, JSON.stringify(search))
    window.location.assign(`#browse/${search.purpose.toLowerCase()}`)
  }

  const removeSearch = (id) => {
    const next = savedSearches.filter((search) => search.id !== id)
    localStorage.setItem(`havenmatch-searches-${session.email}`, JSON.stringify(next))
    setSearchRevision((revision) => revision + 1)
  }

  if (loading || !session) return null

  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-main">
        <header className="dashboard-welcome"><div><p>MY HAVENMATCH</p><h1>Welcome back, {session.name.split(' ')[0]}</h1><span>Your saved homes and matching journey, all in one place.</span></div><a href="#matching">Start a new AI match</a></header>
        <section className="dashboard-stats" aria-label="Account overview"><a href="#dashboard-favourites"><strong>{favourites.length}</strong><span>Favourite listings</span><small>View favourites →</small></a><a href="#dashboard-searches"><strong>{savedSearches.length}</strong><span>Saved searches</span><small>View searches →</small></a><a href="#dashboard-agents"><strong>{contactedAgents.length}</strong><span>Contacted agents</span><small>View agents →</small></a><a href="#matching"><strong>0</strong><span>Completed AI matches</span><small>Start a match →</small></a></section>
        <div className="dashboard-layout">
          <div className="dashboard-content-stack">
          <section className="dashboard-favourites" id="dashboard-favourites"><div className="dashboard-section-title"><div><h2>Your favourite listings</h2><p>Properties are saved privately to your account on this device.</p></div><a href="#browse/rent">Browse more homes</a></div>
            {favourites.length ? <div className="dashboard-grid">{favourites.map((listing) => <article key={listing.id}><a className="dashboard-listing-link" href={`#listing/${listing.id}`}><img src={listing.image} alt="" /><div><p>{listing.purpose} · {listing.township}</p><h3>{listing.title}</h3><strong>{money.format(listing.price)} MMK {listing.purpose === 'Rent' && '/ month'}</strong></div></a><button type="button" onClick={() => removeFavourite(listing.id)}>Remove from favourites</button></article>)}</div> : <div className="dashboard-empty"><span>♡</span><h3>No favourite listings yet</h3><p>Browse properties and select the heart to save homes here.</p><a href="#browse/rent">Browse available homes</a></div>}
          </section>
          <section className="dashboard-favourites dashboard-searches" id="dashboard-searches"><div className="dashboard-section-title"><div><h2>Your saved searches</h2><p>Return to searches you want to check again.</p></div><a href="#browse/rent">Create a search</a></div>
            {savedSearches.length ? <div className="saved-search-list">{savedSearches.map((search) => <article key={search.id}><div><strong>{search.purpose} properties</strong><span>{[search.query, search.township, search.budget !== 'Any budget' ? `Up to ${money.format(Number(search.budget))} MMK` : '', search.beds !== 'Any beds' ? `${search.beds}+ beds` : '', search.type !== 'Any type' ? search.type : ''].filter(Boolean).join(' · ')}</span></div><button type="button" onClick={() => openSearch(search)}>Open search</button><button className="delete-search" type="button" onClick={() => removeSearch(search.id)}>Delete</button></article>)}</div> : <div className="dashboard-empty dashboard-empty-compact"><span>⌕</span><h3>No saved searches yet</h3><p>Save a property search and it will appear here.</p><a href="#browse/rent">Browse properties</a></div>}
          </section>
          <section className="dashboard-favourites dashboard-agents" id="dashboard-agents"><div className="dashboard-section-title"><div><h2>Your contacted agents</h2><p>Agents you contacted while viewing properties.</p></div></div>
            {contactedAgents.length ? <div className="contacted-agent-list">{contactedAgents.map((contact) => <article key={`${contact.id}-${contact.listingId}`}><div><strong>{contact.name}</strong><span>Regarding <a href={`#listing/${contact.listingId}`}>{contact.listingTitle}</a></span><small>{contact.address}</small></div><a href={`tel:${contact.phone.replace(/\s/g, '')}`}>Call</a><a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Regarding ${contact.listingTitle}`)}`}>Email</a></article>)}</div> : <div className="dashboard-empty dashboard-empty-compact"><span>♙</span><h3>No contacted agents yet</h3><p>Agent details you view will be saved here.</p><a href="#browse/rent">Browse properties</a></div>}
          </section>
          </div>
          <aside className="dashboard-sidebar"><section><h2>Quick actions</h2><a href="#matching">Get AI recommendations <span>→</span></a><a href="#browse/rent">Browse rental homes <span>→</span></a><a href="#browse/buy">Browse homes to buy <span>→</span></a><a href="#browse/land">Browse available land <span>→</span></a></section><section><h2>Account</h2><strong>{session.name}</strong><p>{session.email}</p></section></aside>
        </div>
      </main>
    </div>
  )
}
