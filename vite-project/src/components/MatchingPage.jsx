import { useState } from 'react'

const choices = [
  {
    id: 'rent',
    title: 'Rent a home',
    description: 'Find an apartment, condo, house, or shared home to rent.',
    icon: 'key',
  },
  {
    id: 'buy',
    title: 'Buy a home',
    description: 'Find an apartment, condo, or house to purchase.',
    icon: 'home',
  },
  {
    id: 'land',
    title: 'Buy land',
    description: 'Search by land area, budget, location, and commute only.',
    icon: 'land',
  },
]

function BrandIcon() {
  return (
    <svg className="matching-brand-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 29 32 8l24 21" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 27v27h36V27" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
      <path d="M32 21c-7 0-12 5-12 12 0 10 12 20 12 20s12-10 12-20c0-7-5-12-12-12Z" fill="#ff5838" stroke="#fffdf9" strokeWidth="3" />
      <circle cx="32" cy="33" r="4" fill="#fffdf9" />
    </svg>
  )
}

function ChoiceIcon({ name }) {
  if (name === 'key') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="62" cy="31" r="22" /><circle cx="68" cy="25" r="4" />
        <path d="m47 46-30 30v12h12l7-7h8v-8h8l10-10" />
      </svg>
    )
  }

  if (name === 'home') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path d="m12 46 36-32 36 32M20 42v42h25V59h22v25h9V42M68 25V13h11v22" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <path d="M11 69 42 30l34 42H12l20-24 20 24M73 51V31M63 31h20L73 7 63 31Zm3 14h14" />
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

function MatchingPage() {
  const [selection, setSelection] = useState('')

  const handleContinue = () => {
    const routes = {
      rent: '#housing/rent',
      buy: '#housing/buy',
      land: '#land/area',
    }

    if (selection) window.location.hash = routes[selection]
  }

  return (
    <div className="matching-page">
      <header className="matching-header">
        <a className="matching-brand" href="#top" aria-label="Back to HavenMatch AI home">
          <BrandIcon />
          <span>HavenMatch AI</span>
        </a>
        <div className="matching-header-actions">
          <span>Your answers stay private</span>
          <a className="matching-exit" href="#top">Exit</a>
        </div>
      </header>

      <main className="matching-main">
        <div className="matching-intro">
          <p>LET’S GET STARTED</p>
          <h1>What are you looking for?</h1>
          <span>Choose one option so we can ask only the questions that matter to you.</span>
        </div>

        <div className="choice-grid" role="radiogroup" aria-label="What are you looking for?">
          {choices.map((choice) => (
            <button
              className={`choice-card ${selection === choice.id ? 'is-selected' : ''}`}
              type="button"
              role="radio"
              aria-checked={selection === choice.id}
              onClick={() => setSelection(choice.id)}
              key={choice.id}
            >
              <span className="choice-check" aria-hidden="true">✓</span>
              <span className="choice-icon"><ChoiceIcon name={choice.icon} /></span>
              <strong>{choice.title}</strong>
              <span>{choice.description}</span>
            </button>
          ))}
        </div>

        <section className="adaptive-note" aria-label="How the questionnaire adapts">
          <div className="adaptive-title"><InfoIcon /><strong>Your questionnaire will adapt to your choice. You can change this later.</strong></div>
        </section>

        <div className="matching-footer">
          <span className="matching-no-account">◷&nbsp; No account needed</span>
          <a className="matching-back" href="#top">←&nbsp;&nbsp; Back to home</a>
          <button className="matching-continue" type="button" disabled={!selection} onClick={handleContinue}>Continue&nbsp;&nbsp; →</button>
        </div>
      </main>
    </div>
  )
}

export default MatchingPage
