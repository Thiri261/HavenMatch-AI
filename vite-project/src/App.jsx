import { useEffect, useState } from 'react'
import './App.css'
import BenefitsBar from './components/BenefitsBar'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import HomeQuestionnaire from './components/HomeQuestionnaire'
import LandQuestionnaire from './components/LandQuestionnaire'
import MatchingPage from './components/MatchingPage'

function App() {
  const getPage = () => {
    if (window.location.hash.startsWith('#land')) return 'land'
    if (window.location.hash.startsWith('#housing')) return 'housing'
    if (window.location.hash.startsWith('#matching')) return 'matching'
    return 'home'
  }

  const [page, setPage] = useState(getPage)

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPage())
      window.scrollTo({ top: 0, behavior: 'instant' })
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (page === 'matching') {
    return <MatchingPage />
  }

  if (page === 'land') {
    return <LandQuestionnaire />
  }

  if (page === 'housing') {
    return <HomeQuestionnaire />
  }

  return (
    <div className="site-shell">
      <Header />
      <main>
        <Hero />
        <BenefitsBar />
        <HowItWorks />
      </main>
    </div>
  )
}

export default App
