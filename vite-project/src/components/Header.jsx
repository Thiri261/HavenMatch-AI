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
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#top" aria-label="HavenMatch AI home">
          <BrandMark />
          <span>HavenMatch AI</span>
        </a>
        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#browse">Find a home</a>
          <a className="button button-primary header-cta" href="#matching">Start matching</a>
        </nav>
      </div>
    </header>
  )
}

export default Header
