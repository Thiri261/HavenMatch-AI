import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import BenefitsBar from './components/BenefitsBar';
import HowItWorks from './components/HowItWorks';
import HomeQuestionnaire from './components/HomeQuestionnaire';
import LandQuestionnaire from './components/LandQuestionnaire';
import MatchingPage from './components/MatchingPage';
import ReviewPage from './Pages/ReviewPage';
import LoadingPage from './Pages/LoadingPage';
import ResultPage from './Pages/ResultPage';

function App() {
  const getPage = () => {
    const hash = window.location.hash;
    
    if (hash.includes('review')) return 'review';
    if (hash.includes('loading')) return 'loading';
    if (hash.includes('result')) return 'result';
    if (hash.includes('land')) return 'land';
    if (hash.includes('housing')) return 'housing';
    if (hash.includes('matching')) return 'matching';
    return 'home';
  };

  const [page, setPage] = useState(getPage);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPage());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleGlobalClick = (e) => {
      const target = e.target.closest('button, a');
      if (target) {
        const text = target.innerText ? target.innerText.toLowerCase() : '';
        if (text.includes('review my answers') || text.includes('review')) {
          window.location.hash = '#review';
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return (
    <div className="site-shell">
      <Header />
      <main>
        {page === 'review' && <ReviewPage />}
        {page === 'loading' && <LoadingPage />}
        {page === 'result' && <ResultPage />}
        {page === 'matching' && <MatchingPage />}
        {page === 'land' && <LandQuestionnaire />}
        {page === 'housing' && <HomeQuestionnaire />}
        {page === 'home' && (
          <>
            <Hero />
            <BenefitsBar />
            <HowItWorks />
          </>
        )}
      </main>
    </div>
  );
}

export default App;