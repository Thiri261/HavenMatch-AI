const steps = [
  {
    title: 'Tell us your needs',
    description: 'Budget, location, household and must-haves',
    icon: 'clipboard',
  },
  {
    title: 'Let AI compare the details',
    description: 'We balance cost, commute, facilities and lifestyle',
    icon: 'ai',
  },
  {
    title: 'Choose with confidence',
    description: 'See match scores, trade-offs and full monthly costs',
    icon: 'shield',
  },
]

// Add real property records here when they are available.
const homes = []

function StepIcon({ name }) {
  if (name === 'clipboard') {
    return (
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <path d="M25 16h-4a5 5 0 0 0-5 5v40a5 5 0 0 0 5 5h30a5 5 0 0 0 5-5V21a5 5 0 0 0-5-5h-4" />
        <path d="M29 16v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3h5v8H24v-8h5Z" />
        <path d="m25 35 4 4 7-8M25 48l4 4 7-8M40 36h9M40 49h9" />
      </svg>
    )
  }

  if (name === 'ai') {
    return (
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <path d="M35 14a10 10 0 0 0-18 6 10 10 0 0 0-5 18 10 10 0 0 0 7 17 10 10 0 0 0 16 5V14Zm2 0a10 10 0 0 1 17 8 9 9 0 0 1 2 17 10 10 0 0 1-2 18 10 10 0 0 1-17 3V14Z" />
        <path d="m23 31 4 4 6-7M23 45l4 4 6-7M43 27h8l4-5M43 36h14M43 46h8l5 5" />
        <circle cx="58" cy="20" r="3" /><circle cx="60" cy="36" r="3" /><circle cx="58" cy="53" r="3" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <path d="M36 7c9 8 18 11 27 12v16c0 16-10 26-27 33C19 61 9 51 9 35V19c9-1 18-4 27-12Z" />
      <path d="m24 37 8 8 17-18" />
    </svg>
  )
}

function HomeCard({ home }) {
  return (
    <article className="home-card">
      <div className="home-photo-wrap">
        <img className="home-photo" src={home.image} alt={`${home.type} in ${home.township}`} />
        <span className="match-badge">{home.match}</span>
      </div>
      <div className="home-details">
        <div className="home-meta">
          <span>▰&nbsp; {home.type}</span>
          <span className="meta-dot">•</span>
          <span>⌖&nbsp; {home.township}</span>
        </div>
        <p className="home-price">{home.price}<small>/month</small></p>
        <div className="home-features">
          {home.features.map((feature) => <span key={feature}>✓&nbsp; {feature}</span>)}
        </div>
        <button className="view-home-button" type="button">View home</button>
      </div>
    </article>
  )
}

function HowItWorks() {
  return (
    <section className="discover-section" id="how-it-works">
      <div className="container">
        <h2 className="section-heading">How it works</h2>
        <div className="process-grid">
          {steps.map((step) => (
            <div className="process-item" key={step.title}>
              <article className="process-card">
                <div className="process-icon"><StepIcon name={step.icon} /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            </div>
          ))}
        </div>

        <div className="homes-heading-row">
          <div>
            <h2 className="section-heading">Homes that may fit</h2>
            <p>Personalized matches will appear here.</p>
          </div>
        </div>
        <div className="homes-grid">
          {homes.map((home) => <HomeCard home={home} key={home.township} />)}
        </div>
      </div>

      <aside className="ready-banner">
        <div className="ready-content">
          <h2>Ready to find a home that fits?</h2>
          <a className="button button-primary" href="#matching">Start as guest</a>
        </div>
      </aside>
    </section>
  )
}

export default HowItWorks
