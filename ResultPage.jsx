import useSession from '../hooks/useSession'

export default function ResultPage() {
  const { session } = useSession()
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem(session ? `havenmatch-match-results-${session.email}` : '') || 'null') } catch { return null }
  })()
  const hasApiResult = stored && Array.isArray(stored.matches)
  const properties = hasApiResult
    ? stored.matches.map((item) => ({
        id: item.id,
        title: item.title,
        location: `${item.township.replaceAll('_', ' ')} Township, Yangon`,
        price: `${new Intl.NumberFormat('en-US').format(item.priceMmk)} MMK`,
        score: item.scoreStatus === 'not_scored' ? 'Not Scored' : `${item.score}%`,
        image: item.imageUrl,
        tags: item.explanations?.map((explanation) => explanation.text) || item.reasons.map((reason) => reason.replaceAll('_', ' ')),
        warnings: item.warnings || [],
        dataQuality: item.dataQuality,
        isPartialMatch: item.isPartialMatch === true,
      }))
    : []

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 40px auto' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉 <b>AI Matched Results</b></div>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          {!hasApiResult
            ? 'Complete the matching questions to generate recommendations for your account.'
            : stored.matchMode === 'closest'
              ? 'No exact match met every requirement, so these are your highest-scoring closest options.'
              : 'Based on your preference model, we found top properties matching your criteria.'}
        </p>
      </div>

      {/* Responsive Property Grid (Automatic 3 Columns / 2 Columns / 1 Column) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {!hasApiResult && (
          <div style={{ gridColumn: '1 / -1', padding: '44px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#475569' }}>
            <h2 style={{ margin: '0 0 10px', color: '#1e293b' }}>No match result available</h2>
            <p style={{ margin: '0 0 22px' }}>Start AI matching and answer the questions to see your recommendations.</p>
            <a href="#matching" style={{ display: 'inline-block', padding: '12px 18px', borderRadius: '10px', background: '#2d4a43', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Start AI matching</a>
          </div>
        )}
        {hasApiResult && properties.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '36px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#475569' }}>
            No properties meet every required preference. Try increasing the budget or relaxing one requirement.
          </div>
        )}
        {properties.map((item) => (
          <div key={item.id} style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* Image Container with Badge */}
            <div style={{ position: 'relative', height: '200px' }}>
              <img 
                src={item.image} 
                alt={item.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '6px 12px',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                Match Score: {item.score}
              </span>
              {item.isPartialMatch && <span style={{ position: 'absolute', top: '12px', left: '12px', padding: '6px 10px', borderRadius: '20px', backgroundColor: '#fff7ed', color: '#9a3412', fontSize: '11px', fontWeight: 'bold' }}>Closest match</span>}
            </div>

            {/* Content Details */}
            <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 6px 0' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 12px 0' }}>
                  📍 {item.location}
                </p>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>
                  {item.price}
                </div>

                {/* Feature Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {item.tags.map((tag, idx) => (
                    <span key={idx} style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      ✓ {tag}
                    </span>
                  ))}
                </div>
                {item.isPartialMatch && item.warnings.some((warning) => warning.code.startsWith('unmet_')) && (
                  <div style={{ margin: '0 0 16px', padding: '10px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '11px', lineHeight: 1.45 }}>
                    <strong>Doesn’t fully match:</strong>
                    <ul style={{ margin: '5px 0 0', paddingLeft: '18px' }}>
                      {item.warnings.filter((warning) => warning.code.startsWith('unmet_')).map((warning) => <li key={warning.code}>{warning.text}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <a href={`#listing/${item.id}`} style={{
                width: '100%',
                minHeight: '43px',
                padding: '12px',
                backgroundColor: '#2d4a43',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                View Property Details
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
