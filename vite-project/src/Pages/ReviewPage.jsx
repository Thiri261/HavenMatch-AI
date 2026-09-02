export default function ReviewPage() {
  const handleConfirm = () => {
    window.location.hash = '#loading';
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px', fontFamily: 'sans-serif' }}>
      
      {/* Step Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', borderRadius: '12px', border: '2px solid #0f766e', backgroundColor: '#f0fdf4' }}>
          <strong style={{ display: 'block', color: '#0f766e' }}>1. Comprehensive Review</strong>
          <span style={{ fontSize: '13px', color: '#166534' }}>Verify your preferences</span>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <strong style={{ display: 'block', color: '#4b5563' }}>2. AI Matching Engine</strong>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Algorithmic scoring</span>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <strong style={{ display: 'block', color: '#4b5563' }}>3. Curated Match Results</strong>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Best options preview</span>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Full Preferences & Property Review</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Please double-check your inputs before initiating the AI matching engine.</p>

      {/* Main Container */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Top Grid: Main Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>🏠 Property Profile</h4>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Property Type:</strong> Full House / Apartment</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Plot Size:</strong> 40ft x 60ft</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Stories:</strong> 2 Floors</p>
          </div>

          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>💰 Budget</h4>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Target Rent:</strong> $450 - $500 / month</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Max Budget:</strong> $500 / month</p>
          </div>

          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>📍 Preferred Location</h4>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Region:</strong> Yangon Region</p>
            <p style={{ margin: '4px 0', color: '#374151' }}><strong>Townships:</strong> Hlaing, Sanchaung</p>
          </div>
        </div>

        {/* Bottom Grid: Detailed Facilities & Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', paddingTop: '24px' }}>
          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>⚙️ Facilities & Amenities</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#374151', fontSize: '14px', lineHeight: '1.8' }}>
<li>✔️ <strong>Generator / Backup Power:</strong> Prefer (High Priority)</li>
              <li>✔️ <strong>Reliable Water Supply:</strong> Prefer</li>
              <li>✔️ <strong>Wi-Fi / Internet Ready:</strong> Prefer</li>
              <li>✔️ <strong>Air Conditioning:</strong> Prefer</li>
              <li>✔️ <strong>Parking Space:</strong> Prefer</li>
              <li>🐾 <strong>Pets Allowed:</strong> Must Have (Crucial)</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#0f766e', fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>🧭 Environment & Area Type</h4>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
              <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>
                <strong>Preferred Environment:</strong> Near shops and markets
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                AI engine will calculate accessibility scores to public transport and nearby amenities.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '32px', textAlign: 'right' }}>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              backgroundColor: '#0f766e',
              color: '#ffffff',
              padding: '12px 28px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Confirm & Start Matching ►
          </button>
        </div>

      </div>
    </div>
  );
}
