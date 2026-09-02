function FooterBrand() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 29 32 8l24 21M14 27v27h36V27" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 21c-7 0-12 5-12 12 0 10 12 20 12 20s12-10 12-20c0-7-5-12-12-12Z" fill="#ff5838" stroke="#fff" strokeWidth="3" />
      <circle cx="32" cy="33" r="4" fill="#fff" />
    </svg>
  )
}

export default function Footer() {
  const { session } = useSession()

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-about"><a href="#top"><FooterBrand /><strong>HavenMatch AI</strong></a><p>Smarter, budget-first property recommendations for people finding a home or land in Yangon.</p></div>
        <nav aria-label="Explore"><h2>Explore</h2><a href="#browse/rent">Rent a home</a><a href="#browse/buy">Buy a home</a><a href="#browse/land">Buy land</a></nav>
        <nav aria-label="HavenMatch tools"><h2>HavenMatch</h2><a href="#matching">AI Match</a></nav>
        <nav aria-label="Account"><h2>Account</h2>{session ? <><a href="#dashboard">My dashboard</a><a href="#browse/rent">Saved favourites</a></> : <><a href="#signin">Log in</a><a href="#signup">Create an account</a></>}</nav>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} HavenMatch AI</span><span>Designed for finding homes across Yangon</span></div>
    </footer>
  )
}
import useSession from '../hooks/useSession'
