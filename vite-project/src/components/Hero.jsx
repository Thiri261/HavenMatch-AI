import BenefitsBar from './BenefitsBar'

function Hero() {
  return (
    <section className="hero-section" id="top">
      <div className="container hero-content">
        <p className="eyebrow">A SMARTER PROPERTY SEARCH</p>
        <h1 className="hero-title">Find a place in Yangon that truly fits your budget.</h1>
        <p className="hero-description">Discover homes and land matched to your budget, location, and everyday needs.</p>
        <div className="hero-actions">
          <a className="button button-primary" id="start-matching" href="#matching">Start matching</a>
          <a className="button button-secondary" id="browse" href="#browse/rent">Browse houses</a>
        </div>
      </div>
      <BenefitsBar />
    </section>
  )
}

export default Hero
