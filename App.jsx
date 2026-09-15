import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import PropertyActions from './components/PropertyActions'
import FeaturedListings from './components/FeaturedListings'
import AuthPage from './Pages/AuthPage'
import UnifiedMatchingPage from './Pages/UnifiedMatchingPage'
import ReviewPage from './Pages/ReviewPage'
import LoadingPage from './Pages/LoadingPage'
import ResultPage from './Pages/ResultPage'
import BrowseHomesPage from './Pages/BrowseHomesPage'
import DashboardPage from './Pages/DashboardPage'
import ListingDetailPage from './Pages/ListingDetailPage'
import AdminPage from './Pages/AdminPage'
import BusinessDashboardPage from './Pages/BusinessDashboardPage'
import Footer from './components/Footer'
import useSession from './hooks/useSession'

function App() {
  const getPage = () => {
    if (window.location.hash.startsWith('#signin')) return 'signin'
    if (window.location.hash.startsWith('#signup')) return 'signup'
    if (window.location.hash.startsWith('#review')) return 'review'
    if (window.location.hash.startsWith('#loading')) return 'loading'
    if (window.location.hash.startsWith('#result')) return 'result'
    if (window.location.hash.startsWith('#browse')) return 'browse'
    if (window.location.hash.startsWith('#admin')) return 'admin'
    if (window.location.hash.startsWith('#business')) return 'business'
    if (window.location.hash.startsWith('#dashboard')) return 'dashboard'
    if (window.location.hash.startsWith('#listing/')) return 'listing'
    if (window.location.hash.startsWith('#land')) return 'matching'
    if (window.location.hash.startsWith('#housing')) return 'matching'
    if (window.location.hash.startsWith('#matching')) return 'matching'
    return 'home'
  }

  const [page, setPage] = useState(getPage)
  const { session, loading: sessionLoading } = useSession()

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPage())
      if (window.location.hash.startsWith('#dashboard-')) {
        window.requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth' }))
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    const isPublicPage = page === 'home' || page === 'signin' || page === 'signup'
    if (sessionLoading || isPublicPage || session) return
    localStorage.setItem('havenmatch_auth_redirect', window.location.hash || '#dashboard')
    localStorage.setItem('havenmatch_auth_message', 'Log in to continue to that page.')
    window.location.assign('#signin')
  }, [page, session, sessionLoading])

  const isProtectedPage = page !== 'home' && page !== 'signin' && page !== 'signup'
  if (isProtectedPage && (sessionLoading || !session)) {
    return <div className="site-shell"><Header /><main><section className="auth-page"><div className="auth-card"><p>Checking your account…</p></div></section></main><Footer /></div>
  }

  if (page === 'admin' && session.role !== 'admin') {
    return <div className="site-shell"><Header /><main><section className="auth-page"><div className="auth-card"><h2>Access denied</h2><p className="auth-intro">An administrator account is required to open this page.</p><a className="auth-submit" href="#dashboard">Go to my dashboard</a></div></section></main><Footer /></div>
  }

  if (page === 'business' && session.role !== 'business' && session.role !== 'admin') {
    return <div className="site-shell"><Header /><main><section className="auth-page"><div className="auth-card"><h2>Access denied</h2><p className="auth-intro">A vendor account is required to open this page.</p><a className="auth-submit" href="#dashboard">Go to my dashboard</a></div></section></main><Footer /></div>
  }

  if (page === 'review') return <><ReviewPage /><Footer /></>
  if (page === 'loading') return <><LoadingPage /><Footer /></>
  if (page === 'result') return <><ResultPage /><Footer /></>
  if (page === 'browse') return <><BrowseHomesPage /><Footer /></>
  if (page === 'admin') return <AdminPage />
  if (page === 'business') return <><BusinessDashboardPage /><Footer /></>
  if (page === 'dashboard') return <><DashboardPage /><Footer /></>
  if (page === 'listing') return <><ListingDetailPage /><Footer /></>

  if (page === 'signin' || page === 'signup') {
    return (
      <div className="site-shell">
        <Header />
        <main><AuthPage key={page} mode={page} /></main>
        <Footer />
      </div>
    )
  }

  if (page === 'matching') {
    return <><UnifiedMatchingPage /><Footer /></>
  }

  return (
    <div className="site-shell">
      <Header />
      <main>
        <Hero />
        <PropertyActions />
        {session && <FeaturedListings />}
      </main>
      <Footer />
    </div>
  )
}

export default App
