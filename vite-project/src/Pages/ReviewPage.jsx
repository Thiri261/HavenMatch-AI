import { useState } from 'react'

const LAND_BUDGET_MAX = {
  'Under 50 million MMK': 50_000_000,
  '50–100 million MMK': 100_000_000,
  '100–250 million MMK': 250_000_000,
  '250 million MMK or more': null,
}

const LAND_SIZE_MIN = {
  'Under 1,000': 1,
  '1,000–2,499': 1_000,
  '2,500–4,999': 2_500,
  '5,000–9,999': 5_000,
  '10,000 or more': 10_000,
}

const ROOM_SIZE_MIN = {
  '500–999 sq ft': 500,
  '1,000 sq ft or more': 1_000,
}

function convertToSquareFeet(value, unit) {
  if (!value) return null
  if (unit === 'sq m') return Math.round(value * 10.7639)
  if (unit === 'acre') return Math.round(value * 43_560)
  return value
}

function maximumBudget(saved, details) {
  if (Number.isFinite(details.maximumBudget) && details.maximumBudget > 0) return details.maximumBudget
  if (saved.purpose === 'Land') return LAND_BUDGET_MAX[details.purchaseBudget] ?? null
  if (!saved.budget || saved.budget === 'Any budget') return null
  const selected = Number(saved.budget)
  // The fixed frontend reuses rent-sized option values for Buy. Interpret those
  // legacy values on the purchase-price scale without changing the page design.
  return saved.purpose === 'Buy' ? selected * 1_000 : selected
}

function readSavedPreferences() {
  try { return JSON.parse(localStorage.getItem('havenmatch-unified-preferences') || '{}') } catch { return {} }
}

function formatMoney(value, purpose) {
  if (!value) return 'Any budget'
  return `${new Intl.NumberFormat('en-US').format(value)} MMK${purpose === 'Rent' ? ' / month' : ''}`
}

function priorityLabel(value) {
  if (String(value).toLowerCase() === 'must have') return 'Must have'
  return String(value || 'Prefer')
}

export default function ReviewPage() {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savedPreferences] = useState(readSavedPreferences)
  const reviewDetails = savedPreferences.details || {}
  const reviewPurpose = savedPreferences.purpose || 'Rent'
  const reviewBudget = maximumBudget(savedPreferences, reviewDetails)
  const reviewPropertyType = reviewPurpose === 'Land'
    ? 'Vacant land'
    : savedPreferences.propertyType && savedPreferences.propertyType !== 'Any type' ? savedPreferences.propertyType : 'Any property type'
  const reviewSize = reviewPurpose === 'Land'
    ? reviewDetails.flexibleSize ? 'Flexible' : reviewDetails.landSize ? `${reviewDetails.landSize} ${reviewDetails.landUnit || 'sq ft'}` : 'No minimum'
    : reviewDetails.roomSize || 'No minimum'
  const reviewTownship = savedPreferences.township && savedPreferences.township !== 'All Yangon' ? savedPreferences.township : 'All Yangon'
  const facilityEntries = reviewDetails.facilities && !Array.isArray(reviewDetails.facilities)
    ? Object.entries(reviewDetails.facilities).filter(([, value]) => value)
    : []
  if (reviewDetails.pets && !facilityEntries.some(([name]) => name === 'Pets allowed')) {
    facilityEntries.push(['Pets', reviewDetails.pets === 'Yes' ? 'Must have' : reviewDetails.pets])
  }

  const handleConfirm = async () => {
    setError('')
    setSubmitting(true)
    try {
      const saved = savedPreferences
      const details = saved.details || {}
      const facilities = Object.fromEntries(Object.entries(details.facilities || {}).map(([key, value]) => {
        const aliases = {
          'Reliable electricity': 'reliable_electricity',
          'Generator / backup power': 'generator', 'Reliable water': 'reliable_water',
          'Wi-Fi / internet': 'internet_ready', 'Air conditioning': 'air_conditioning',
          Parking: 'parking', 'Pets allowed': 'pets_allowed', 'Near shops or markets': 'near_shops',
        }
        return [aliases[key] || key, String(value).toLowerCase().replace(/\s+/g, '_')]
      }))
      if (details.commute === 'Near YBS bus stop' && !facilities.near_bus_stop) facilities.near_bus_stop = 'prefer'
      if (details.commute === 'Near main road' && !facilities.main_road_access) facilities.main_road_access = 'prefer'
      if (details.area === 'Near shops and markets' && !facilities.near_shops) facilities.near_shops = 'prefer'

      const landArea = details.flexibleSize ? null : details.landSizeSqft || convertToSquareFeet(LAND_SIZE_MIN[details.landSize], details.landUnit)
      const request = {
        intent: saved.purpose || 'Rent',
        maximumBudget: maximumBudget(saved, details),
        township: saved.township && saved.township !== 'All Yangon' ? saved.township : null,
        propertyType: saved.purpose === 'Land' ? 'vacant_land' : saved.propertyType && saved.propertyType !== 'Any type' ? saved.propertyType : null,
        bedrooms: saved.beds && saved.beds !== 'Any beds' ? Number(saved.beds) : null,
        bathrooms: details.bathrooms ? Number.parseInt(details.bathrooms, 10) : null,
        minimumAreaSqft: saved.purpose === 'Land' ? landArea : ROOM_SIZE_MIN[details.roomSize] ?? null,
        pets: details.pets || null,
        facilities,
      }
      const response = await fetch('/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Matching failed.')
      localStorage.setItem('havenmatch-match-results', JSON.stringify(result))
      window.location.hash = '#result'
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to the matching service.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px', fontFamily: 'sans-serif' }}>
      
      {/* Step Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', borderRadius: '12px', border: '2px solid #0f766e', backgroundColor: '#f0fdf4' }}>
          <strong style={{ display: 'block', color: '#0f766e' }}>1. Comprehensive Review</strong>
          <span style={{ fontSize: '13px', color: '#166534' }}>Verify your preferences</span>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <strong style={{ display: 'block', color: '#4b5563' }}>2. AI Matching Engine</strong>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Algorithmic scoring</span>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <strong style={{ display: 'block', color: '#4b5563' }}>3. Curated Match Results</strong>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Best options preview</span>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Full Preferences & Property Review</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Please double-check your inputs before initiating the AI matching engine.</p>

      {/* Main Container */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Top Grid: Main Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>🏠 Property Profile</h4>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Purpose:</strong> {reviewPurpose}</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Property Type:</strong> {reviewPropertyType}</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>{reviewPurpose === 'Land' ? 'Land Size' : 'Minimum Size'}:</strong> {reviewSize}</p>
            {reviewPurpose !== 'Land' && <p style={{ margin: '4px 0', color: '#374151' }}><strong>Bedrooms:</strong> {savedPreferences.beds && savedPreferences.beds !== 'Any beds' ? `${savedPreferences.beds}+` : 'Any'} · <strong>Bathrooms:</strong> {reviewDetails.bathrooms || 'Any'}</p>}
          </div>

          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>💰 Budget</h4>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Transaction:</strong> {reviewPurpose === 'Land' ? 'Buy land' : reviewPurpose === 'Buy' ? 'Buy a home' : 'Rent a home'}</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Max Budget:</strong> {reviewPurpose === 'Land' && !reviewBudget && reviewDetails.purchaseBudget ? reviewDetails.purchaseBudget : formatMoney(reviewBudget, reviewPurpose)}</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Payment:</strong> {reviewDetails.payment || 'Not specified'}</p>
          </div>

          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>📍 Preferred Location</h4>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Region:</strong> Yangon Region</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Township:</strong> {reviewTownship}</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Commute:</strong> {reviewDetails.commute || 'No preference'}</p>
          </div>
        </div>

        {/* Bottom Grid: Detailed Facilities & Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', paddingTop: '24px' }}>
          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>⚙️ Facilities & Amenities</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#374151', fontSize: '14px', lineHeight: '1.8' }}>
              {facilityEntries.length ? facilityEntries.map(([name, value]) => (
                <li key={name}>✔️ <strong>{name}:</strong> {priorityLabel(value)}</li>
              )) : <li>No specific facilities selected.</li>}
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>🧭 Environment & Area Type</h4>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
              <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>
                <strong>Preferred Environment:</strong> {reviewDetails.area || 'No preference'}
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                <strong>Ward or area:</strong> {reviewDetails.ward || 'Not specified'}{reviewDetails.importantPlace ? ` · Important place: ${reviewDetails.importantPlace}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '32px', textAlign: 'right' }}>
          {error && <p style={{ color: '#b42318', marginBottom: '12px' }}>{error}</p>}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              backgroundColor: '#0f766e',
              color: '#ffffff',
              padding: '12px 28px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {submitting ? 'Matching…' : 'Confirm & Start Matching ►'}
          </button>
        </div>

      </div>
    </div>
  );
}
