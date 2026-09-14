import { useEffect, useMemo, useState } from 'react'
import { propertyToListing } from '../data/propertyAdapter'
import { availableListingOptions } from '../data/listingInventory'

const matchingBudgetOptions = {
  Rent: [
    ['1500000', 'Up to 1,500,000 MMK'],
    ['2500000', 'Up to 2,500,000 MMK'],
    ['4000000', 'Up to 4,000,000 MMK'],
    ['6000000', 'Up to 6,000,000 MMK'],
    ['9000000', 'Up to 9,000,000 MMK'],
  ],
  Buy: [
    ['250000000', 'Up to 250 million MMK'],
    ['500000000', 'Up to 500 million MMK'],
    ['1000000000', 'Up to 1 billion MMK'],
    ['2500000000', 'Up to 2.5 billion MMK'],
    ['5000000000', 'Up to 5 billion MMK'],
    ['7500000000', 'Up to 7.5 billion MMK'],
  ],
  Land: [
    ['500000000', 'Up to 500 million MMK'],
    ['1500000000', 'Up to 1.5 billion MMK'],
    ['3000000000', 'Up to 3 billion MMK'],
    ['6500000000', 'Up to 6.5 billion MMK'],
    ['10000000000', 'Up to 10 billion MMK'],
    ['18000000000', 'Up to 18 billion MMK'],
  ],
}

export default function UnifiedMatchingPage() {
  const initialPurpose = window.location.hash.includes('/buy') ? 'Buy' : window.location.hash.startsWith('#land') ? 'Land' : 'Rent'
  const [purpose, setPurpose] = useState(initialPurpose)
  const [township, setTownship] = useState('All Yangon')
  const [budget, setBudget] = useState('Any budget')
  const [beds, setBeds] = useState('Any beds')
  const [propertyType, setPropertyType] = useState('Any type')
  const [listings, setListings] = useState([])
  const [details, setDetails] = useState({ bathrooms: '', roomSize: '', people: '', commute: '', facilities: {}, landSize: '', landUnit: 'sq ft', flexibleSize: false, purchaseBudget: '' })

  const updateDetail = (key, value) => setDetails((current) => ({ ...current, [key]: value }))
  const listingOptions = useMemo(() => availableListingOptions(listings, purpose), [listings, purpose])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/properties', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !Array.isArray(result.properties)) throw new Error('Unable to load listing choices.')
        setListings(result.properties.map(propertyToListing))
      })
      .catch((error) => { if (error.name !== 'AbortError') setListings([]) })
    return () => controller.abort()
  }, [])

  const setFacilityPriority = (facility, priority) => setDetails((current) => ({ ...current, facilities: { ...current.facilities, [facility]: priority } }))
  const changePurpose = (nextPurpose) => {
    setPurpose(nextPurpose)
    setBudget('Any budget')
    setTownship('All Yangon')
    setPropertyType('Any type')
    setDetails((current) => ({ ...current, purchaseBudget: '' }))
  }

  const savePreferencesForMatching = () => {
    localStorage.setItem('havenmatch-unified-preferences', JSON.stringify({ purpose, township, budget, beds, propertyType, details }))
  }

  return (
    <div className="ai-match-overlay">
      <section className="ai-match-card" role="dialog" aria-modal="true" aria-labelledby="ai-match-title">
        <header className="ai-match-card-header">
          <strong id="ai-match-title">HavenMatch AI</strong>
          <a href="#top" aria-label="Close AI matching">×</a>
        </header>
        <div className="ai-match-card-scroll">
        <section className="results-panel">
          <div className="results-layout">
            <aside className="preference-panel">
              <div className="preference-title"><p>YOUR MATCHING QUESTIONS</p><h2>Build your preferences</h2><span>These answers are used only when you request your AI match.</span></div>

              <div className="preference-purpose-switch" role="group" aria-label="Choose what you are looking for">
                {[['Rent', 'Rent a home'], ['Buy', 'Buy a home'], ['Land', 'Buy land']].map(([value, label]) => <button className={purpose === value ? 'is-active' : ''} type="button" aria-pressed={purpose === value} onClick={() => changePurpose(value)} key={value}>{label}</button>)}
              </div>

              {purpose === 'Land' ? (
                <>
                  <details open><summary>Land size</summary><div className="preference-fields">
                    <label>Minimum land area<select value={details.landSize} onChange={(event) => updateDetail('landSize', event.target.value)}><option value="">Select a size range</option><option>Under 1,000</option><option>1,000–2,499</option><option>2,500–4,999</option><option>5,000–9,999</option><option>10,000 or more</option></select></label>
                    <label>Measurement unit<select value={details.landUnit} onChange={(event) => updateDetail('landUnit', event.target.value)}><option>sq ft</option><option>sq m</option><option>acre</option></select></label>
                    <label className="preference-checkbox"><input type="checkbox" checked={details.flexibleSize} onChange={(event) => updateDetail('flexibleSize', event.target.checked)} />I’m flexible on land size</label>
                  </div></details>
                  <details><summary>Land budget</summary><div className="preference-fields">
                    <label>Maximum purchase budget<select value={details.purchaseBudget} onChange={(event) => updateDetail('purchaseBudget', event.target.value)}><option value="">Any budget</option>{matchingBudgetOptions.Land.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                  </div></details>
                </>
              ) : (
                <>
                  <details open><summary>Home and space</summary><div className="preference-fields">
                    <label>Property type<select value={propertyType} onChange={(event) => setPropertyType(event.target.value)}><option>Any type</option>{listingOptions.propertyTypes.map((name) => <option key={name}>{name}</option>)}</select></label>
                    <label>Bedrooms required<select value={beds} onChange={(event) => setBeds(event.target.value)}><option>Any beds</option><option value="1">1+ bedroom</option><option value="2">2+ bedrooms</option><option value="3">3+ bedrooms</option></select></label>
                    <label>Bathrooms required<select value={details.bathrooms} onChange={(event) => updateDetail('bathrooms', event.target.value)}><option value="">Any</option><option>1 bathroom</option><option>2 bathrooms</option><option>3 or more</option></select></label>
                    <label>Minimum room size<select value={details.roomSize} onChange={(event) => updateDetail('roomSize', event.target.value)}><option value="">Doesn’t matter</option><option>Under 500 sq ft</option><option>500–999 sq ft</option><option>1,000 sq ft or more</option></select></label>
                  </div></details>
                  <details><summary>{purpose === 'Buy' ? 'Buying budget' : 'Rental budget'}</summary><div className="preference-fields">
                    <label>{purpose === 'Buy' ? 'Maximum purchase budget' : 'Maximum monthly rent'}<select value={budget} onChange={(event) => setBudget(event.target.value)}><option>Any budget</option>{matchingBudgetOptions[purpose].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                    <label>Number of people<input type="number" min="1" max="20" value={details.people} onChange={(event) => updateDetail('people', event.target.value)} placeholder="Enter household size" /></label>
                  </div></details>
                </>
              )}

              <details><summary>Location</summary><div className="preference-fields">
                <label>Preferred township<select value={township} onChange={(event) => setTownship(event.target.value)}><option>All Yangon</option>{listingOptions.townships.map((name) => <option key={name}>{name}</option>)}</select></label>
                <label>Commute preference<select value={details.commute} onChange={(event) => updateDetail('commute', event.target.value)}><option value="">No preference</option><option>Near YBS bus stop</option><option>Near main road</option></select></label>
              </div></details>

              {purpose !== 'Land' && <details><summary>Facilities and amenities</summary><div className="facility-priorities">
                <p>Choose what you prefer. Unconfirmed listing details will be marked for verification.</p>
                {['Reliable electricity', 'Generator / backup power', 'Reliable water', 'Wi-Fi / internet', 'Air conditioning', 'Parking', 'Pets allowed', 'Near shops or markets'].map((facility) => <label key={facility}><span>{facility}</span><select value={details.facilities[facility] || ''} onChange={(event) => setFacilityPriority(facility, event.target.value)}><option value="">Doesn’t matter</option><option>Prefer</option><option>Must have</option></select></label>)}
              </div></details>}
              <div className="preference-review-action">
                <a href="#review" onClick={savePreferencesForMatching}>Review my answers</a>
              </div>
            </aside>

          </div>
        </section>
        </div>
      </section>
    </div>
  )
}
