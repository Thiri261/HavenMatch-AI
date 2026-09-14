import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import listings from '../data/listings'
import { propertyToListing } from '../data/propertyAdapter'
import useSession, { announceAuthChange } from '../hooks/useSession'

const money = new Intl.NumberFormat('en-US')

function readList(key) {
  if (!key) return []
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export default function DashboardPage() {
  const { session, loading } = useSession()
  const savedKey = session ? `havenmatch-saved-${session.email}` : ''
  const [savedRevision, setSavedRevision] = useState(0)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [accountMessage, setAccountMessage] = useState({ type: '', text: '' })
  const [accountBusy, setAccountBusy] = useState(false)
  const [availableListings, setAvailableListings] = useState(listings)
  const [listingsLoading, setListingsLoading] = useState(true)
  const [listingsError, setListingsError] = useState('')
  const saved = useMemo(() => {
    void savedRevision
    return readList(savedKey)
  }, [savedKey, savedRevision])
  const contactedAgents = session ? readList(`havenmatch-contacted-agents-${session.email}`) : []
  const completedMatches = session ? readList(`havenmatch-match-history-${session.email}`) : []
  const hasLatestMatch = (() => {
    try { return Array.isArray(JSON.parse(localStorage.getItem('havenmatch-match-results') || 'null')?.matches) } catch { return false }
  })()
  const completedMatchCount = Math.max(completedMatches.length, hasLatestMatch ? 1 : 0)
  const favourites = useMemo(() => {
    const savedIds = new Set(saved.map(String))
    return availableListings.filter((listing) => savedIds.has(String(listing.id)))
  }, [availableListings, saved])

  useEffect(() => {
    if (!loading && !session) window.location.assign('#signin')
  }, [session, loading])

  useEffect(() => {
    const controller = new AbortController()
    async function loadListings() {
      setListingsLoading(true)
      setListingsError('')
      try {
        const response = await fetch('/api/properties', { signal: controller.signal })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Unable to load properties.')
        if (!Array.isArray(result.properties)) throw new Error('Invalid property response.')
        const remoteListings = result.properties.map(propertyToListing)
        const remoteIds = new Set(remoteListings.map((listing) => String(listing.id)))
        setAvailableListings([...remoteListings, ...listings.filter((listing) => !remoteIds.has(String(listing.id)))])
      } catch (error) {
        if (error.name !== 'AbortError') setListingsError('Some saved listings could not be refreshed. Please try again later.')
      } finally {
        if (!controller.signal.aborted) setListingsLoading(false)
      }
    }
    loadListings()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!loading && session && window.location.hash.startsWith('#dashboard-')) {
      window.requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView())
    }
  }, [loading, session])

  const removeFavourite = (id) => {
    const next = saved.filter((item) => String(item) !== String(id))
    localStorage.setItem(savedKey, JSON.stringify(next))
    setSavedRevision((revision) => revision + 1)
  }

  const openCompletedMatch = (match) => {
    if (match.result?.matches) localStorage.setItem('havenmatch-match-results', JSON.stringify(match.result))
    window.location.assign('#result')
  }

  const logOut = async () => {
    setAccountBusy(true)
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } finally {
      announceAuthChange(null)
      window.location.assign('#signin')
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setAccountMessage({ type: '', text: '' })
    if (passwords.next !== passwords.confirm) {
      setAccountMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setAccountBusy(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to change password.')
      setPasswords({ current: '', next: '', confirm: '' })
      setShowPasswordForm(false)
      setAccountMessage({ type: 'success', text: result.message })
    } catch (error) {
      setAccountMessage({ type: 'error', text: error.message || 'Unable to change password.' })
    } finally {
      setAccountBusy(false)
    }
  }

  if (loading || !session) return null

  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-main">
        <header className="dashboard-welcome"><div><p>MY HAVENMATCH</p><h1>Welcome back, {session.name.split(' ')[0]}</h1><span>Your saved homes and matching journey, all in one place.</span></div><a href="#matching">Start a new AI match</a></header>
        <section className="dashboard-stats" aria-label="Account overview"><a href="#dashboard-favourites"><strong>{favourites.length}</strong><span>Favourite listings</span><small>View favourites →</small></a><a href="#dashboard-matches"><strong>{completedMatchCount}</strong><span>Completed AI matches</span><small>{completedMatchCount ? 'View match history →' : 'Start a match →'}</small></a><a href="#dashboard-agents"><strong>{contactedAgents.length}</strong><span>Contacted agents</span><small>View agents →</small></a></section>
        <div className="dashboard-layout">
          <div className="dashboard-content-stack">
          <section className="dashboard-favourites" id="dashboard-favourites"><div className="dashboard-section-title"><div><h2>Your favourite listings</h2><p>Properties are saved privately to your account on this device.</p></div><a href="#browse/rent">Browse more homes</a></div>
            {listingsLoading ? <div className="dashboard-empty" role="status"><h3>Loading favourite listings…</h3></div> : favourites.length ? <div className="dashboard-grid">{favourites.map((listing) => <article key={listing.id}><a className="dashboard-listing-link" href={`#listing/${listing.id}`}><img src={listing.image} alt="" /><div><p>{listing.purpose} · {listing.township}</p><h3>{listing.title}</h3><strong>{money.format(listing.price)} MMK {listing.purpose === 'Rent' && '/ month'}</strong></div></a><button type="button" onClick={() => removeFavourite(listing.id)}>Remove from favourites</button></article>)}</div> : <div className="dashboard-empty"><span>♡</span><h3>No favourite listings yet</h3><p>Browse properties and select the heart to save homes here.</p><a href="#browse/rent">Browse available homes</a></div>}
            {listingsError && <p className="dashboard-load-message" role="alert">{listingsError}</p>}
          </section>
          <section className="dashboard-favourites dashboard-matches" id="dashboard-matches"><div className="dashboard-section-title"><div><h2>Your completed AI matches</h2><p>Reopen recommendations from your previous matching sessions.</p></div><a href="#matching">Start a new match</a></div>
            {completedMatches.length ? <div className="completed-match-list">{completedMatches.map((match, index) => <article key={match.id}><div><strong>{match.result?.request?.intent ? `${match.result.request.intent.charAt(0).toUpperCase()}${match.result.request.intent.slice(1)} match` : `AI match ${completedMatches.length - index}`}</strong><span>{match.matchCount} propert{match.matchCount === 1 ? 'y' : 'ies'} · {match.completedAt ? new Date(match.completedAt).toLocaleString() : 'Previous session'}</span></div><button type="button" onClick={() => openCompletedMatch(match)}>View results</button></article>)}</div> : hasLatestMatch ? <div className="dashboard-empty dashboard-empty-compact"><h3>Your latest AI match is ready</h3><p>This result was completed before match history was enabled.</p><a href="#result">View latest result</a></div> : <div className="dashboard-empty dashboard-empty-compact"><h3>No completed AI matches yet</h3><p>Complete the matching questions to see your recommendations here.</p><a href="#matching">Start AI matching</a></div>}
          </section>
          <section className="dashboard-favourites dashboard-agents" id="dashboard-agents"><div className="dashboard-section-title"><div><h2>Your contacted agents</h2><p>Agents you contacted while viewing properties.</p></div></div>
            {contactedAgents.length ? <div className="contacted-agent-list">{contactedAgents.map((contact) => <article key={`${contact.id}-${contact.listingId}`}><div><strong>{contact.name}</strong><span>Regarding <a href={`#listing/${contact.listingId}`}>{contact.listingTitle}</a></span><small>{contact.address}</small></div><a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Regarding ${contact.listingTitle}`)}`}>Email</a></article>)}</div> : <div className="dashboard-empty dashboard-empty-compact"><span>♙</span><h3>No contacted agents yet</h3><p>Agent details you view will be saved here.</p><a href="#browse/rent">Browse properties</a></div>}
          </section>
          </div>
          <aside className="dashboard-sidebar"><section><h2>Quick actions</h2><a href="#matching">Get AI recommendations <span>→</span></a><a href="#browse/rent">Browse rental homes <span>→</span></a><a href="#browse/buy">Browse homes to buy <span>→</span></a><a href="#browse/land">Browse available land <span>→</span></a></section><section className="dashboard-account"><h2>Account</h2><strong>{session.name}</strong><p>{session.email}</p><div className="dashboard-account-actions"><button type="button" onClick={() => { setShowPasswordForm((visible) => !visible); setAccountMessage({ type: '', text: '' }) }}>{showPasswordForm ? 'Cancel' : 'Change password'}</button><button className="dashboard-logout" type="button" onClick={logOut} disabled={accountBusy}>Log out</button></div>{showPasswordForm && <form onSubmit={changePassword}><label>Current password<input type="password" autoComplete="current-password" required value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} /></label><label>New password<input type="password" autoComplete="new-password" required minLength="8" value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} /></label><label>Confirm new password<input type="password" autoComplete="new-password" required minLength="8" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} /></label><small>Use at least 8 characters with an uppercase letter, number, and special character.</small><button type="submit" disabled={accountBusy}>{accountBusy ? 'Updating…' : 'Update password'}</button></form>}{accountMessage.text && <p className={`dashboard-account-message ${accountMessage.type}`} role={accountMessage.type === 'error' ? 'alert' : 'status'}>{accountMessage.text}</p>}</section></aside>
        </div>
      </main>
    </div>
  )
}
