import { useState } from 'react'
import useSession from '../hooks/useSession'

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
  if (saved.purpose === 'Land') {
    const purchaseBudget = Number(details.purchaseBudget)
    return purchaseBudget > 0 ? purchaseBudget : LAND_BUDGET_MAX[details.purchaseBudget] ?? null
  }
  if (!saved.budget || saved.budget === 'Any budget') return null
  return Number(saved.budget)
}

function readSavedPreferences() {
  try { return JSON.parse(localStorage.getItem('havenmatch-unified-preferences') || '{}') } catch { return {} }
}

function formatMoney(value, purpose) {
  if (!value) return 'Any budget'
  return `${new Intl.NumberFormat('en-US').format(value)} MMK${purpose === 'Rent' ? ' / month' : ''}`
}

const sectionStyle = {
  minWidth: 0,
}

function priorityLabel(value) {
  return String(value).toLowerCase() === 'must have' ? 'Must have' : 'Prefer'
}

const sectionTitleStyle = {
  margin: '0 0 18px',
  color: '#0f766e',
  fontSize: '14px',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const detailListStyle = {
  display: 'grid',
  gap: '14px',
  margin: 0,
}

function SummaryField({ label, value }) {
  return (
    <div>
      <dt style={{ marginBottom: '4px', color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>{label}</dt>
      <dd style={{ margin: 0, color: '#1f2937', fontSize: '19px', fontWeight: '600', lineHeight: '1.45' }}>{value}</dd>
    </div>
  )
}

export default function ReviewPage() {
  const { session } = useSession()
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
  const facilityEntries = Object.entries(reviewDetails.facilities || {}).filter(([, value]) => value)
  const handleConfirm = async () => {
    setError('')
    setSubmitting(true)
    try {
      const saved = savedPreferences
      const details = saved.details || {}
      const facilities = Object.fromEntries(Object.entries(details.facilities || {}).map(([key, value]) => {
        const aliases = {
          'Reliable electricity': 'reliable_electricity', 'Generator / backup power': 'generator',
          'Reliable water': 'reliable_water', 'Wi-Fi / internet': 'internet_ready',
          'Air conditioning': 'air_conditioning', Parking: 'parking',
          'Pets allowed': 'pets_allowed', 'Near shops or markets': 'near_shops',
        }
        return [aliases[key] || key, String(value).toLowerCase().replace(/\s+/g, '_')]
      }))
      if (details.commute === 'Near YBS bus stop') facilities.near_bus_stop = 'prefer'
      if (details.commute === 'Near main road') facilities.main_road_access = 'prefer'
      const landArea = details.flexibleSize ? null : details.landSizeSqft || convertToSquareFeet(LAND_SIZE_MIN[details.landSize], details.landUnit)
      const request = {
        intent: saved.purpose || 'Rent',
        maximumBudget: maximumBudget(saved, details),
        township: saved.township && saved.township !== 'All Yangon' ? saved.township : null,
        propertyType: saved.purpose === 'Land' ? 'vacant_land' : saved.propertyType && saved.propertyType !== 'Any type' ? saved.propertyType : null,
        bedrooms: saved.beds && saved.beds !== 'Any beds' ? Number(saved.beds) : null,
        bathrooms: details.bathrooms ? Number.parseInt(details.bathrooms, 10) : null,
        minimumAreaSqft: saved.purpose === 'Land' ? landArea : ROOM_SIZE_MIN[details.roomSize] ?? null,
        people: details.people ? Number(details.people) : null,
        pets: null,
        facilities,
      }
      const response = await fetch('/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Matching failed.')
      const resultKey = `havenmatch-match-results-${session.email}`
      localStorage.setItem(resultKey, JSON.stringify(result))
      const historyKey = `havenmatch-match-history-${session.email}`
      const history = (() => {
        try {
          const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
          return Array.isArray(savedHistory) ? savedHistory : []
        } catch { return [] }
      })()
      history.unshift({ id: Date.now(), completedAt: new Date().toISOString(), matchCount: result.matches.length, matchMode: result.matchMode || 'exact', result })
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 50)))
      window.location.hash = '#result'
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to the matching service.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 16px', fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 8px', color: '#111827', fontSize: '26px', fontWeight: '700' }}>Review your preferences</h2>
      <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '15px' }}>Confirm these details before finding your matches.</p>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: 'clamp(24px, 4vw, 40px)', boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', columnGap: '64px', rowGap: '40px' }}>
          {reviewPurpose === 'Land' ? (
            <>
              <section style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Land size</h3>
                <dl style={detailListStyle}>
                  <SummaryField label="Minimum land area" value={reviewSize} />
                  <SummaryField label="Measurement unit" value={reviewDetails.landUnit || 'sq ft'} />
                  <SummaryField label="Flexible on land size" value={reviewDetails.flexibleSize ? 'Yes' : 'No'} />
                </dl>
              </section>

              <section style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Land budget</h3>
                <dl style={detailListStyle}>
                  <SummaryField label="Maximum purchase budget" value={formatMoney(reviewBudget, reviewPurpose)} />
                </dl>
              </section>
            </>
          ) : (
            <>
              <section style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Home and space</h3>
                <dl style={detailListStyle}>
                  <SummaryField label="Looking for" value={reviewPurpose === 'Buy' ? 'Buy a home' : 'Rent a home'} />
                  <SummaryField label="Property type" value={reviewPropertyType} />
                  <SummaryField label="Bedrooms required" value={savedPreferences.beds && savedPreferences.beds !== 'Any beds' ? `${savedPreferences.beds}+` : 'Any'} />
                  <SummaryField label="Bathrooms required" value={reviewDetails.bathrooms || 'Any'} />
                  <SummaryField label="Minimum room size" value={reviewSize} />
                </dl>
              </section>

              <section style={sectionStyle}>
                <h3 style={sectionTitleStyle}>{reviewPurpose === 'Buy' ? 'Buying budget' : 'Rental budget'}</h3>
                <dl style={detailListStyle}>
                  <SummaryField label={reviewPurpose === 'Buy' ? 'Maximum purchase budget' : 'Maximum monthly rent'} value={formatMoney(reviewBudget, reviewPurpose)} />
                  <SummaryField label="Number of people" value={reviewDetails.people || 'Not specified'} />
                </dl>
              </section>
            </>
          )}

          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Location</h3>
            <dl style={detailListStyle}>
              <SummaryField label="Preferred township" value={reviewTownship} />
              <SummaryField label="Commute preference" value={reviewDetails.commute || 'No preference'} />
            </dl>
          </section>

          {reviewPurpose !== 'Land' && <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Facilities and amenities</h3>
            <dl style={detailListStyle}>
              <SummaryField label="Selected priorities" value={facilityEntries.length ? facilityEntries.map(([name, value]) => `${name}: ${priorityLabel(value)}`).join(', ') : 'None selected'} />
            </dl>
          </section>}
        </div>

        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
          {error && <p style={{ color: '#b42318', marginBottom: '12px' }}>{error}</p>}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              backgroundColor: '#0f766e',
              color: '#ffffff',
              padding: '13px 28px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {submitting ? 'Matching…' : 'Start matching'}
          </button>
        </div>
      </div>
    </div>
  );
}
