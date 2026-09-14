import { useEffect, useMemo, useState } from 'react'

const emptyForm = {
  title: '', priceMmk: '', listingType: 'rent', propertyType: 'apartment', township: 'bahan', bedrooms: 2,
  bathrooms: 1, areaSqft: 500, floor: '', imageUrl: '', images: ['', ''], availabilityStatus: 'draft', reliableElectricity: true,
  generator: false, reliableWater: true, internetReady: false, airConditioning: false, parking: false,
  petFriendly: false, nearShops: false, nearBusStop: false, mainRoadAccess: false, security: false, maxOccupants: '',
}

const input = { width: '100%', padding: '11px 12px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', boxSizing: 'border-box' }
const label = { display: 'grid', gap: 6, color: '#444', fontSize: 13, fontWeight: 700 }
const button = { border: 0, borderRadius: 9, padding: '10px 15px', cursor: 'pointer', fontWeight: 700 }
const words = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/properties', { credentials: 'include' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to load listings.')
      setListings(result.properties || [])
    }).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'users' || usersLoaded) return
    setUsersLoading(true)
    setError('')
    fetch('/api/admin/users', { credentials: 'include' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to load users.')
      setUsers(result.users || [])
      setUsersLoaded(true)
    }).catch((loadError) => setError(loadError.message)).finally(() => setUsersLoading(false))
  }, [activeTab, usersLoaded])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return listings.filter((item) => {
      const matchesType = typeFilter === 'all' || item.listingType === typeFilter
      const matchesStatus = statusFilter === 'all' || (item.availabilityStatus || 'available') === statusFilter
      const matchesSearch = !needle || [item.title, item.id, item.township, item.propertyType, item.listingType]
        .some((value) => String(value || '').toLowerCase().includes(needle))
      return matchesType && matchesStatus && matchesSearch
    })
  }, [listings, query, typeFilter, statusFilter])

  const typeCounts = useMemo(() => ({
    all: listings.length,
    rent: listings.filter((item) => item.listingType === 'rent').length,
    buy: listings.filter((item) => item.listingType === 'buy').length,
    land: listings.filter((item) => item.listingType === 'land').length,
  }), [listings])
  const statusCounts = useMemo(() => ({
    all: listings.length,
    draft: listings.filter((item) => item.availabilityStatus === 'draft').length,
    available: listings.filter((item) => (item.availabilityStatus || 'available') === 'available').length,
    unavailable: listings.filter((item) => item.availabilityStatus === 'unavailable').length,
  }), [listings])
  const userStatusCounts = useMemo(() => ({
    all: users.length,
    active: users.filter((user) => (user.status || 'active') === 'active').length,
    suspended: users.filter((user) => user.status === 'suspended').length,
  }), [users])
  const filteredUsers = useMemo(() => {
    const needle = userQuery.trim().toLowerCase()
    return users.filter((user) => {
      const matchesStatus = userStatusFilter === 'all' || (user.status || 'active') === userStatusFilter
      const matchesSearch = !needle || [user.name, user.email, user.role].some((value) => String(value || '').toLowerCase().includes(needle))
      return matchesStatus && matchesSearch
    })
  }, [users, userQuery, userStatusFilter])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const showListings = (status = 'all') => { setStatusFilter(status); setActiveTab('listings') }
  const openNew = () => { setActiveTab('listings'); setEditingId(null); setForm(emptyForm); setError(''); setFormOpen(true) }
  const openEdit = (listing) => {
    setEditingId(listing.id)
    const images = Array.isArray(listing.images) && listing.images.length ? listing.images.slice(0, 4) : [listing.imageUrl || '', '']
    while (images.length < 2) images.push('')
    setForm({ ...emptyForm, ...listing, floor: listing.floor ?? '', imageUrl: images[0], images })
    setError(''); setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveListing = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const url = editingId ? `/api/properties/${encodeURIComponent(editingId)}` : '/api/properties'
      const images = form.images.map((image) => image.trim()).filter(Boolean)
      const payload = { ...form, imageUrl: images[0] || '', images, priceMmk: Number(form.priceMmk), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), areaSqft: Number(form.areaSqft), floor: form.floor === '' ? null : Number(form.floor), maxOccupants: form.maxOccupants === '' ? null : Number(form.maxOccupants) }
      const response = await fetch(url, { method: editingId ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to save listing.')
      setListings((current) => editingId ? current.map((item) => item.id === editingId ? result.property : item) : [result.property, ...current])
      setFormOpen(false)
    } catch (saveError) { setError(saveError.message) } finally { setSaving(false) }
  }

  const deleteListing = async (listing) => {
    if (!window.confirm(`Delete “${listing.title}”? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(listing.id)}`, { method: 'DELETE', credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to delete listing.')
      setListings((current) => current.filter((item) => item.id !== listing.id))
    } catch (deleteError) { setError(deleteError.message) }
  }

  const changeStatus = async (listing, availabilityStatus) => {
    setError('')
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(listing.id)}/status`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ availabilityStatus }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to update listing status.')
      setListings((current) => current.map((item) => item.id === listing.id ? result.property : item))
    } catch (statusError) { setError(statusError.message) }
  }

  const changeUserStatus = async (user, status) => {
    setError('')
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/status`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to update user status.')
      setUsers((current) => current.map((item) => item.id === user.id ? result.user : item))
    } catch (statusError) { setError(statusError.message) }
  }

  const toggles = [['reliableElectricity', 'Reliable electricity'], ['generator', 'Generator'], ['reliableWater', 'Reliable water'], ['internetReady', 'Wi-Fi ready'], ['airConditioning', 'Air conditioning'], ['parking', 'Parking'], ['security', 'Security'], ['petFriendly', 'Pets allowed'], ['nearShops', 'Near shops'], ['nearBusStop', 'Near YBS bus stop'], ['mainRoadAccess', 'Main-road access']]

  return <div style={{ display: 'flex', minHeight: '100vh', background: '#fff8f6', fontFamily: 'Inter, Arial, sans-serif' }}>
    <aside style={{ width: 235, background: '#fff', padding: 24, borderRight: '1px solid #ffe0d8' }}>
      <h2 style={{ margin: '0 0 30px' }}>HavenMatch <span style={{ color: '#ff5838' }}>Admin</span></h2>
      <nav style={{ display: 'grid', gap: 9 }}>
        <button onClick={() => setActiveTab('overview')} style={{ ...button, textAlign: 'left', background: activeTab === 'overview' ? '#ff5838' : 'transparent', color: activeTab === 'overview' ? '#fff' : '#555' }}>Overview</button>
        <button onClick={() => setActiveTab('listings')} style={{ ...button, textAlign: 'left', background: activeTab === 'listings' ? '#ff5838' : 'transparent', color: activeTab === 'listings' ? '#fff' : '#555' }}>Manage Listings</button>
        <button onClick={() => setActiveTab('users')} style={{ ...button, textAlign: 'left', background: activeTab === 'users' ? '#ff5838' : 'transparent', color: activeTab === 'users' ? '#fff' : '#555' }}>Manage Users</button>
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
        <div aria-label="Filter listings by status" style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 16 }}>
          {[['all', 'All Statuses'], ['draft', 'Draft'], ['available', 'Available'], ['unavailable', 'Unavailable']].map(([value, text]) => <button key={value} type="button" onClick={() => setStatusFilter(value)} style={{ ...button, background: statusFilter === value ? '#7f2e20' : '#fff', color: statusFilter === value ? '#fff' : '#334', border: statusFilter === value ? '1px solid #7f2e20' : '1px solid #ddd' }}>{text} ({statusCounts[value]})</button>)}
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
              <label style={label}>Availability<select value={form.availabilityStatus} onChange={(e) => update('availabilityStatus', e.target.value)} style={input}><option value="draft">Draft</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>
              <fieldset style={{ gridColumn: '1 / -1', border: '1px solid #ffe0d8', borderRadius: 11, padding: 15 }}><legend style={{ fontWeight: 700, color: '#444', padding: '0 6px' }}>Property images (2–4)</legend><div style={{ display: 'grid', gap: 10 }}>{form.images.map((image, index) => <div key={index} style={{ display: 'flex', gap: 8 }}><input required={index < 2} value={image} onChange={(event) => update('images', form.images.map((item, imageIndex) => imageIndex === index ? event.target.value : item))} placeholder={index === 0 ? 'Cover image URL' : `Image ${index + 1} URL`} aria-label={index === 0 ? 'Cover image URL' : `Property image ${index + 1} URL`} style={input} />{form.images.length > 2 && <button type="button" onClick={() => update('images', form.images.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Remove image ${index + 1}`} style={{ ...button, background: '#f6f6f6', color: '#a33' }}>Remove</button>}</div>)}</div>{form.images.length < 4 && <button type="button" onClick={() => update('images', [...form.images, ''])} style={{ ...button, background: '#fff0ec', color: '#b93620', marginTop: 10 }}>＋ Add another image</button>}<small style={{ display: 'block', color: '#777', marginTop: 8 }}>The first image is the listing cover. Use local /images paths or http(s) URLs.</small></fieldset>
            </div>
            {form.images[0] && <img src={form.images[0]} alt="Property preview" style={{ width: 150, height: 95, objectFit: 'cover', borderRadius: 10, marginTop: 16 }} />}
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
              <td style={{ padding: 12, fontSize: 13 }}>{words(item.listingType)} · {words(item.propertyType)}</td><td style={{ padding: 12, fontSize: 13 }}>{words(item.township)}</td><td style={{ padding: 12, fontSize: 13 }}>{item.bedrooms ?? '—'} bd · {item.bathrooms ?? '—'} ba<br/><small>{item.areaSqft ? `${item.areaSqft} sq ft` : 'Area not stated'} · {item.maxOccupants ? `${item.maxOccupants} people` : 'occupancy not stated'}</small></td><td style={{ padding: 12, fontWeight: 750, color: '#d94227', whiteSpace: 'nowrap' }}>{Number(item.priceMmk || 0).toLocaleString()} MMK</td><td style={{ padding: 12, fontSize: 13 }}><select aria-label={`Status for ${item.title}`} value={item.availabilityStatus || 'available'} onChange={(event) => changeStatus(item, event.target.value)} style={{ ...input, minWidth: 120, padding: '7px 8px' }}><option value="draft">Draft</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></td>
              <td style={{ padding: 12, whiteSpace: 'nowrap' }}><button onClick={() => openEdit(item)} style={{ ...button, padding: '7px 10px', background: '#fff0ec', color: '#b93620', marginRight: 7 }}>Edit</button><button onClick={() => deleteListing(item)} style={{ ...button, padding: '7px 10px', background: '#f6f6f6', color: '#a33' }}>Delete</button></td>
            </tr>)}
          </tbody></table></div>
        </section>
      </> : activeTab === 'users' ? <>
        <header style={{ marginBottom: 22 }}><h1 style={{ margin: 0, fontSize: 27 }}>Manage Users</h1><p style={{ margin: '6px 0 0', color: '#777' }}>View customer accounts and control account access.</p></header>
        {error && <div role="alert" style={{ padding: 12, borderRadius: 9, background: '#ffe9e5', color: '#a52b18', marginBottom: 16 }}>{error}</div>}
        <section aria-label="User summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))', gap: 16, marginBottom: 20 }}>
          {[['all', 'Total users', '#253f48'], ['active', 'Active', '#26734d'], ['suspended', 'Suspended', '#a33']].map(([status, text, color]) => <button key={status} type="button" onClick={() => setUserStatusFilter(status)} style={{ background: '#fff', border: userStatusFilter === status ? `2px solid ${color}` : '1px solid #ffe0d8', borderRadius: 15, padding: 20, textAlign: 'left', cursor: 'pointer' }}><strong style={{ display: 'block', color, fontSize: 28 }}>{usersLoading ? '—' : userStatusCounts[status]}</strong><span style={{ color: '#555', fontWeight: 700 }}>{text}</span></button>)}
        </section>
        <section style={{ background: '#fff', border: '1px solid #ffe0d8', borderRadius: 15, overflow: 'hidden' }}><div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', gap: 16 }}><input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Search name, email, or role" aria-label="Search users" style={{ ...input, maxWidth: 430 }} /><strong style={{ color: '#666', fontSize: 13, alignSelf: 'center' }}>Showing {filteredUsers.length} of {users.length}</strong></div><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr style={{ background: '#fff3f0', color: '#7f2e20' }}>{['Name', 'Email', 'Role', 'Registered', 'Last login', 'Status', 'Action'].map((heading) => <th key={heading} style={{ padding: 14, fontSize: 13 }}>{heading}</th>)}</tr></thead><tbody>{usersLoading ? <tr><td colSpan="7" style={{ padding: 35, textAlign: 'center' }}>Loading users…</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan="7" style={{ padding: 35, textAlign: 'center' }}>No users found.</td></tr> : filteredUsers.map((user) => <tr key={user.id} style={{ borderTop: '1px solid #eee' }}><td style={{ padding: 14, fontWeight: 700 }}>{user.name}</td><td style={{ padding: 14 }}>{user.email}</td><td style={{ padding: 14 }}>{words(user.role || 'user')}</td><td style={{ padding: 14 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td><td style={{ padding: 14 }}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td><td style={{ padding: 14 }}>{words(user.status || 'active')}</td><td style={{ padding: 14 }}>{user.role === 'admin' ? <small>Protected admin</small> : <button type="button" onClick={() => changeUserStatus(user, user.status === 'suspended' ? 'active' : 'suspended')} style={{ ...button, padding: '7px 10px', background: user.status === 'suspended' ? '#e7f6ed' : '#fff0ec', color: user.status === 'suspended' ? '#26734d' : '#a33' }}>{user.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>}</td></tr>)}</tbody></table></div></section>
      </> : <>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 24 }}><div><h1 style={{ margin: 0, fontSize: 27 }}>Property Overview</h1><p style={{ margin: '6px 0 0', color: '#777' }}>A quick view of the listings managed by HavenMatch.</p></div><button onClick={openNew} style={{ ...button, background: '#ff5838', color: '#fff', fontSize: 15 }}>＋ Add New Listing</button></header>
        {error && <div role="alert" style={{ padding: 12, borderRadius: 9, background: '#ffe9e5', color: '#a52b18', marginBottom: 16 }}>{error}</div>}
        <section aria-label="Listing summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[['all', 'Total listings', '#253f48'], ['available', 'Available', '#26734d'], ['draft', 'Draft', '#9a6713'], ['unavailable', 'Unavailable', '#a33']].map(([status, text, color]) => <button key={status} type="button" onClick={() => showListings(status)} style={{ background: '#fff', border: '1px solid #ffe0d8', borderRadius: 15, padding: 22, textAlign: 'left', cursor: 'pointer' }}><strong style={{ display: 'block', color, fontSize: 30, marginBottom: 7 }}>{loading ? '—' : statusCounts[status]}</strong><span style={{ color: '#555', fontWeight: 700 }}>{text}</span></button>)}
        </section>
        <section style={{ background: '#fff', border: '1px solid #ffe0d8', borderRadius: 15, overflow: 'hidden' }}><div style={{ padding: 18, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h2 style={{ margin: 0, fontSize: 19 }}>Recently updated listings</h2><p style={{ margin: '5px 0 0', color: '#777', fontSize: 13 }}>Open Listings to search, edit, or change availability.</p></div><button type="button" onClick={() => showListings()} style={{ ...button, background: '#fff0ec', color: '#b93620' }}>View all listings</button></div><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr style={{ background: '#fff3f0' }}>{['Property', 'Type', 'Township', 'Price', 'Status'].map((heading) => <th key={heading} style={{ padding: 14, fontSize: 13 }}>{heading}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan="5" style={{ padding: 30, textAlign: 'center' }}>Loading listings…</td></tr> : listings.slice(0, 5).map((item) => <tr key={item.id} style={{ borderTop: '1px solid #eee' }}><td style={{ padding: 14, fontWeight: 700 }}>{item.title}</td><td style={{ padding: 14 }}>{words(item.listingType)}</td><td style={{ padding: 14 }}>{words(item.township)}</td><td style={{ padding: 14 }}>{Number(item.priceMmk || 0).toLocaleString()} MMK</td><td style={{ padding: 14 }}>{words(item.availabilityStatus || 'available')}</td></tr>)}</tbody></table></div></section>
      </>}
    </main>
  </div>
}
