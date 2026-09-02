export default function ResultPage() {
  // AI Matched Property List (၆ ခု ပါဝင်ပါသည်)
  const properties = [
    {
      id: 1,
      title: "Cozy Haven Modern Apartment",
      location: "Hlaing Township, Yangon",
      price: "$450 / month",
      score: "96%",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
      tags: ["Generator Backup", "Pet Friendly", "Wi-Fi Ready", "Near Shops"]
    },
    {
      id: 2,
      title: "Garden View Residence",
      location: "Sanchaung Township, Yangon",
      price: "$500 / month",
      score: "91%",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
      tags: ["Aircon Included", "24/7 Security", "Quiet Residential"]
    },
    {
      id: 3,
      title: "Skyline Luxury Condominium",
      location: "Bahan Township, Yangon",
      price: "$850 / month",
      score: "89%",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80",
      tags: ["Swimming Pool", "Gym Access", "City View", "Car Parking"]
    },
    {
      id: 4,
      title: "Minimalist Loft Studio",
      location: "Kamayut Township, Yangon",
      price: "$380 / month",
      score: "85%",
      image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=600&q=80",
      tags: ["Fully Furnished", "Near Inya Lake", "Balcony"]
    },
    {
      id: 5,
      title: "Urban Greenery Suite",
      location: "Yankin Township, Yangon",
      price: "$620 / month",
      score: "82%",
      image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80",
      tags: ["Lift Included", "High-speed Net", "Modern Kitchen"]
    },
    {
      id: 6,
      title: "Riverside Sunset View Flat",
      location: "Ahlone Township, Yangon",
      price: "$400 / month",
      score: "78%",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
      tags: ["River View", "Quiet Area", "Spacious Living"]
    }
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 40px auto' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉 <b>AI Matched Results</b></div>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          Based on your preference model, we found top properties matching your criteria.
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
