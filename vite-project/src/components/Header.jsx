import useSession, { announceAuthChange } from '../hooks/useSession'

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 29 32 8l24 21" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 27v27h36V27" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
      <path d="M32 21c-7 0-12 5-12 12 0 10 12 20 12 20s12-10 12-20c0-7-5-12-12-12Z" fill="#ff5838" stroke="#fffdf9" strokeWidth="3" />
      <circle cx="32" cy="33" r="4" fill="#fffdf9" />
    </svg>
  )
}

function Header() {
  const { session } = useSession()
  const hash = window.location.hash || '#top'
  const isHome = hash === '#top' || hash === '#'
  const isActive = (page) => {
    if (page === 'browse') return hash.startsWith('#browse') || hash.startsWith('#listing/')
    if (page === 'matching') return hash.startsWith('#matching') || hash.startsWith('#housing') || hash.startsWith('#land') || hash.startsWith('#review') || hash.startsWith('#loading') || hash.startsWith('#result')
    return hash.startsWith(`#${page}`)
  }

  const navProps = (page) => isActive(page) ? { className: 'is-active', 'aria-current': 'page' } : {}

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    announceAuthChange(null)
    window.location.assign('#top')
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <nav className="header-nav header-nav-left" aria-label="Property navigation">
          <a href="#browse/rent" {...navProps('browse')}>Browse homes</a>
          <a href="#matching" {...navProps('matching')}>AI Match</a>
        </nav>
        <a className="brand" href="#top" aria-label="HavenMatch AI home">
          <BrandMark />
          <span>HavenMatch AI</span>
        </a>
        <nav className="header-nav header-nav-right" aria-label="Account navigation">
          {session ? (
            <div className="account-menu">
              <span>Hi, {session.name.split(' ')[0]}</span>
              <a href="#dashboard" {...navProps('dashboard')}>My dashboard</a>
              <button type="button" onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <>
              <a href="#signup" {...navProps('signup')}>Sign up</a>
              <a className={`header-login${isActive('signin') ? ' is-active' : ''}`} aria-current={isActive('signin') ? 'page' : undefined} href="#signin">Log in</a>
            </>
          )}
          {isHome && <a className="button button-primary header-cta" href="#matching">Start AI matching</a>}
        </nav>
      </div>
    </header>
  )
}

export default Header
