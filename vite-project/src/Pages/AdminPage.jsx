import { useEffect, useMemo, useState } from 'react'

const emptyForm = {
  title: '', priceMmk: '', listingType: 'rent', propertyType: 'apartment', township: 'bahan', bedrooms: 2,
  bathrooms: 1, areaSqft: 500, floor: '', imageUrl: '', availabilityStatus: 'available', reliableElectricity: true,
  generator: false, reliableWater: true, internetReady: false, airConditioning: false, parking: false,
  petFriendly: false, nearShops: false, nearBusStop: false, mainRoadAccess: false, security: false, maxOccupants: '',
}

const input = { width: '100%', padding: '11px 12px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', boxSizing: 'border-box' }
const label = { display: 'grid', gap: 6, color: '#444', fontSize: 13, fontWeight: 700 }
const button = { border: 0, borderRadius: 9, padding: '10px 15px', cursor: 'pointer', fontWeight: 700 }
const words = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('listings')
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/properties').then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to load listings.')
      setListings(result.properties || [])
    }).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab === 'users') setUsers(JSON.parse(localStorage.getItem('registered_users_log') || '[]'))
  }, [activeTab])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return listings.filter((item) => {
      const matchesType = typeFilter === 'all' || item.listingType === typeFilter
      const matchesSearch = !needle || [item.title, item.id, item.township, item.propertyType, item.listingType]
        .some((value) => String(value || '').toLowerCase().includes(needle))
      return matchesType && matchesSearch
    })
  }, [listings, query, typeFilter])

  const typeCounts = useMemo(() => ({
    all: listings.length,
    rent: listings.filter((item) => item.listingType === 'rent').length,
    buy: listings.filter((item) => item.listingType === 'buy').length,
    land: listings.filter((item) => item.listingType === 'land').length,
  }), [listings])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const openNew = () => { setEditingId(null); setForm(emptyForm); setError(''); setFormOpen(true) }
  const openEdit = (listing) => {
    setEditingId(listing.id)
    setForm({ ...emptyForm, ...listing, floor: listing.floor ?? '', imageUrl: listing.imageUrl || '' })
    setError(''); setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveListing = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const url = editingId ? `/api/properties/${encodeURIComponent(editingId)}` : '/api/properties'
      const payload = { ...form, priceMmk: Number(form.priceMmk), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), areaSqft: Number(form.areaSqft), floor: form.floor === '' ? null : Number(form.floor), maxOccupants: form.maxOccupants === '' ? null : Number(form.maxOccupants), images: form.imageUrl ? [form.imageUrl] : [] }
      const response = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to save listing.')
      setListings((current) => editingId ? current.map((item) => item.id === editingId ? result.property : item) : [result.property, ...current])
      setFormOpen(false)
    } catch (saveError) { setError(saveError.message) } finally { setSaving(false) }
  }

  const deleteListing = async (listing) => {
    if (!window.confirm(`Delete “${listing.title}”? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(listing.id)}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to delete listing.')
      setListings((current) => current.filter((item) => item.id !== listing.id))
    } catch (deleteError) { setError(deleteError.message) }
  }

  const toggles = [['reliableElectricity', 'Reliable electricity'], ['generator', 'Generator'], ['reliableWater', 'Reliable water'], ['internetReady', 'Wi-Fi ready'], ['airConditioning', 'Air conditioning'], ['parking', 'Parking'], ['security', 'Security'], ['petFriendly', 'Pets allowed'], ['nearShops', 'Near shops'], ['nearBusStop', 'Near YBS bus stop'], ['mainRoadAccess', 'Main-road access']]

  return <div style={{ display: 'flex', minHeight: '100vh', background: '#fff8f6', fontFamily: 'Inter, Arial, sans-serif' }}>
    <aside style={{ width: 235, background: '#fff', padding: 24, borderRight: '1px solid #ffe0d8' }}>
      <h2 style={{ margin: '0 0 30px' }}>HavenMatch <span style={{ color: '#ff5838' }}>Admin</span></h2>
      <nav style={{ display: 'grid', gap: 9 }}>
        <button onClick={() => setActiveTab('listings')} style={{ ...button, textAlign: 'left', background: activeTab === 'listings' ? '#ff5838' : 'transparent', color: activeTab === 'listings' ? '#fff' : '#555' }}>Manage Listings</button>
        <button onClick={() => setActiveTab('users')} style={{ ...button, textAlign: 'left', background: activeTab === 'users' ? '#ff5838' : 'transparent', color: activeTab === 'users' ? '#fff' : '#555' }}>User Activity Logs</button>
      </nav>
    </aside>
    <main style={{ flex: 1, padding: 34, minWidth: 0 }}>
      {activeTab === 'listings' ? <>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 22 }}>
          <div><h1 style={{ margin: 0, fontSize: 27 }}>Manage Property Listings</h1><p style={{ margin: '6px 0 0', color: '#777' }}>{listings.length} listings in the shared property data store</p></div>
          <button onClick={openNew} style={{ ...button, background: '#ff5838', color: '#fff', fontSize: 15 }}>＋ Add New Listing</button>
        </header>
        {error && <div role="alert" style={{ padding: 12, borderRadius: 9, background: '#ffe9e5', color: '#a52b18', marginBottom: 16 }}>{error}</div>}
        <div aria-label="Filter listings by type" style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 16 }}>
          {[['all', 'All Listings'], ['rent', 'For Rent'], ['buy', 'For Sale'], ['land', 'Land']].map(([value, text]) => <button key={value} type="button" onClick={() => setTypeFilter(value)} style={{ ...button, background: typeFilter === value ? '#253f48' : '#fff', color: typeFilter === value ? '#fff' : '#334', border: typeFilter === value ? '1px solid #253f48' : '1px solid #ddd' }}>{text} ({typeCounts[value]})</button>)}
        </div>
        {formOpen && <section style={{ background: '#fff', border: '1px solid #ffd9d0', borderRadius: 15, padding: 24, marginBottom: 24, boxShadow: '0 8px 28px rgba(80,30,20,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20 }}>{editingId ? 'Edit Property Listing' : 'Add New Property Listing'}</h2><button onClick={() => setFormOpen(false)} aria-label="Close form" style={{ ...button, background: '#f5f5f5' }}>✕</button></div>
          <form onSubmit={saveListing}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))', gap: 16 }}>
              <label style={{ ...label, gridColumn: 'span 2' }}>Title<input required value={form.title} onChange={(e) => update('title', e.target.value)} style={input} /></label>
              <label style={label}>Price (MMK)<input required min="1" type="number" value={form.priceMmk} onChange={(e) => update('priceMmk', e.target.value)} style={input} /></label>
              <label style={label}>Listing type<select value={form.listingType} onChange={(e) => update('listingType', e.target.value)} style={input}><option value="rent">Rent</option><option value="buy">Buy</option><option value="land">Land</option></select></label>
              <label style={label}>Property type<input value={form.propertyType} onChange={(e) => update('propertyType', e.target.value)} style={input} /></label>
              <label style={label}>Township<input value={form.township} onChange={(e) => update('township', e.target.value.toLowerCase().replaceAll(' ', '_'))} style={input} /></label>
              <label style={label}>Bedrooms<input min="0" type="number" value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} style={input} /></label>
              <label style={label}>Bathrooms<input min="0" type="number" value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} style={input} /></label>
              <label style={label}>Area (sq ft)<input min="1" type="number" value={form.areaSqft} onChange={(e) => update('areaSqft', e.target.value)} style={input} /></label>
              <label style={label}>Floor<input min="0" type="number" value={form.floor} onChange={(e) => update('floor', e.target.value)} style={input} /></label>
              <label style={label}>Maximum occupants<input min="1" type="number" value={form.maxOccupants} onChange={(e) => update('maxOccupants', e.target.value)} placeholder="Not specified" style={input} /></label>
              <label style={label}>Availability<select value={form.availabilityStatus} onChange={(e) => update('availabilityStatus', e.target.value)} style={input}><option value="available">Available</option><option value="unverified">Unverified</option><option value="unavailable">Unavailable</option></select></label>
              <label style={{ ...label, gridColumn: 'span 2' }}>Property image URL<input value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} placeholder="/images/property.png or https://…" style={input} /></label>
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="Property preview" style={{ width: 150, height: 95, objectFit: 'cover', borderRadius: 10, marginTop: 16 }} />}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, background: '#fff8f6', border: '1px solid #ffe0d8', borderRadius: 11, padding: 15, marginTop: 18 }}>{toggles.map(([key, text]) => <label key={key} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 13, fontWeight: 650 }}><input type="checkbox" checked={Boolean(form[key])} onChange={(e) => update(key, e.target.checked)} />{text}</label>)}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}><button type="button" onClick={() => setFormOpen(false)} style={{ ...button, background: '#eee' }}>Cancel</button><button disabled={saving} style={{ ...button, background: '#ff5838', color: '#fff' }}>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Save Listing'}</button></div>
          </form>
        </section>}
        <section style={{ background: '#fff', border: '1px solid #ffe0d8', borderRadius: 15, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, township, type, or property ID" aria-label="Search property listings" style={{ ...input, maxWidth: 430 }} /><strong style={{ color: '#666', fontSize: 13, whiteSpace: 'nowrap' }}>Showing {filtered.length} of {listings.length}</strong></div>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr style={{ background: '#fff3f0', color: '#7f2e20' }}>{['Property ID', 'Property', 'Type', 'Location', 'Details', 'Price', 'Status', 'Actions'].map((heading) => <th key={heading} style={{ padding: 14, fontSize: 13 }}>{heading}</th>)}</tr></thead><tbody>
            {loading ? <tr><td colSpan="8" style={{ padding: 35, textAlign: 'center' }}>Loading listings…</td></tr> : filtered.length === 0 ? <tr><td colSpan="8" style={{ padding: 35, textAlign: 'center' }}>No listings found.</td></tr> : filtered.map((item) => <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12, color: '#555', whiteSpace: 'nowrap' }}>{item.id}</td>
              <td style={{ padding: 12, minWidth: 230 }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><img src={item.imageUrl || '/images/two-bedroom.png'} alt="" style={{ width: 64, height: 48, borderRadius: 8, objectFit: 'cover', background: '#eee' }} /><strong style={{ display: 'block', fontSize: 13 }}>{item.title}</strong></div></td>
              <td style={{ padding: 12, fontSize: 13 }}>{words(item.listingType)} · {words(item.propertyType)}</td><td style={{ padding: 12, fontSize: 13 }}>{words(item.township)}</td><td style={{ padding: 12, fontSize: 13 }}>{item.bedrooms ?? '—'} bd · {item.bathrooms ?? '—'} ba<br/><small>{item.areaSqft ? `${item.areaSqft} sq ft` : 'Area not stated'} · {item.maxOccupants ? `${item.maxOccupants} people` : 'occupancy not stated'}</small></td><td style={{ padding: 12, fontWeight: 750, color: '#d94227', whiteSpace: 'nowrap' }}>{Number(item.priceMmk || 0).toLocaleString()} MMK</td><td style={{ padding: 12, fontSize: 13 }}>{words(item.availabilityStatus || 'available')}</td>
              <td style={{ padding: 12, whiteSpace: 'nowrap' }}><button onClick={() => openEdit(item)} style={{ ...button, padding: '7px 10px', background: '#fff0ec', color: '#b93620', marginRight: 7 }}>Edit</button><button onClick={() => deleteListing(item)} style={{ ...button, padding: '7px 10px', background: '#f6f6f6', color: '#a33' }}>Delete</button></td>
            </tr>)}
          </tbody></table></div>
        </section>
      </> : <><header style={{ marginBottom: 22 }}><h1 style={{ margin: 0, fontSize: 27 }}>User Activity Logs</h1><p style={{ color: '#777' }}>Registered user activity stored on this device.</p></header><section style={{ background: '#fff', border: '1px solid #ffe0d8', borderRadius: 15, overflow: 'hidden' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr style={{ background: '#fff3f0' }}>{['User', 'Email', 'Last active', 'Status'].map((heading) => <th key={heading} style={{ padding: 14 }}>{heading}</th>)}</tr></thead><tbody>{users.length ? users.map((user) => <tr key={user.id} style={{ borderTop: '1px solid #eee' }}><td style={{ padding: 14 }}>{user.name}</td><td style={{ padding: 14 }}>{user.email}</td><td style={{ padding: 14 }}>{user.lastActive}</td><td style={{ padding: 14 }}>{user.status || 'Active'}</td></tr>) : <tr><td colSpan="4" style={{ padding: 35, textAlign: 'center' }}>No user activity has been recorded.</td></tr>}</tbody></table></section></>}
    </main>
  </div>
}
