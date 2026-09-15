const actions = [
  {
    title: 'Buy a home',
    description: 'Tell us your budget, preferred location and must-haves to find homes that fit your plans.',
    button: 'Find homes to buy',
    browseHref: '#browse/buy',
    matchHref: '#housing/buy',
    icon: 'buy',
  },
  {
    title: 'Rent a home',
    description: 'Compare rentals by monthly cost, township, commute, facilities and everyday needs.',
    button: 'Find rentals',
    browseHref: '#browse/rent',
    matchHref: '#housing/rent',
    icon: 'rent',
  },
  {
    title: 'Buy land',
    description: 'Find land that matches your preferred location, budget, size and future plans.',
    button: 'Find land to buy',
    browseHref: '#browse/land',
    matchHref: '#land/area',
    icon: 'land',
  },
]

function ActionIcon({ name }) {
  if (name === 'buy') return <svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="27" cy="29" r="12" /><circle cx="69" cy="29" r="12" /><path d="M9 67c2-17 11-25 26-25M87 67c-2-17-11-25-26-25M35 53l13-10 13 10v24H35V53Z" /><path d="M43 77V63h10v14" /></svg>
  if (name === 'rent') return <svg viewBox="0 0 96 96" aria-hidden="true"><path d="M25 78V21h46v57M17 78h62M34 32h9v9h-9zM53 32h9v9h-9zM34 50h9v9h-9zM53 50h9v9h-9zM43 78V66h10v12" /><circle cx="74" cy="59" r="13" /><path d="m69 59 4 4 7-9" /></svg>
  return <svg viewBox="0 0 96 96" aria-hidden="true"><path d="M12 73h72M19 73l18-25 13 16 10-13 19 22M64 45V21h18l-9-11-9 11" /><path d="M25 39c7-13 17-20 31-21" /></svg>
}

export default function PropertyActions() {
  return (
    <section className="property-actions" aria-label="Choose your property goal">
      <div className="container property-action-grid">
        {actions.map((action) => (
          <article className="property-action-card" key={action.title}>
            <div className="property-action-icon"><ActionIcon name={action.icon} /></div>
            <h2>{action.title}</h2>
            <p>{action.description}</p>
            <div className="property-action-links"><a href={action.browseHref}>{action.button}</a><a className="property-ai-link" href={action.matchHref}>Use AI matching</a></div>
          </article>
        ))}
      </div>
    </section>
  )
}
