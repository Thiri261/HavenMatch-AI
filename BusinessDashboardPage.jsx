import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import useSession, { announceAuthChange } from '../hooks/useSession'

const emptyForm = {
  title: '', priceMmk: '', listingType: 'rent', propertyType: 'apartment', township: 'bahan', bedrooms: 2,
  bathrooms: 1, areaSqft: 500, floor: '', images: ['', '', '', ''], reliableElectricity: true,
  generator: false, reliableWater: true, internetReady: false, airConditioning: false, parking: false,
  petFriendly: false, nearShops: false, nearBusStop: false, mainRoadAccess: false, security: false, maxOccupants: '',
}

const input = { width: '100%', padding: '11px 12px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', boxSizing: 'border-box' }
const label = { display: 'grid', gap: 6, color: '#444', fontSize: 13, fontWeight: 700 }
const button = { border: 0, borderRadius: 9, padding: '10px 15px', cursor: 'pointer', fontWeight: 700 }
const words = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const statusMeta = {
  pending: ['Pending review', '#9a6713'],
  available: ['Approved · visible', '#26734d'],
  rejected: ['Rejected', '#a33'],
  draft: ['Draft', '#7a8690'],
  unavailable: ['Unavailable', '#7a8690'],
}

export default function BusinessDashboardPage() {
  const { session, loading } = useSession()
  const [listings, setListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(-1)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [contact, setContact] = useState({ name: '', phone: '', email: '', location: '' })
  const [contactLoading, setContactLoading] = useState(true)
  const [savingContact, setSavingContact] = useState(false)
  const [tourRequests, setTourRequests] = useState([])
  const [tourRequestsLoading, setTourRequestsLoading] = useState(true)
  const [markingTour, setMarkingTour] = useState('')

  useEffect(() => {
    if (!loading && !session) window.location.assign('#signin')
  }, [session, loading])

  useEffect(() => {
    if (loading || !session) return
    fetch('/api/business/properties', { credentials: 'include' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to load your listings.')
      setListings(result.properties || [])
    }).catch((loadError) => setError(loadError.message)).finally(() => setLoadingListings(false))
    fetch('/api/business/tour-requests', { credentials: 'include' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to load your tour requests.')
      setTourRequests(result.tourRequests || [])
    }).catch((loadError) => setError(loadError.message)).finally(() => setTourRequestsLoading(false))
  }, [loading, session])

  useEffect(() => {
    if (loading || !session) return
    fetch('/api/business/contact', { credentials: 'include' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to load your contact details.')
      setContact(result.contact || { name: '', phone: '', email: '', location: '' })
    }).catch((loadError) => setError(loadError.message)).finally(() => setContactLoading(false))
  }, [loading, session])

  const saveContact = async (event) => {
    event.preventDefault(); setSavingContact(true); setError('')
    try {
      const response = await fetch('/api/business/contact', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: contact.phone, email: contact.email, location: contact.location }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to save contact details.')
      if (result.contact) setContact(result.contact)
    } catch (contactError) { setError(contactError.message) } finally { setSavingContact(false) }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return listings.filter((item) => {
      const matchesStatus = statusFilter === 'all' || (item.availabilityStatus || 'pending') === statusFilter
      const matchesSearch = !needle || [item.title, item.id, item.township, item.propertyType, item.listingType]
        .some((value) => String(value || '').toLowerCase().includes(needle))
      return matchesStatus && matchesSearch
    })
  }, [listings, query, statusFilter])

  const statusCounts = useMemo(() => ({
    all: listings.length,
    pending: listings.filter((item) => (item.availabilityStatus || 'pending') === 'pending').length,
    available: listings.filter((item) => (item.availabilityStatus || 'pending') === 'available').length,
    rejected: listings.filter((item) => item.availabilityStatus === 'rejected').length,
  }), [listings])

  if (loading || !session) return null
  const contactApproved = contact.status === 'approved'
  if (session.role !== 'business' && session.role !== 'admin') {
    return (
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main"><section className="auth-page"><div className="auth-card"><h2>Access denied</h2><p className="auth-intro">A vendor account is required to open this page.</p><a className="auth-submit" href="#dashboard">Go to my dashboard</a></div></section></main>
      </div>
    )
  }

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const uploadImage = async (index, file) => {
    if (!file) return
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) { setError('Upload a JPG, PNG, GIF, or WebP photo.'); return }
    const readFileAsDataUrl = (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Unable to read the selected photo.'))
      reader.readAsDataURL(blob)
    })
    try {
      setUploadingImage(index); setError('')
      const data = await readFileAsDataUrl(file)
      const response = await fetch('/api/business/upload', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to upload photo.')
      setForm((current) => ({ ...current, images: current.images.map((image, imageIndex) => imageIndex === index ? result.url : image) }))
    } catch (uploadError) { setError(uploadError.message) } finally { setUploadingImage(-1) }
  }
  const openNew = () => {
    if (!contactApproved) { setError('Add your contact details and have an admin approve them before posting listings.'); return }
    setEditingId(null); setForm(emptyForm); setError(''); setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openEdit = (listing) => {
    setEditingId(listing.id)
    const images = Array.isArray(listing.images) && listing.images.length ? listing.images.slice(0, 8) : ['', '', '', '']
    while (images.length < 4) images.push('')
    setForm({ ...emptyForm, ...listing, floor: listing.floor ?? '', images })
    setError(''); setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveListing = async (event) => {
    event.preventDefault(); if (!contactApproved) { setError('Your contact details must be approved by an admin before you can post listings.'); return }
    setSaving(true); setError('')
    try {
      const url = editingId ? `/api/business/properties/${encodeURIComponent(editingId)}` : '/api/business/properties'
      const images = form.images.map((image) => image.trim()).filter(Boolean)
      const payload = { ...form, images, priceMmk: Number(form.priceMmk), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), areaSqft: Number(form.areaSqft), floor: form.floor === '' ? null : Number(form.floor), maxOccupants: form.maxOccupants === '' ? null : Number(form.maxOccupants) }
      const response = await fetch(url, { method: editingId ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to save listing.')
      setListings((current) => editingId ? current.map((item) => item.id === editingId ? result.property : item) : [result.property, ...current])
      setFormOpen(false)
    } catch (saveError) { setError(saveError.message) } finally { setSaving(false) }
  }

const deleteListing = async (listing) => {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/business/properties/${encodeURIComponent(listing.id)}`, { method: 'DELETE', credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to delete listing.')
      setListings((current) => current.filter((item) => item.id !== listing.id))
    } catch (deleteError) { setError(deleteError.message) }
  }

  const markTourSeen = async (id) => {
    try {
      setMarkingTour(id)
      const response = await fetch(`/api/business/tour-requests/${encodeURIComponent(id)}/seen`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to mark as seen.')
      setTourRequests((current) => current.map((item) => item.id === id ? { ...item, seen: true } : item))
    } catch (err) { setError(err.message) } finally { setMarkingTour('') }
  }

  const logOut = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } finally {
      announceAuthChange(null)
      window.location.assign('#signin')
    }
  }

  const toggles = [['reliableElectricity', 'Reliable electricity'], ['generator', 'Generator'], ['reliableWater', 'Reliable water'], ['internetReady', 'Wi-Fi ready'], ['airConditioning', 'Air conditioning'], ['parking', 'Parking'], ['security', 'Security'], ['petFriendly', 'Pets allowed'], ['nearShops', 'Near shops'], ['nearBusStop', 'Near YBS bus stop'], ['mainRoadAccess', 'Main-road access']]

  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-main">
        <header className="dashboard-welcome">
          <div>
            <p>VENDOR PORTAL</p>
            <h1>Welcome back, {session.name.split(' ')[0]}</h1>
            <span>Post housing listings for review. Approved listings are shown to purchasers.</span>
          </div>
          {contactApproved ? <button onClick={openNew} style={{ ...button, background: '#ff5838', color: '#fff', fontSize: 15, border: 0, padding: '12px 18px', borderRadius: 10 }}>＋ Post New Listing</button> :
            <button type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} style={{ ...button, background: '#fff0ec', color: '#b93620', fontSize: 14, border: '1px solid #ffcdc2', padding: '12px 18px', borderRadius: 10 }}>Complete contact details first</button>}
        </header>

        {!contactApproved && <div role="status" style={{ padding: 14, borderRadius: 12, background: contact.status === 'rejected' ? '#ffe9e5' : '#fff4d6', color: contact.status === 'rejected' ? '#a52b18' : '#8a6114', marginBottom: 22, fontSize: 14, fontWeight: 700, border: `1px solid ${contact.status === 'rejected' ? '#ffcdc2' : '#f0ddb4'}` }}>
          {contact.status === 'rejected'
            ? 'Your contact details were rejected by the admin. Update them below and save, then the admin will review them again — you cannot post new listings until they are approved.'
            : contact.status === 'pending'
              ? 'Your contact details are awaiting admin review. You cannot post new listings until the admin approves them.'
              : 'Add your contact details below and save them. An admin must approve them before you can post new listings.'}
        </div>}

        {error && <div role="alert" style={{ padding: 12, borderRadius: 9, background: '#ffe9e5', color: '#a52b18', marginBottom: 16 }}>{error}</div>}

        <section aria-label="Listing review summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[['all', 'Total listings', '#253f48'], ['pending', 'Pending review', '#9a6713'], ['available', 'Approved', '#26734d'], ['rejected', 'Rejected', '#a33']].map(([status, text, color]) => (
            <button key={status} type="button" onClick={() => setStatusFilter(status)} style={{ background: '#fff', border: statusFilter === status ? `2px solid ${color}` : '1px solid #ffe0d8', borderRadius: 15, padding: 22, textAlign: 'left', cursor: 'pointer' }}>
              <strong style={{ display: 'block', color, fontSize: 30, marginBottom: 7 }}>{loadingListings ? '—' : statusCounts[status]}</strong>
              <span style={{ color: '#555', fontWeight: 700 }}>{text}</span>
            </button>
          ))}
        </section>

        {tourRequestsLoading ? null : tourRequests.length > 0 && <section aria-label="Tour requests" style={{ background: '#fff', border: '1px solid #e6f5eb', borderRadius: 15, padding: 20, marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h2 style={{ margin: 0, fontSize: 18 }}>Tour requests ({tourRequests.length})</h2><small style={{ color: '#777' }}>Requests from purchasers wanting to visit your properties.</small></div>
          <div style={{ display: 'grid', gap: 10 }}>
            {tourRequests.map((item) => <div key={item.id} style={{ border: `1px solid ${item.seen ? '#e6f5eb' : '#ffe9e5'}`, borderRadius: 11, padding: 14, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ minWidth: 200 }}><strong style={{ display: 'block', fontSize: 14 }}>{item.requesterName}</strong><small style={{ color: '#7a8690' }}>{item.requesterEmail}</small></div>
              <div style={{ fontSize: 13, color: '#444', minWidth: 200 }}><div><strong>Listing:</strong> {item.listingTitle}</div>{item.note && <div style={{ marginTop: 4, fontStyle: 'italic' }}>"{item.note}"</div>}</div>
              <div style={{ fontSize: 13, color: '#7a8690' }}>{new Date(item.createdAt).toLocaleString()}</div>
              {!item.seen ? <button disabled={markingTour === item.id} onClick={() => markTourSeen(item.id)} style={{ ...button, background: '#e7f6ed', color: '#26734d', whiteSpace: 'nowrap', fontSize: 13 }}>{markingTour === item.id ? 'Marking…' : 'Mark as seen'}</button> : <span style={{ color: '#26734d', fontWeight: 700, fontSize: 13 }}>Seen</span>}
            </div>)}
          </div>
        </section>}

        {error && <div role="alert" style={{ padding: 12, borderRadius: 9, background: '#ffe9e5', color: '#a52b18', marginBottom: 16 }}>{error}</div>}

        {formOpen && <section style={{ background: '#fff', border: '1px solid #ffd9d0', borderRadius: 15, padding: 24, marginBottom: 24, boxShadow: '0 8px 28px rgba(80,30,20,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20 }}>{editingId ? 'Edit Housing Listing' : 'Post New Housing Listing'}</h2><button onClick={() => setFormOpen(false)} aria-label="Close form" style={{ ...button, background: '#f5f5f5' }}>✕</button></div>
          <p style={{ margin: '0 0 18px', color: '#7a8690', fontSize: 13 }}>Your posting will be submitted for admin review before it appears for purchasers.</p>
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
              <fieldset style={{ gridColumn: '1 / -1', border: '1px solid #ffe0d8', borderRadius: 11, padding: 15 }}><legend style={{ fontWeight: 700, color: '#444', padding: '0 6px' }}>Property images (4–8)</legend><div style={{ display: 'grid', gap: 10 }}>{form.images.map((image, index) => <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input required={index < 4} value={image} onChange={(event) => update('images', form.images.map((item, imageIndex) => imageIndex === index ? event.target.value : item))} placeholder={index === 0 ? 'Cover image URL' : `Image ${index + 1} URL`} aria-label={index === 0 ? 'Cover image URL' : `Property image ${index + 1} URL`} style={input} /><label style={{ ...button, padding: '9px 12px', background: '#fff0ec', color: '#b93620', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13 }}><input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => { uploadImage(index, event.target.files?.[0]); event.target.value = '' }} style={{ display: 'none' }} />{uploadingImage === index ? 'Uploading…' : image ? 'Replace photo' : '⇪ Upload photo'}</label>{form.images.length > 4 && <button type="button" onClick={() => update('images', form.images.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Remove image ${index + 1}`} style={{ ...button, background: '#f6f6f6', color: '#a33' }}>Remove</button>}</div>)}</div>{form.images.length < 8 && <button type="button" onClick={() => update('images', [...form.images, ''])} style={{ ...button, background: '#fff0ec', color: '#b93620', marginTop: 10 }}>＋ Add another image</button>}<small style={{ display: 'block', color: '#777', marginTop: 8 }}>Upload 4 to 8 photos. The first image is the listing cover.</small></fieldset>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, background: '#fff8f6', border: '1px solid #ffe0d8', borderRadius: 11, padding: 15, marginTop: 18 }}>{toggles.map(([key, text]) => <label key={key} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 13, fontWeight: 650 }}><input type="checkbox" checked={Boolean(form[key])} onChange={(e) => update(key, e.target.checked)} />{text}</label>)}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}><button type="button" onClick={() => setFormOpen(false)} style={{ ...button, background: '#eee' }}>Cancel</button><button disabled={saving} style={{ ...button, background: '#ff5838', color: '#fff' }}>{saving ? 'Saving…' : editingId ? 'Submit Updated Listing' : 'Submit for Review'}</button></div>
          </form>
        </section>}

        <section style={{ background: '#fff', border: '1px solid #ffe0d8', borderRadius: 15, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your listings" aria-label="Search your listings" style={{ ...input, maxWidth: 430 }} />
            <strong style={{ color: '#666', fontSize: 13, whiteSpace: 'nowrap' }}>Showing {filtered.length} of {listings.length}</strong>
          </div>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr style={{ background: '#fff3f0', color: '#7f2e20' }}>{['Listing ID', 'Property', 'Type', 'Location', 'Price', 'Review status', 'Actions'].map((heading) => <th key={heading} style={{ padding: 14, fontSize: 13 }}>{heading}</th>)}</tr></thead><tbody>
            {loadingListings ? <tr><td colSpan="7" style={{ padding: 35, textAlign: 'center' }}>Loading listings…</td></tr> : filtered.length === 0 ? <tr><td colSpan="7" style={{ padding: 35, textAlign: 'center' }}>No listings found. Post your first housing listing to get started.</td></tr> : filtered.map((item) => {
              const [statusText, statusColor] = statusMeta[item.availabilityStatus || 'pending'] || statusMeta.pending
              return <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12, color: '#555', whiteSpace: 'nowrap' }}>{item.id}</td>
                <td style={{ padding: 12, minWidth: 230 }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><img src={item.imageUrl || '/images/two-bedroom.png'} alt="" style={{ width: 64, height: 48, borderRadius: 8, objectFit: 'cover', background: '#eee' }} /><strong style={{ display: 'block', fontSize: 13 }}>{item.title}</strong></div></td>
                <td style={{ padding: 12, fontSize: 13 }}>{words(item.listingType)} · {words(item.propertyType)}</td>
                <td style={{ padding: 12, fontSize: 13 }}>{words(item.township)}</td>
                <td style={{ padding: 12, fontWeight: 750, color: '#d94227', whiteSpace: 'nowrap' }}>{Number(item.priceMmk || 0).toLocaleString()} MMK</td>
                <td style={{ padding: 12, fontSize: 13 }}><span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, background: `${statusColor}1a`, color: statusColor, fontWeight: 750, fontSize: 12, whiteSpace: 'nowrap' }}>{statusText}</span>{item.availabilityStatus === 'rejected' && <div style={{ fontSize: 12, color: '#a33', marginTop: 4 }}>Review note: rejected by administrator</div>}</td>
                <td style={{ padding: 12, whiteSpace: 'nowrap' }}><button onClick={() => openEdit(item)} style={{ ...button, padding: '7px 10px', background: '#fff0ec', color: '#b93620', marginRight: 7 }}>Edit</button><button onClick={() => deleteListing(item)} style={{ ...button, padding: '7px 10px', background: '#f6f6f6', color: '#a33' }}>Delete</button></td>
              </tr>
            })}
          </tbody></table></div>
        </section>

        <aside className="dashboard-sidebar" style={{ display: 'grid', gap: 16, marginTop: 22 }}>
          <section className="dashboard-account" style={{ background: '#fff', border: '1px solid #ffe0d8', borderRadius: 15, padding: 20 }}>
            <h2>Contact details</h2>
            <p style={{ margin: '2px 0 14px', color: '#7a8690', fontSize: 13 }}>Contact details must be approved by the admin before purchasers can see them on your listings.</p>
            {contactLoading ? <p style={{ color: '#999', fontSize: 13 }}>Loading contact details…</p> : <>
              {contact.status === 'pending' && <p role="status" style={{ margin: '0 0 14px', padding: '10px 12px', borderRadius: 9, background: '#fff4d6', color: '#8a6114', fontSize: 13, fontWeight: 700 }}>Submitted for admin review — shows on your listings once approved.</p>}
              {contact.status === 'rejected' && <p role="status" style={{ margin: '0 0 14px', padding: '10px 12px', borderRadius: 9, background: '#ffe9e5', color: '#a52b18', fontSize: 13, fontWeight: 700 }}>Rejected by the admin. Update your details and save to resubmit.</p>}
              {contact.status === 'approved' && <p role="status" style={{ margin: '0 0 14px', padding: '10px 12px', borderRadius: 9, background: '#e7f6ed', color: '#26734d', fontSize: 13, fontWeight: 700 }}>Approved — currently shown on your listings.</p>}
              <form onSubmit={saveContact} style={{ display: 'grid', gap: 10 }}>
                <label style={label}>Display name<input value={contact.name || session.name} onChange={(e) => setContact((current) => ({ ...current, name: e.target.value }))} style={input} placeholder="Your vendor name" /></label>
                <label style={label}>Phone number<input value={contact.phone} onChange={(e) => setContact((current) => ({ ...current, phone: e.target.value }))} style={input} required placeholder="+95 9 123 456 789" /></label>
                <label style={label}>Email<input type="email" value={contact.email} onChange={(e) => setContact((current) => ({ ...current, email: e.target.value }))} style={input} required placeholder="agent@example.com" /></label>
                <label style={label}>Location<input value={contact.location} onChange={(e) => setContact((current) => ({ ...current, location: e.target.value }))} style={input} required placeholder="Office address or meeting point" /></label>
                <button disabled={savingContact} style={{ ...button, background: '#ff5838', color: '#fff', marginTop: 4 }}>{savingContact ? 'Saving…' : contact.status === 'approved' ? 'Save changes (resubmits for review)' : 'Save for admin review'}</button>
              </form>
            </>}
          </section>
          <section className="dashboard-account" style={{ background: '#fff', border: '1px solid #ffe0d8', borderRadius: 15, padding: 20 }}>
            <h2>Account</h2><strong>{session.name}</strong><p>{session.email}</p>
            <div className="dashboard-account-actions"><button type="button" onClick={logOut}>Log out</button></div>
          </section>
        </aside>
      </main>
    </div>
  )
}