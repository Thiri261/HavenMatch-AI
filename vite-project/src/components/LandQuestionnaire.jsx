import { useEffect, useState } from 'react'

const landSteps = ['Land area', 'Budget', 'Location & commute']
const budgetRanges = [
  ['under-50m', 'Under 50 million MMK'],
  ['50m-99m', '50–99 million MMK'],
  ['100m-199m', '100–199 million MMK'],
  ['200m-499m', '200–499 million MMK'],
  ['500m-plus', '500 million MMK or more'],
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

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" />
    </svg>
  )
}

function AreaStep({ anySize, setAnySize, setSize, setUnit, size, unit }) {
  return (
    <>
      <section className="land-intro">
        <p>STEP 1 OF 3</p>
        <h1>How much land do you need?</h1>
        <span>Choose the minimum land size that would work for you.</span>
      </section>

      <section className="land-form-card">
        <h2>Minimum land area</h2>
        <div className="land-fields">
          <label>
            <span>Land area</span>
            <select value={size} onChange={(event) => setSize(event.target.value)} disabled={anySize}>
              <option value="">Select a size range</option>
              <option value="under-1000">Under 1,000</option>
              <option value="1000-2499">1,000–2,499</option>
              <option value="2500-4999">2,500–4,999</option>
              <option value="5000-9999">5,000–9,999</option>
              <option value="10000-plus">10,000 or more</option>
            </select>
          </label>
          <label>
            <span>Unit</span>
            <select value={unit} onChange={(event) => setUnit(event.target.value)}>
              <option value="sq-ft">sq ft</option>
              <option value="sq-m">sq m</option>
              <option value="acre">acre</option>
            </select>
          </label>
        </div>
        <label className="land-checkbox">
          <input type="checkbox" checked={anySize} onChange={(event) => setAnySize(event.target.checked)} />
          <span>Size doesn’t matter</span>
        </label>
        <p className="land-help">You can change the measurement unit before choosing a range.</p>
      </section>

      <div className="land-info"><InfoIcon /><span>We’ll use this to remove plots that are too small for your needs.</span></div>
    </>
  )
}

function BudgetSelect({ label, onChange, value }) {
  return (
    <label className="budget-field">
      <span>{label}</span>
      <div>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select a budget range</option>
          {budgetRanges.map(([rangeValue, rangeLabel]) => <option value={rangeValue} key={rangeValue}>{rangeLabel}</option>)}
        </select>
        <strong>MMK</strong>
      </div>
    </label>
  )
}

function BudgetStep({ downPayment, monthlyPayment, payment, purchaseBudget, setDownPayment, setMonthlyPayment, setPayment, setPurchaseBudget }) {
  const showLoanFields = payment === 'loan'

  return (
    <>
      <section className="land-intro budget-intro">
        <p>STEP 2 OF 3</p>
        <h1>What is your budget for land?</h1>
        <span>Choose ranges that are comfortable for you. No exact amount is required.</span>
      </section>

      <section className="payment-card">
        <h2>How do you plan to pay?</h2>
        <div className="payment-options" role="radiogroup" aria-label="How do you plan to pay?">
          {[
            ['cash', 'Cash'],
            ['loan', 'Loan'],
            ['unsure', 'Not sure yet'],
          ].map(([value, label]) => (
            <button
              className={payment === value ? 'is-selected' : ''}
              type="button"
              role="radio"
              aria-checked={payment === value}
              onClick={() => setPayment(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="budget-card">
        <h2>Your budget</h2>
        <BudgetSelect label="Maximum land purchase price" value={purchaseBudget} onChange={setPurchaseBudget} />
        {showLoanFields && (
          <>
            <BudgetSelect label="Available down payment" value={downPayment} onChange={setDownPayment} />
            <BudgetSelect label="Maximum monthly loan repayment" value={monthlyPayment} onChange={setMonthlyPayment} />
          </>
        )}
      </section>

      <div className="land-info budget-info"><InfoIcon /><span>We’ll only show the loan questions when they apply to you.</span></div>
    </>
  )
}

function ChoiceButtons({ label, options, value, onChange }) {
  return (
    <fieldset className="location-choice-group">
      <legend>{label}</legend>
      <div>
        {options.map(([optionValue, optionLabel]) => (
          <button
            className={value === optionValue ? 'is-selected' : ''}
            type="button"
            aria-pressed={value === optionValue}
            onClick={() => onChange(optionValue)}
            key={optionValue}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function LocationStep({
  area,
  commuteTime,
  importantPlace,
  setArea,
  setCommuteTime,
  setImportantPlace,
  setSide,
  setTownship,
  setWalkingTime,
  side,
  township,
  walkingTime,
}) {
  const sides = [
    ['north', 'North'],
    ['south', 'South'],
    ['east', 'East'],
    ['west', 'West'],
    ['central', 'Central'],
    ['any', 'Doesn’t matter'],
  ]
  const commuteOptions = [
    ['20', 'Up to 20 minutes'],
    ['30', 'Up to 30 minutes'],
    ['60', 'Up to 1 hour'],
    ['any', 'Doesn’t matter'],
  ]
  const walkingOptions = [
    ['10', 'Up to 10 minutes'],
    ['20', 'Up to 20 minutes'],
    ['30', 'Up to 30 minutes'],
    ['any', 'Doesn’t matter'],
  ]

  return (
    <>
      <section className="land-intro location-intro">
        <p>STEP 3 OF 3</p>
        <h1>Where should your land be?</h1>
        <span>Tell us which Yangon areas and travel limits work for you.</span>
      </section>

      <section className="location-card">
        <h2>Location preferences</h2>
        <div className="location-selects">
          <label>
            <span>Preferred township</span>
            <select value={township} onChange={(event) => setTownship(event.target.value)}>
              <option value="">Search or select a township</option>
              <option value="ahlone">Ahlone</option>
              <option value="bahan">Bahan</option>
              <option value="hlaing">Hlaing</option>
              <option value="kamayut">Kamayut</option>
              <option value="mayangone">Mayangone</option>
              <option value="north-dagon">North Dagon</option>
              <option value="south-okkalapa">South Okkalapa</option>
              <option value="thanlyin">Thanlyin</option>
            </select>
            <small>You can choose the closest match.</small>
          </label>
          <label>
            <span>Preferred ward or area (optional)</span>
            <input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Enter a ward or area" />
          </label>
        </div>
        <ChoiceButtons label="Preferred side of Yangon" options={sides} value={side} onChange={setSide} />
      </section>

      <section className="location-card commute-card">
        <h2>Commute preferences</h2>
        <label className="important-place">
          <span>Important place</span>
          <input value={importantPlace} onChange={(event) => setImportantPlace(event.target.value)} placeholder="Workplace, school, university, or another place" />
        </label>
        <ChoiceButtons label="Maximum commute time" options={commuteOptions} value={commuteTime} onChange={setCommuteTime} />
        <ChoiceButtons label="Walking time to a bus stop" options={walkingOptions} value={walkingTime} onChange={setWalkingTime} />
      </section>

      <div className="land-info location-info"><InfoIcon /><span>We’ll compare your travel preferences with available Yangon transport information.</span></div>
    </>
  )
}

function LandQuestionnaire() {
  const getStep = () => {
    if (window.location.hash.includes('/location')) return 3
    if (window.location.hash.includes('/budget')) return 2
    return 1
  }
  const [currentStep, setCurrentStep] = useState(getStep)
  const [unit, setUnit] = useState(() => localStorage.getItem('havenmatch-land-unit') || 'sq-ft')
  const [size, setSize] = useState(() => localStorage.getItem('havenmatch-land-size') || '')
  const [anySize, setAnySize] = useState(() => localStorage.getItem('havenmatch-land-any-size') === 'true')
  const [payment, setPayment] = useState(() => localStorage.getItem('havenmatch-land-payment') || '')
  const [purchaseBudget, setPurchaseBudget] = useState(() => localStorage.getItem('havenmatch-land-purchase-budget') || '')
  const [downPayment, setDownPayment] = useState(() => localStorage.getItem('havenmatch-land-down-payment') || '')
  const [monthlyPayment, setMonthlyPayment] = useState(() => localStorage.getItem('havenmatch-land-monthly-payment') || '')
  const [township, setTownship] = useState(() => localStorage.getItem('havenmatch-land-township') || '')
  const [area, setArea] = useState(() => localStorage.getItem('havenmatch-land-area-name') || '')
  const [side, setSide] = useState(() => localStorage.getItem('havenmatch-land-side') || '')
  const [importantPlace, setImportantPlace] = useState(() => localStorage.getItem('havenmatch-land-important-place') || '')
  const [commuteTime, setCommuteTime] = useState(() => localStorage.getItem('havenmatch-land-commute-time') || '')
  const [walkingTime, setWalkingTime] = useState(() => localStorage.getItem('havenmatch-land-walking-time') || '')

  useEffect(() => {
    const updateStep = () => setCurrentStep(getStep())
    window.addEventListener('hashchange', updateStep)
    return () => window.removeEventListener('hashchange', updateStep)
  }, [])

  useEffect(() => {
    localStorage.setItem('havenmatch-land-unit', unit)
    localStorage.setItem('havenmatch-land-size', size)
    localStorage.setItem('havenmatch-land-any-size', String(anySize))
    localStorage.setItem('havenmatch-land-payment', payment)
    localStorage.setItem('havenmatch-land-purchase-budget', purchaseBudget)
    localStorage.setItem('havenmatch-land-down-payment', downPayment)
    localStorage.setItem('havenmatch-land-monthly-payment', monthlyPayment)
    localStorage.setItem('havenmatch-land-township', township)
    localStorage.setItem('havenmatch-land-area-name', area)
    localStorage.setItem('havenmatch-land-side', side)
    localStorage.setItem('havenmatch-land-important-place', importantPlace)
    localStorage.setItem('havenmatch-land-commute-time', commuteTime)
    localStorage.setItem('havenmatch-land-walking-time', walkingTime)
  }, [unit, size, anySize, payment, purchaseBudget, downPayment, monthlyPayment, township, area, side, importantPlace, commuteTime, walkingTime])

  const areaComplete = Boolean(size || anySize)
  const budgetComplete = Boolean(payment && purchaseBudget && (payment !== 'loan' || (downPayment && monthlyPayment)))
  const locationComplete = Boolean((township || side) && commuteTime && walkingTime)

  return (
    <div className="land-page">
      <header className="land-header">
        <a className="land-brand" href="#top" aria-label="Back to HavenMatch AI home"><BrandIcon /><span>HavenMatch AI</span></a>
        <div className="land-header-actions"><span>Your answers stay private</span><a href="#top">Exit</a></div>
      </header>

      <div className="land-layout">
        <aside className="land-sidebar">
          <div><h2>Find your land</h2><p>Three quick steps to find land that fits your plans.</p></div>
          <ol className="land-step-list">
            {landSteps.map((step, index) => {
              const stepNumber = index + 1
              const complete = stepNumber < currentStep
              return (
                <li className={`${stepNumber === currentStep ? 'active' : ''} ${complete ? 'complete' : ''}`} key={step}>
                  <span>{complete ? '✓' : stepNumber}</span><strong>{step}</strong>
                </li>
              )
            })}
          </ol>
          <p className="land-no-account">◷&nbsp; No account needed</p>
        </aside>

        <main className="land-main">
          <div className={`land-progress step-${currentStep}`} aria-label={`Step ${currentStep} of 3`}><div><span /></div><strong>{currentStep === 1 ? '33%' : currentStep === 2 ? '67%' : '100%'}</strong></div>
          {currentStep === 1 ? (
            <AreaStep anySize={anySize} setAnySize={setAnySize} setSize={setSize} setUnit={setUnit} size={size} unit={unit} />
          ) : currentStep === 2 ? (
            <BudgetStep downPayment={downPayment} monthlyPayment={monthlyPayment} payment={payment} purchaseBudget={purchaseBudget} setDownPayment={setDownPayment} setMonthlyPayment={setMonthlyPayment} setPayment={setPayment} setPurchaseBudget={setPurchaseBudget} />
          ) : (
            <LocationStep area={area} commuteTime={commuteTime} importantPlace={importantPlace} setArea={setArea} setCommuteTime={setCommuteTime} setImportantPlace={setImportantPlace} setSide={setSide} setTownship={setTownship} setWalkingTime={setWalkingTime} side={side} township={township} walkingTime={walkingTime} />
          )}
        </main>
      </div>

      <footer className="land-footer">
        <a className="land-back" href={currentStep === 1 ? '#matching' : currentStep === 2 ? '#land/area' : '#land/budget'}>←&nbsp;&nbsp; Back</a>
        <span className="land-saved">✓&nbsp;&nbsp; Saved on this device</span>
        {currentStep === 1 ? (
          <a className={`land-next ${areaComplete ? '' : 'is-disabled'}`} href={areaComplete ? '#land/budget' : '#land/area'} aria-disabled={!areaComplete}>Continue to budget&nbsp;&nbsp; →</a>
        ) : currentStep === 2 ? (
          <a className={`land-next ${budgetComplete ? '' : 'is-disabled'}`} href={budgetComplete ? '#land/location' : '#land/budget'} aria-disabled={!budgetComplete}>Continue to location&nbsp;&nbsp; →</a>
        ) : (
          <button type="button" disabled={!locationComplete}>Review my answers&nbsp;&nbsp; →</button>
        )}
      </footer>
    </div>
  )
}

export default LandQuestionnaire
