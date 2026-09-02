import { useEffect, useState } from 'react'
import './App.css'
import BenefitsBar from './components/BenefitsBar'
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
import Footer from './components/Footer'

function App() {
  const getPage = () => {
    if (window.location.hash.startsWith('#signin')) return 'signin'
    if (window.location.hash.startsWith('#signup')) return 'signup'
    if (window.location.hash.startsWith('#review')) return 'review'
    if (window.location.hash.startsWith('#loading')) return 'loading'
    if (window.location.hash.startsWith('#result')) return 'result'
    if (window.location.hash.startsWith('#browse')) return 'browse'
    if (window.location.hash.startsWith('#dashboard')) return 'dashboard'
    if (window.location.hash.startsWith('#listing/')) return 'listing'
    if (window.location.hash.startsWith('#land')) return 'matching'
    if (window.location.hash.startsWith('#housing')) return 'matching'
    if (window.location.hash.startsWith('#matching')) return 'matching'
    return 'home'
  }

  const [page, setPage] = useState(getPage)

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

  if (page === 'review') return <><ReviewPage /><Footer /></>
  if (page === 'loading') return <><LoadingPage /><Footer /></>
  if (page === 'result') return <><ResultPage /><Footer /></>
  if (page === 'browse') return <><BrowseHomesPage /><Footer /></>
  if (page === 'dashboard') return <><DashboardPage /><Footer /></>
  if (page === 'listing') return <><ListingDetailPage /><Footer /></>

  if (page === 'signin' || page === 'signup') {
    return (
      <div className="site-shell">
        <Header />
        <main><AuthPage mode={page} /></main>
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
        <BenefitsBar />
        <PropertyActions />
        <FeaturedListings />
      </main>
      <Footer />
    </div>
  )
}

export default App
