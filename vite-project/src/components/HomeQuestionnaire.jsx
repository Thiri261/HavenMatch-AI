import { useEffect, useState } from 'react'

const housingSteps = ['Housing type & space', 'Budget & household', 'Location & commute', 'Facilities & lifestyle']
const homeTypes = [['apartment', 'Apartment'], ['condo', 'Condo'], ['house', 'House'], ['shared', 'Shared apartment']]
const floorOptions = [['ground', 'Ground floor'], ['middle', 'Middle floor'], ['high', 'High floor'], ['any', 'Doesn’t matter']]
const homeBudgetRanges = [
  ['under-100m', 'Under 100 million MMK'],
  ['100m-249m', '100–249 million MMK'],
  ['250m-499m', '250–499 million MMK'],
  ['500m-999m', '500–999 million MMK'],
  ['1b-plus', '1 billion MMK or more'],
]

function BrandIcon() {
  return (
    <svg className="land-brand-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 29 32 8l24 21" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 27v27h36V27" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
      <path d="M32 21c-7 0-12 5-12 12 0 10 12 20 12 20s12-10 12-20c0-7-5-12-12-12Z" fill="#ff5838" stroke="#fffdf9" strokeWidth="3" />
      <circle cx="32" cy="33" r="4" fill="#fffdf9" />
    </svg>
  )
}

function HomeTypeIcon({ type }) {
  if (type === 'house') return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="m8 31 24-22 24 22M14 27v29h14V39h13v17h9V27M42 18V9h7v15" /></svg>
  if (type === 'shared') return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="22" cy="19" r="8" /><circle cx="45" cy="19" r="8" /><path d="M10 53V39c0-8 5-12 12-12s12 4 12 12v14H10Zm24 0V39c0-8 4-12 11-12s11 4 11 12v14H34Z" /></svg>
  if (type === 'condo') return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 56V8h25v48M41 24h10v32M10 56h47M23 16h5M34 16h2M23 25h5M34 25h2M23 34h5M34 34h2M23 43h5M34 43h2M47 31h2M47 39h2M47 47h2" /></svg>
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M15 56V9h28v47M43 30h8v26M9 56h49M22 17h5M34 17h3M22 26h5M34 26h3M22 35h5M34 35h3M22 44h5M34 44h3M47 37h2M47 45h2" /></svg>
}

function HomeBudgetSelect({ label, value, onChange }) {
  return (
    <label className="home-budget-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select a budget range</option>
        {homeBudgetRanges.map(([rangeValue, rangeLabel]) => <option value={rangeValue} key={rangeValue}>{rangeLabel}</option>)}
      </select>
    </label>
  )
}

function HomeChoiceButtons({ label, options, value, onChange }) {
  return (
    <fieldset className="home-location-choices">
      <legend>{label}</legend>
      <div>
        {options.map(([optionValue, optionLabel]) => (
          <button className={value === optionValue ? 'is-selected' : ''} type="button" aria-pressed={value === optionValue} onClick={() => onChange(optionValue)} key={optionValue}>{optionLabel}</button>
        ))}
      </div>
    </fieldset>
  )
}

function HousingLocationStep({ area, commuteTime, importantPlace, purpose, setArea, setCommuteTime, setImportantPlace, setSide, setTownship, setWalkingTime, side, township, walkingTime }) {
  const sides = [['north', 'North'], ['south', 'South'], ['east', 'East'], ['west', 'West'], ['central', 'Central'], ['any', 'Doesn’t matter']]
  const timeOptions = [['10', 'Up to 10 minutes'], ['20', 'Up to 20 minutes'], ['30', 'Up to 30 minutes'], ['any', 'Doesn’t matter']]

  return (
    <>
      <div className="rental-intro location-step-intro">
        <p>{purpose === 'rent' ? 'RENT A HOME' : 'BUY A HOME'} — STEP 3 OF 4</p>
        <h1>Where should your home be?</h1>
        <span>Tell us which Yangon areas and travel limits work for you.</span>
      </div>

      <section className="rental-card housing-location-card">
        <h2>Location preferences</h2>
        <div className="housing-location-fields">
          <label><span>Preferred township</span><select value={township} onChange={(event) => setTownship(event.target.value)}><option value="">Search or select a township</option><option value="ahlone">Ahlone</option><option value="bahan">Bahan</option><option value="hlaing">Hlaing</option><option value="kamayut">Kamayut</option><option value="mayangone">Mayangone</option><option value="north-dagon">North Dagon</option><option value="south-okkalapa">South Okkalapa</option><option value="thanlyin">Thanlyin</option></select><small>You can choose the closest match.</small></label>
          <label><span>Preferred ward or area (optional)</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Search or enter an area" /></label>
        </div>
        <HomeChoiceButtons label="Preferred side of Yangon" options={sides} value={side} onChange={setSide} />
      </section>

      <section className="rental-card housing-location-card housing-commute-card">
        <h2>Commute preferences</h2>
        <label className="housing-important-place"><span>Important place</span><input value={importantPlace} onChange={(event) => setImportantPlace(event.target.value)} placeholder="Workplace, school, university, or another place" /></label>
        <HomeChoiceButtons label="Maximum commute time" options={timeOptions} value={commuteTime} onChange={setCommuteTime} />
        <HomeChoiceButtons label="Walking time to YBS bus stop" options={timeOptions} value={walkingTime} onChange={setWalkingTime} />
      </section>

      <div className="rental-info location-travel-info">ⓘ&nbsp;&nbsp; Commute estimates will be compared with available Yangon transport information.</div>
    </>
  )
}

const facilityOptions = [
  ['electricity', 'Reliable electricity'],
  ['backup-power', 'Generator / backup power'],
  ['water', 'Reliable water'],
  ['internet', 'Wi-Fi / internet'],
  ['air-conditioning', 'Air conditioning'],
  ['parking', 'Parking'],
  ['pets-allowed', 'Pets allowed'],
  ['shops', 'Near shops or markets'],
]

function HousingFacilitiesStep({ areaPreference, facilities, purpose, setAreaPreference, setFacilities }) {
  const setFacility = (facility, value) => setFacilities((current) => ({ ...current, [facility]: value }))
  const preferenceOptions = [['must', 'Must have'], ['prefer', 'Prefer'], ['any', 'Doesn’t matter']]
  const areaOptions = [['quiet', 'Quiet residential area'], ['centre', 'City centre'], ['suburban', 'Suburban area'], ['shops', 'Near shops and markets'], ['any', 'No preference']]

  return (
    <>
      <div className="rental-intro facilities-step-intro">
        <p>{purpose === 'rent' ? 'RENT A HOME' : 'BUY A HOME'} — STEP 4 OF 4</p>
        <h1>What would make a {purpose === 'rent' ? 'rental ' : ''}home work for you?</h1>
        <span>Mark each feature as Must have, Prefer, or Doesn’t matter.</span>
      </div>

      <section className="rental-card facilities-card" aria-label="Facility preferences">
        {facilityOptions.map(([value, label]) => (
          <div className="facility-row" key={value}>
            <strong>{label}</strong>
            <div role="radiogroup" aria-label={label}>
              {preferenceOptions.map(([optionValue, optionLabel]) => (
                <button className={facilities[value] === optionValue ? 'is-selected' : ''} type="button" role="radio" aria-checked={facilities[value] === optionValue} onClick={() => setFacility(value, optionValue)} key={optionValue}><i />{optionLabel}</button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rental-card area-preference-card">
        <h2>What kind of area would you prefer?</h2>
        <div role="radiogroup" aria-label="Preferred kind of area">
          {areaOptions.map(([value, label]) => <button className={areaPreference === value ? 'is-selected' : ''} type="button" role="radio" aria-checked={areaPreference === value} onClick={() => setAreaPreference(value)} key={value}><i />{label}</button>)}
        </div>
      </section>

      <div className="rental-info facilities-info">ⓘ&nbsp;&nbsp; Your matches will explain which preferences are met and where compromises may be needed.</div>
    </>
  )
}

function HousingBudgetStep({
  accessibility,
  downPayment,
  monthlyPayment,
  payment,
  people,
  pets,
  purchaseBudget,
  setAccessibility,
  setDownPayment,
  setMonthlyPayment,
  setPayment,
  setPeople,
  setPets,
  setPurchaseBudget,
}) {
  const loanSelected = payment === 'loan'

  return (
    <>
      <div className="rental-intro budget-step-intro">
        <p>BUY A HOME — STEP 2 OF 4</p>
        <h1>What home-buying budget works for you?</h1>
        <span>Choose comfortable ranges. No exact amount is required.</span>
      </div>

      <section className="rental-card home-payment-card">
        <h2>How do you plan to pay?</h2>
        <div className="home-payment-options" role="radiogroup" aria-label="How do you plan to pay?">
          {[['cash', 'Cash'], ['loan', 'Home loan'], ['unsure', 'Not sure yet']].map(([value, label]) => (
            <button className={payment === value ? 'is-selected' : ''} type="button" role="radio" aria-checked={payment === value} onClick={() => setPayment(value)} key={value}><i />{label}</button>
          ))}
        </div>
      </section>

      <section className="rental-card home-budget-card">
        <h2>Budget</h2>
        <div className={`home-budget-grid ${loanSelected ? 'show-loan' : ''}`}>
          <HomeBudgetSelect label="MMK: Maximum purchase price" value={purchaseBudget} onChange={setPurchaseBudget} />
          {loanSelected && <HomeBudgetSelect label="Available down payment" value={downPayment} onChange={setDownPayment} />}
          {loanSelected && <HomeBudgetSelect label="Maximum monthly loan repayment" value={monthlyPayment} onChange={setMonthlyPayment} />}
        </div>
        <div className="home-budget-info">ⓘ&nbsp;&nbsp; We’ll only show loan questions when they apply to you.</div>
      </section>

      <section className="rental-card requirements-card">
        <h2>Household requirements</h2>
        <div className="budget-household-grid">
          <label className="people-field"><span>Number of people</span><input type="number" min="1" max="20" value={people} onChange={(event) => setPeople(event.target.value)} placeholder="Enter number of people" /></label>
          <fieldset className="pets-field"><legend>Pets</legend><div role="radiogroup" aria-label="Will pets live in the home?"><button className={pets === 'yes' ? 'is-selected' : ''} type="button" role="radio" aria-checked={pets === 'yes'} onClick={() => setPets('yes')}>Yes</button><button className={pets === 'no' ? 'is-selected' : ''} type="button" role="radio" aria-checked={pets === 'no'} onClick={() => setPets('no')}>No</button></div></fieldset>
        </div>
        <fieldset className="accessibility-field">
          <legend>Accessibility needs (optional)</legend>
          <div role="radiogroup" aria-label="Accessibility needs">
            {[['step-free', 'Step-free access'], ['lift', 'Lift required'], ['any', 'Doesn’t matter']].map(([value, label]) => <button className={accessibility === value ? 'is-selected' : ''} type="button" role="radio" aria-checked={accessibility === value} onClick={() => setAccessibility(value)} key={value}><i />{label}</button>)}
          </div>
        </fieldset>
      </section>
    </>
  )
}

function HomeQuestionnaire() {
  const getCurrentStep = () => {
    if (window.location.hash.includes('/facilities')) return 4
    if (window.location.hash.includes('/location')) return 3
    if (window.location.hash.includes('/budget')) return 2
    return 1
  }
  const [currentStep, setCurrentStep] = useState(getCurrentStep)
  const purpose = window.location.hash.includes('/buy') ? 'buy' : 'rent'
  const storagePrefix = `havenmatch-${purpose}`
  const actionWord = purpose === 'rent' ? 'rental' : 'purchase'
  const [homeType, setHomeType] = useState(() => localStorage.getItem(`${storagePrefix}-home-type`) || '')
  const [floor, setFloor] = useState(() => localStorage.getItem(`${storagePrefix}-floor`) || '')
  const [bedrooms, setBedrooms] = useState(() => localStorage.getItem(`${storagePrefix}-bedrooms`) || '')
  const [bathrooms, setBathrooms] = useState(() => localStorage.getItem(`${storagePrefix}-bathrooms`) || '')
  const [roomSize, setRoomSize] = useState(() => localStorage.getItem(`${storagePrefix}-room-size`) || '')
  const [people, setPeople] = useState(() => localStorage.getItem(`${storagePrefix}-people`) || '')
  const [pets, setPets] = useState(() => localStorage.getItem(`${storagePrefix}-pets`) || '')
  const [payment, setPayment] = useState(() => localStorage.getItem(`${storagePrefix}-payment`) || '')
  const [purchaseBudget, setPurchaseBudget] = useState(() => localStorage.getItem(`${storagePrefix}-purchase-budget`) || '')
  const [downPayment, setDownPayment] = useState(() => localStorage.getItem(`${storagePrefix}-down-payment`) || '')
  const [monthlyPayment, setMonthlyPayment] = useState(() => localStorage.getItem(`${storagePrefix}-monthly-payment`) || '')
  const [accessibility, setAccessibility] = useState(() => localStorage.getItem(`${storagePrefix}-accessibility`) || '')
  const [township, setTownship] = useState(() => localStorage.getItem(`${storagePrefix}-township`) || '')
  const [area, setArea] = useState(() => localStorage.getItem(`${storagePrefix}-area`) || '')
  const [side, setSide] = useState(() => localStorage.getItem(`${storagePrefix}-side`) || '')
  const [importantPlace, setImportantPlace] = useState(() => localStorage.getItem(`${storagePrefix}-important-place`) || '')
  const [commuteTime, setCommuteTime] = useState(() => localStorage.getItem(`${storagePrefix}-commute-time`) || '')
  const [walkingTime, setWalkingTime] = useState(() => localStorage.getItem(`${storagePrefix}-walking-time`) || '')
  const [facilities, setFacilities] = useState(() => {
    const saved = localStorage.getItem(`${storagePrefix}-facilities`)
    return saved ? JSON.parse(saved) : {}
  })
  const [areaPreference, setAreaPreference] = useState(() => localStorage.getItem(`${storagePrefix}-area-preference`) || '')

  useEffect(() => {
    const updateStep = () => setCurrentStep(getCurrentStep())
    window.addEventListener('hashchange', updateStep)
    return () => window.removeEventListener('hashchange', updateStep)
  }, [])

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}-home-type`, homeType)
    localStorage.setItem(`${storagePrefix}-floor`, floor)
    localStorage.setItem(`${storagePrefix}-bedrooms`, bedrooms)
    localStorage.setItem(`${storagePrefix}-bathrooms`, bathrooms)
    localStorage.setItem(`${storagePrefix}-room-size`, roomSize)
    localStorage.setItem(`${storagePrefix}-people`, people)
    localStorage.setItem(`${storagePrefix}-pets`, pets)
    localStorage.setItem(`${storagePrefix}-payment`, payment)
    localStorage.setItem(`${storagePrefix}-purchase-budget`, purchaseBudget)
    localStorage.setItem(`${storagePrefix}-down-payment`, downPayment)
    localStorage.setItem(`${storagePrefix}-monthly-payment`, monthlyPayment)
    localStorage.setItem(`${storagePrefix}-accessibility`, accessibility)
    localStorage.setItem(`${storagePrefix}-township`, township)
    localStorage.setItem(`${storagePrefix}-area`, area)
    localStorage.setItem(`${storagePrefix}-side`, side)
    localStorage.setItem(`${storagePrefix}-important-place`, importantPlace)
    localStorage.setItem(`${storagePrefix}-commute-time`, commuteTime)
    localStorage.setItem(`${storagePrefix}-walking-time`, walkingTime)
    localStorage.setItem(`${storagePrefix}-facilities`, JSON.stringify(facilities))
    localStorage.setItem(`${storagePrefix}-area-preference`, areaPreference)
  }, [storagePrefix, homeType, floor, bedrooms, bathrooms, roomSize, people, pets, payment, purchaseBudget, downPayment, monthlyPayment, accessibility, township, area, side, importantPlace, commuteTime, walkingTime, facilities, areaPreference])
  const chooseHomeType = (value) => {
    setHomeType(value)
    if (value === 'house') setFloor('')
  }

  return (
    <div className="rental-page">
      <header className="land-header rental-header">
        <a className="land-brand" href="#top" aria-label="Back to HavenMatch AI home"><BrandIcon /><span>HavenMatch AI</span></a>
        <div className="land-header-actions"><span>Your answers stay private</span><a href="#top">Exit</a></div>
      </header>

      <div className={`rental-progress step-${currentStep}`} aria-label={`Step ${currentStep} of 4`}><span /><strong>{currentStep === 1 ? '25%' : currentStep === 2 ? '50%' : currentStep === 3 ? '75%' : '100%'}</strong><i /></div>

      <div className="rental-layout">
        <aside className="rental-sidebar">
          <div><h2>{currentStep >= 3 ? `Find your ${purpose === 'rent' ? 'rental ' : ''}home` : <>Your housing<br />preferences</>}</h2><p>{currentStep === 4 ? 'About 1 minute left.' : 'Four quick steps to find homes that fit your real life.'}</p></div>
          <ol>{housingSteps.map((step, index) => {
            const stepNumber = index + 1
            const complete = stepNumber < currentStep
            return <li className={`${stepNumber === currentStep ? 'active' : ''} ${complete ? 'complete' : ''}`} key={step}><span>{complete ? '✓' : stepNumber}</span><strong>{step}</strong></li>
          })}</ol>
          <p className="rental-saved">◷&nbsp;&nbsp; Saved on this device</p>
        </aside>

        <main className="rental-main">
          {currentStep === 1 ? (
            <>
            <div className="rental-intro">
            <p>{purpose === 'rent' ? 'RENT A HOME' : 'BUY A HOME'} — STEP 1 OF 4</p>
            <h1>What kind of {actionWord} home do you need?</h1>
            <span>Tell us your space and household needs.</span>
          </div>

          <section className="rental-card home-type-card">
            <h2>What type of {actionWord} home do you prefer?</h2>
            <div className="rental-type-grid" role="radiogroup" aria-label="Preferred home type">
              {homeTypes.map(([value, label]) => (
                <button className={homeType === value ? 'is-selected' : ''} type="button" role="radio" aria-checked={homeType === value} onClick={() => chooseHomeType(value)} key={value}>
                  <HomeTypeIcon type={value} /><span><i />{label}</span>
                </button>
              ))}
            </div>
          </section>

          {homeType !== 'house' && (
            <section className="rental-card floor-card">
              <h2>Which floor do you prefer?</h2>
              <div className="floor-grid" role="radiogroup" aria-label="Preferred floor">
                {floorOptions.map(([value, label]) => <button className={floor === value ? 'is-selected' : ''} type="button" role="radio" aria-checked={floor === value} onClick={() => setFloor(value)} key={value}><i />{label}</button>)}
              </div>
            </section>
          )}

          <section className="rental-card space-card">
            <h2>How much space do you need?</h2>
            <div className="space-grid">
              <label><span>Bedrooms required</span><select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}><option value="">Select</option><option value="studio">Studio</option><option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option><option value="4+">4 or more</option></select></label>
              <label><span>Bathrooms required</span><select value={bathrooms} onChange={(event) => setBathrooms(event.target.value)}><option value="">Select</option><option value="1">1 bathroom</option><option value="2">2 bathrooms</option><option value="3+">3 or more</option></select></label>
              <label><span>Minimum room size</span><select value={roomSize} onChange={(event) => setRoomSize(event.target.value)}><option value="">Select</option><option value="any">Doesn’t matter</option><option value="small">Under 500 sq ft</option><option value="medium">500–999 sq ft</option><option value="large">1,000 sq ft or more</option></select></label>
            </div>
          </section>

          <section className="rental-card household-card">
            <h2>Who will be living in the home?</h2>
            <div className="household-grid">
              <label className="people-field">
                <span>Number of people</span>
                <input type="number" min="1" max="20" value={people} onChange={(event) => setPeople(event.target.value)} placeholder="Enter number of people" />
              </label>
              <fieldset className="pets-field">
                <legend>Pets</legend>
                <div role="radiogroup" aria-label="Will pets live in the home?">
                  <button className={pets === 'yes' ? 'is-selected' : ''} type="button" role="radio" aria-checked={pets === 'yes'} onClick={() => setPets('yes')}>Yes</button>
                  <button className={pets === 'no' ? 'is-selected' : ''} type="button" role="radio" aria-checked={pets === 'no'} onClick={() => setPets('no')}>No</button>
                </div>
              </fieldset>
            </div>
          </section>

            <div className="rental-info">ⓘ&nbsp;&nbsp; We’ll use these details to avoid {actionWord} homes that are too small.</div>
            </>
          ) : currentStep === 2 ? (
            <HousingBudgetStep accessibility={accessibility} downPayment={downPayment} monthlyPayment={monthlyPayment} payment={payment} people={people} pets={pets} purchaseBudget={purchaseBudget} setAccessibility={setAccessibility} setDownPayment={setDownPayment} setMonthlyPayment={setMonthlyPayment} setPayment={setPayment} setPeople={setPeople} setPets={setPets} setPurchaseBudget={setPurchaseBudget} />
          ) : currentStep === 3 ? (
            <HousingLocationStep area={area} commuteTime={commuteTime} importantPlace={importantPlace} purpose={purpose} setArea={setArea} setCommuteTime={setCommuteTime} setImportantPlace={setImportantPlace} setSide={setSide} setTownship={setTownship} setWalkingTime={setWalkingTime} side={side} township={township} walkingTime={walkingTime} />
          ) : (
            <HousingFacilitiesStep areaPreference={areaPreference} facilities={facilities} purpose={purpose} setAreaPreference={setAreaPreference} setFacilities={setFacilities} />
          )}
          <div className="rental-actions">
            <a href={currentStep === 1 ? '#matching' : currentStep === 2 ? `#housing/${purpose}` : currentStep === 3 ? `#housing/${purpose}/budget` : `#housing/${purpose}/location`}>←&nbsp;&nbsp; {currentStep === 1 ? 'Back to home' : 'Back'}</a>
            {currentStep === 1 ? <a className="rental-next" href={`#housing/${purpose}/budget`}>Continue to budget&nbsp;&nbsp; →</a> : currentStep === 2 ? <a className="rental-next" href={`#housing/${purpose}/location`}>Continue to location&nbsp;&nbsp; →</a> : currentStep === 3 ? <a className="rental-next" href={`#housing/${purpose}/facilities`}>Continue to facilities&nbsp;&nbsp; →</a> : <button type="button">Review my answers&nbsp;&nbsp; →</button>}
          </div>
        </main>
      </div>
    </div>
  )
}

export default HomeQuestionnaire
