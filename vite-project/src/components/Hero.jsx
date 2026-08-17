function ClockIcon() {
  return (
    <svg className="clock-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Hero() {
  return (
    <section className="hero-section" id="top">
      <div className="container hero-content">
        <p className="eyebrow">HavenMatch AI</p>
        <h1 className="hero-title">Find a home in Yangon that truly fits your budget</h1>
        <p className="hero-description">Affordable housing matched to your budget, location and daily life.</p>
        <div className="hero-actions">
          <a className="button button-primary" id="start-matching" href="#matching">Start matching — it’s free</a>
          <a className="button button-secondary" id="browse" href="#how-it-works">Browse homes</a>
        </div>
        <p className="hero-note">
          <ClockIcon />
          <span>No account needed</span>
          <span className="note-divider" aria-hidden="true">·</span>
          <span>About 3 minutes</span>
        </p>
      </div>
    </section>
  )
}

export default Hero
