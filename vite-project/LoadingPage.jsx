import React, { useEffect, useState } from 'react';

export default function LoadingPage() {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing AI Core Engine...');

  useEffect(() => {
    const steps = [
      { p: 20, t: 'Scanning properties in Yangon...' },
      { p: 45, t: 'Filtering budget & must-have facilities...' },
      { p: 75, t: 'Calculating compatibility & match scores...' },
      { p: 100, t: 'Matching complete!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusText(steps[currentStep].t);
        currentStep++;
      } else {
        clearInterval(interval);
        window.location.hash = '#result';
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0b0f19',
      color: '#ffffff',
      borderRadius: '20px',
      margin: '20px auto',
      maxWidth: '800px',
      padding: '40px 20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      fontFamily: 'sans-serif'
    }}>
      
      {/* SVG Circular Progress Loader */}
      <div style={{ position: 'relative', width: '130px', height: '130px', marginBottom: '32px' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="6"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * progress) / 100}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#38bdf8'
        }}>
          {progress}%
        </div>
      </div>

      {/* Title & Status */}
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px' }}>
        HAVEN MATCH AI
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '28px', minHeight: '24px' }}>
        {statusText}
      </p>

      {/* Dynamic Progress Bar */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        backgroundColor: '#1e293b',
        height: '8px',
        borderRadius: '999px',
        overflow: 'hidden',
        border: '1px solid #334155'
      }}>
        <div style={{
          height: '100%',
          width: progress + '%',
          background: 'linear-gradient(90deg, #06b6d4, #6366f1, #ec4899)',
          borderRadius: '999px',
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>

    </div>
  );
}