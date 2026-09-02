import { useState } from 'react'
import Header from '../components/Header'

export default function UnifiedMatchingPage() {
  const initialPurpose = window.location.hash.includes('/buy') ? 'Buy' : window.location.hash.startsWith('#land') ? 'Land' : 'Rent'
  const [purpose, setPurpose] = useState(initialPurpose)
  const [township, setTownship] = useState('All Yangon')
  const [budget, setBudget] = useState('Any budget')
  const [beds, setBeds] = useState('Any beds')
  const [propertyType, setPropertyType] = useState('Any type')
  const [aiQuery, setAiQuery] = useState('')
  const [details, setDetails] = useState({ bathrooms: '', floor: '', roomSize: '', people: '', pets: '', payment: '', ward: '', importantPlace: '', commute: '', accessibility: '', area: '', facilities: [], landSize: '', landUnit: 'sq ft', flexibleSize: false, purchaseBudget: '' })

  const updateDetail = (key, value) => setDetails((current) => ({ ...current, [key]: value }))
  const setFacilityPriority = (facility, priority) => setDetails((current) => ({ ...current, facilities: { ...(Array.isArray(current.facilities) ? {} : current.facilities), [facility]: priority } }))

  const applyNaturalSearch = (event) => {
    event.preventDefault()
    const query = aiQuery.toLowerCase()
    const knownTownship = ['Ahlone', 'Bahan', 'Hlaing', 'Kamayut', 'Sanchaung', 'Yankin'].find((name) => query.includes(name.toLowerCase()))
    if (knownTownship) setTownship(knownTownship)
    if (query.includes('land')) setPurpose('Land')
    else if (query.includes('buy')) setPurpose('Buy')
    else if (query.includes('rent')) setPurpose('Rent')
    const bedroomMatch = query.match(/(one|two|three|1|2|3)[ -]?bed/)
    if (bedroomMatch) setBeds(String({ one: 1, two: 2, three: 3 }[bedroomMatch[1]] || bedroomMatch[1]))
  }

  return (
    <div className="search-page">
      <Header />
      <section className="natural-search-section" aria-label="AI natural language search">
        <div><p>DESCRIBE YOUR IDEAL PROPERTY</p><h1>What are you looking for?</h1><span>Use everyday language. HavenMatch AI will turn your needs into personalized recommendations.</span></div>
        <form className="natural-search" onSubmit={applyNaturalSearch}>
          <span className="natural-search-icon" aria-hidden="true">✦</span>
          <textarea rows="2" value={aiQuery} onChange={(event) => setAiQuery(event.target.value)} placeholder="For example: Find me a quiet two-bedroom home in Hlaing, near YBS, with natural light and parking under 500,000 MMK." aria-label="Describe your ideal property" />
          <button className="natural-submit" type="submit">Match my needs</button>
        </form>
        <small>Try including your budget, township, property type, commute, facilities, and lifestyle.</small>
      </section>

      <main className="search-workspace">
        <section className="results-panel">
          <header className="results-heading">
            <div><p>HAVENMATCH AI</p><h1>Tell us what you need</h1><span>Your personalized AI matches will appear after you review and submit your preferences.</span></div>
          </header>
          <div className="results-layout">
            <aside className="preference-panel">
              <div className="preference-title"><p>YOUR MATCHING QUESTIONS</p><h2>Build your preferences</h2><span>These answers are used only when you request your AI match.</span></div>

              <div className="preference-purpose-switch" role="group" aria-label="Choose what you are looking for">
                {[['Rent', 'Rent a home'], ['Buy', 'Buy a home'], ['Land', 'Buy land']].map(([value, label]) => <button className={purpose === value ? 'is-active' : ''} type="button" aria-pressed={purpose === value} onClick={() => setPurpose(value)} key={value}>{label}</button>)}
              </div>

              {purpose === 'Land' ? (
                <>
                  <details open><summary>Land size</summary><div className="preference-fields">
                    <label>Minimum land area<select value={details.landSize} onChange={(event) => updateDetail('landSize', event.target.value)}><option value="">Select a size range</option><option>Under 1,000</option><option>1,000–2,499</option><option>2,500–4,999</option><option>5,000–9,999</option><option>10,000 or more</option></select></label>
                    <label>Measurement unit<select value={details.landUnit} onChange={(event) => updateDetail('landUnit', event.target.value)}><option>sq ft</option><option>sq m</option><option>acre</option></select></label>
                    <label className="preference-checkbox"><input type="checkbox" checked={details.flexibleSize} onChange={(event) => updateDetail('flexibleSize', event.target.checked)} />I’m flexible on land size</label>
                  </div></details>
                  <details><summary>Land budget</summary><div className="preference-fields">
                    <label>How do you plan to pay?<select value={details.payment} onChange={(event) => updateDetail('payment', event.target.value)}><option value="">Not sure yet</option><option>Cash</option><option>Land loan</option><option>Installments</option></select></label>
                    <label>Maximum purchase budget<select value={details.purchaseBudget} onChange={(event) => updateDetail('purchaseBudget', event.target.value)}><option value="">Select a budget range</option><option>Under 50 million MMK</option><option>50–100 million MMK</option><option>100–250 million MMK</option><option>250 million MMK or more</option></select></label>
                  </div></details>
                </>
              ) : (
                <>
                  <details open><summary>Home and space</summary><div className="preference-fields">
                    <label>Property type<select value={propertyType} onChange={(event) => setPropertyType(event.target.value)}><option>Any type</option><option>Apartment</option><option>House</option><option>Shared home</option></select></label>
                    <label>Bedrooms required<select value={beds} onChange={(event) => setBeds(event.target.value)}><option>Any beds</option><option value="1">1+ bedroom</option><option value="2">2+ bedrooms</option><option value="3">3+ bedrooms</option></select></label>
                    <label>Bathrooms required<select value={details.bathrooms} onChange={(event) => updateDetail('bathrooms', event.target.value)}><option value="">Any</option><option>1 bathroom</option><option>2 bathrooms</option><option>3 or more</option></select></label>
                    <label>Preferred floor<select value={details.floor} onChange={(event) => updateDetail('floor', event.target.value)}><option value="">Any floor</option><option>Ground floor</option><option>Lower floor</option><option>Upper floor</option></select></label>
                    <label>Minimum room size<select value={details.roomSize} onChange={(event) => updateDetail('roomSize', event.target.value)}><option value="">Doesn’t matter</option><option>Under 500 sq ft</option><option>500–999 sq ft</option><option>1,000 sq ft or more</option></select></label>
                  </div></details>
                  <details><summary>{purpose === 'Buy' ? 'Buying budget and household' : 'Rental budget and household'}</summary><div className="preference-fields">
                    <label>{purpose === 'Buy' ? 'Maximum purchase budget' : 'Maximum monthly rent'}<select value={budget} onChange={(event) => setBudget(event.target.value)}><option>Any budget</option><option value="300000">Up to 300,000 MMK</option><option value="500000">Up to 500,000 MMK</option><option value="700000">Up to 700,000 MMK</option></select></label>
                    {purpose === 'Buy' && <label>How do you plan to pay?<select value={details.payment} onChange={(event) => updateDetail('payment', event.target.value)}><option value="">Not sure yet</option><option>Cash</option><option>Home loan</option></select></label>}
                    <label>Number of people<input type="number" min="1" max="20" value={details.people} onChange={(event) => updateDetail('people', event.target.value)} placeholder="Enter household size" /></label>
                    <label>Pets<select value={details.pets} onChange={(event) => updateDetail('pets', event.target.value)}><option value="">No preference</option><option>Yes</option><option>No</option></select></label>
                    <label>Accessibility<select value={details.accessibility} onChange={(event) => updateDetail('accessibility', event.target.value)}><option value="">Doesn’t matter</option><option>Step-free access</option><option>Lift required</option></select></label>
                  </div></details>
                </>
              )}

              <details><summary>Location and commute</summary><div className="preference-fields">
                <label>Preferred township<select value={township} onChange={(event) => setTownship(event.target.value)}><option>All Yangon</option>{['Ahlone', 'Bahan', 'Hlaing', 'Kamayut', 'Sanchaung', 'Yankin'].map((name) => <option key={name}>{name}</option>)}</select></label>
                <label>Preferred ward or area<input value={details.ward} onChange={(event) => updateDetail('ward', event.target.value)} placeholder="Enter an area" /></label>
                <label>Important place<input value={details.importantPlace} onChange={(event) => updateDetail('importantPlace', event.target.value)} placeholder="Work, school or university" /></label>
                <label>Commute preference<select value={details.commute} onChange={(event) => updateDetail('commute', event.target.value)}><option value="">No preference</option><option>Near YBS bus stop</option><option>Short commute</option><option>Near main road</option></select></label>
                <label>Area type<select value={details.area} onChange={(event) => updateDetail('area', event.target.value)}><option value="">No preference</option><option>Quiet residential area</option><option>City centre</option><option>Suburban area</option><option>Near shops and markets</option></select></label>
              </div></details>

              {purpose !== 'Land' && <details><summary>Facilities and amenities</summary><div className="facility-priorities">
                <p>Tell the AI what is essential and what is simply preferred.</p>
                {['Reliable electricity', 'Generator / backup power', 'Reliable water', 'Wi-Fi / internet', 'Air conditioning', 'Parking', 'Pets allowed', 'Near shops or markets'].map((facility) => <label key={facility}><span>{facility}</span><select value={(Array.isArray(details.facilities) ? '' : details.facilities[facility]) || ''} onChange={(event) => setFacilityPriority(facility, event.target.value)}><option value="">Doesn’t matter</option><option>Prefer</option><option>Must have</option></select></label>)}
              </div></details>}
              <div className="preference-review-action">
                <a href="#review">Review my answers</a>
              </div>
            </aside>

          </div>
        </section>
      </main>

    </div>
  )
}
