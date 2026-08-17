const benefits = [
  { label: 'Budget-first recommendations', icon: <path d="M4 7h15a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3M16 12h5M17.5 12h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> },
  { label: 'Yangon township & YBS aware', icon: <><path d="M12 21s7-5.7 7-12a7 7 0 1 0-14 0c0 6.3 7 12 7 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="9" r="2.4" fill="currentColor" /></> },
  { label: 'Clear reasons for every match', icon: <><path d="M12 3 20 6v5c0 5.1-3.3 8.2-8 10-4.7-1.8-8-4.9-8-10V6l8-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="m8.5 12 2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> },
]

function BenefitsBar() {
  return (
    <section className="benefits-section" aria-label="HavenMatch benefits">
      <div className="container benefits-grid">
        {benefits.map((benefit) => (
          <div className="benefit-item" key={benefit.label}>
            <span className="benefit-icon"><svg viewBox="0 0 24 24" aria-hidden="true">{benefit.icon}</svg></span>
            <span>{benefit.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BenefitsBar
