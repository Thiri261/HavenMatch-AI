import React, { useState, useEffect } from 'react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('listings');

  // Listing Data များ (User ဘက်က Preference တွေနဲ့ ချိန်ကိုက်လို့ရမည့် အချက်အလက် အစုံပါဝင်သည်)
  const [listings, setListings] = useState([
    {
      id: 1,
      title: 'Modern Condo in Bahan',
      price: '350000000',
      propertyType: 'Condo',
      floor: 'Middle floor',
      bedrooms: '2 bedrooms',
      bathrooms: '1 bathroom',
      minRoomSize: 'Under 500 sq ft',
      township: 'Bahan',
      sideOfYangon: 'Central',
      reliableElectricity: 'Must have',
      generator: 'Must have',
      reliableWater: 'Must have',
      wifi: 'Prefer',
      aircon: 'Must have',
      parking: 'Prefer',
      petsAllowed: 'Yes',
      nearShops: 'Prefer',
      areaPreference: 'Quiet residential area',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80'
    }
  ]);

  // Form Input States (ပုံတွေထဲက User Preferences တွေနဲ့ တစ်သားတည်းဖြစ်အောင် ထည့်သွင်းထားသည်)
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [floor, setFloor] = useState('Ground floor');
  const [bedrooms, setBedrooms] = useState('2 bedrooms');
  const [bathrooms, setBathrooms] = useState('1 bathroom');
  const [minRoomSize, setMinRoomSize] = useState('Under 500 sq ft');
  const [township, setTownship] = useState('Bahan');
  const [sideOfYangon, setSideOfYangon] = useState('Central');
  
  // Facilities States
  const [reliableElectricity, setReliableElectricity] = useState('Must have');
  const [generator, setGenerator] = useState('Prefer');
  const [reliableWater, setReliableWater] = useState('Must have');
  const [wifi, setWifi] = useState('Prefer');
  const [aircon, setAircon] = useState('Prefer');
  const [parking, setParking] = useState('Doesn\'t matter');
  const [petsAllowed, setPetsAllowed] = useState('Yes');
  const [nearShops, setNearShops] = useState('Prefer');
  const [areaPreference, setAreaPreference] = useState('Quiet residential area');

  const [image, setImage] = useState(null);

  // Registered User Log Data များ
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem('registered_users_log') || '[]');
    setUsers(savedUsers);
  }, [activeTab]);

  // Listing အသစ်ထည့်သွင်းသည့် Function
  const handleAddListing = (e) => {
    e.preventDefault();
    if (!title || !price) {
      alert('ကျေးဇူးပြု၍ Title နှင့် Price ဖြည့်သွင်းပေးပါ။');
      return;
    }

    const newListing = {
      id: Date.now(),
      title,
      price,
      propertyType,
      floor,
      bedrooms,
      bathrooms,
      minRoomSize,
      township,
      sideOfYangon,
      reliableElectricity,
      generator,
      reliableWater,
      wifi,
      aircon,
      parking,
      petsAllowed,
      nearShops,
      areaPreference,
      image: image ? URL.createObjectURL(image) : 'https://via.placeholder.com/150'
    };

    setListings([newListing, ...listings]);
    // Form ကို Reset ပြန်လုပ်ရန်
    setTitle('');
    setPrice('');
    setImage(null);
  };

  const handleDeleteListing = (id) => {
    if (confirm('ဤ Listing ကို ဖျက်ရန် သေချာပါသလား။')) {
      setListings(listings.filter(item => item.id !== id));
    }
  };

  const handleClearUsers = () => {
    if (confirm('User Activity Logs အားလုံးကို ဖျက်ရန် သေချာပါသလား။')) {
      localStorage.removeItem('registered_users_log');
      setUsers([]);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fff7f5', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', backgroundColor: '#ffffff', padding: '24px', borderRight: '1px solid #ffe4de', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ff5838', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
            H
          </div>
          <h2 style={{ color: '#1a1a1a', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            HavenMatch <span style={{ color: '#ff5838' }}>Admin</span>
          </h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('listings')}
            style={{ 
              backgroundColor: activeTab === 'listings' ? '#ff5838' : 'transparent',
              color: activeTab === 'listings' ? 'white' : '#555',
              border: 'none', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            <span>🏠</span> Manage Listings
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              backgroundColor: activeTab === 'users' ? '#ff5838' : 'transparent',
              color: activeTab === 'users' ? 'white' : '#555',
              border: 'none', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            <span>👥</span> User Activity Logs
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '36px', maxWidth: '1100px' }}>
        
        {/* TAB 1: MANAGE LISTINGS */}
        {activeTab === 'listings' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>Manage Property Listings (Complete Details)</h1>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '6px' }}>User ၏ Preference များနှင့် ကိုက်ညီစေရန် အိမ်ခြံမြေအချက်အလက်အပြည့်အစုံ ထည့်သွင်းပါ</p>
            </div>

            {/* Add New Detailed Listing Card */}
            <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', border: '1px solid #ffe4de', marginBottom: '32px', boxShadow: '0 2px 4px rgba(255,88,56,0.02)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff5838' }}></span>
                Add New Detailed Property Listing
              </h3>
              
              <form onSubmit={handleAddListing} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 1. Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Luxury Condo in Bahan" 
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', fontSize: '14px', backgroundColor: '#fafafa' }}
                    />
                  </div>
                  <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Price (MMK)</label>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="350000000" 
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', fontSize: '14px', backgroundColor: '#fafafa' }}
                    />
                  </div>
                </div>

                {/* 2. Property Type & Floor & Area Specifications */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Property Type</label>
                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', backgroundColor: '#fafafa', fontSize: '14px' }}>
                      <option value="Apartment">Apartment</option>
                      <option value="Condo">Condo</option>
                      <option value="House">House</option>
                      <option value="Shared apartment">Shared apartment</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Floor</label>
                    <select value={floor} onChange={(e) => setFloor(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', backgroundColor: '#fafafa', fontSize: '14px' }}>
                      <option value="Ground floor">Ground floor</option>
                      <option value="Middle floor">Middle floor</option>
                      <option value="High floor">High floor</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Minimum Room Size</label>
                    <select value={minRoomSize} onChange={(e) => setMinRoomSize(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', backgroundColor: '#fafafa', fontSize: '14px' }}>
                      <option value="Under 500 sq ft">Under 500 sq ft</option>
                      <option value="500 - 1000 sq ft">500 - 1000 sq ft</option>
                      <option value="Above 1000 sq ft">Above 1000 sq ft</option>
                    </select>
                  </div>
                </div>

                {/* 3. Space & Rooms */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Bedrooms Required</label>
                    <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', backgroundColor: '#fafafa', fontSize: '14px' }}>
                      <option value="1 bedroom">1 bedroom</option>
                      <option value="2 bedrooms">2 bedrooms</option>
                      <option value="3 bedrooms">3 bedrooms</option>
                      <option value="4+ bedrooms">4+ bedrooms</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Bathrooms Required</label>
                    <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', backgroundColor: '#fafafa', fontSize: '14px' }}>
                      <option value="1 bathroom">1 bathroom</option>
                      <option value="2 bathrooms">2 bathrooms</option>
                      <option value="3+ bathrooms">3+ bathrooms</option>
                    </select>
                  </div>
                </div>

                {/* 4. Location & Area Preferences */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Preferred Township</label>
                    <select value={township} onChange={(e) => setTownship(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', backgroundColor: '#fafafa', fontSize: '14px' }}>
                      <option value="Bahan">Bahan</option>
                      <option value="Hlaing">Hlaing</option>
                      <option value="Kamaryut">Kamaryut</option>
                      <option value="Mayangone">Mayangone</option>
                      <option value="North Dagon">North Dagon</option>
                      <option value="South Okkalapa">South Okkalapa</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Side of Yangon</label>
                    <select value={sideOfYangon} onChange={(e) => setSideOfYangon(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', backgroundColor: '#fafafa', fontSize: '14px' }}>
                      <option value="Central">Central</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Area Type</label>
                    <select value={areaPreference} onChange={(e) => setAreaPreference(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e1e1e1', outline: 'none', backgroundColor: '#fafafa', fontSize: '14px' }}>
                      <option value="Quiet residential area">Quiet residential area</option>
                      <option value="City centre">City centre</option>
                      <option value="Suburban area">Suburban area</option>
                      <option value="Near shops and markets">Near shops and markets</option>
                    </select>
                  </div>
                </div>

                {/* 5. Features / Facilities Preferences (Must have / Prefer / Doesn't matter) */}
                <div style={{ backgroundColor: '#fff8f6', padding: '16px', borderRadius: '12px', border: '1px solid #ffe4de', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Reliable Electricity</label>
                    <select value={reliableElectricity} onChange={(e) => setReliableElectricity(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                      <option value="Must have">Must have</option>
                      <option value="Prefer">Prefer</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Generator / Power</label>
                    <select value={generator} onChange={(e) => setGenerator(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                      <option value="Must have">Must have</option>
                      <option value="Prefer">Prefer</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Reliable Water</label>
                    <select value={reliableWater} onChange={(e) => setReliableWater(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                      <option value="Must have">Must have</option>
                      <option value="Prefer">Prefer</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Air Conditioning</label>
                    <select value={aircon} onChange={(e) => setAircon(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                      <option value="Must have">Must have</option>
                      <option value="Prefer">Prefer</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Wi-Fi / Internet</label>
                    <select value={wifi} onChange={(e) => setWifi(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                      <option value="Must have">Must have</option>
                      <option value="Prefer">Prefer</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Parking</label>
                    <select value={parking} onChange={(e) => setParking(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                      <option value="Must have">Must have</option>
                      <option value="Prefer">Prefer</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                    </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Pets Allowed</label>
                    <select value={petsAllowed} onChange={(e) => setPetsAllowed(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Near Shops/Markets</label>
                    <select value={nearShops} onChange={(e) => setNearShops(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                      <option value="Must have">Must have</option>
                      <option value="Prefer">Prefer</option>
                      <option value="Doesn't matter">Doesn't matter</option>
                    </select>
                  </div>
                </div>

                {/* 6. Image Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Property Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    style={{ width: '100%', fontSize: '13px', color: '#666', border: '1px solid #e1e1e1', borderRadius: '10px', padding: '9px', backgroundColor: '#fafafa' }}
                  />
                </div>

                <button type="submit" style={{ backgroundColor: '#ff5838', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,88,56,0.2)' }}>
                  Save Complete Listing
                </button>
              </form>
            </div>

            {/* Listings Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #ffe4de', overflow: 'hidden', boxShadow: '0 2px 4px rgba(255,88,56,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fff0ec', color: '#9c2b18', borderBottom: '1px solid #ffe4de', fontSize: '13px' }}>
                    <th style={{ padding: '16px' }}>Image</th>
                    <th style={{ padding: '16px' }}>Title & Type</th>
                    <th style={{ padding: '16px' }}>Location</th>
                    <th style={{ padding: '16px' }}>Details (Rooms/Floor)</th>
                    <th style={{ padding: '16px' }}>Price</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                        Listing များ မရှိသေးပါ။
                      </td>
                    </tr>
                  ) : (
                    listings.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#eee', border: '1px solid #ddd' }}>
                          <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>{item.title}</div>
                          <span style={{ backgroundColor: '#fff0ec', color: '#ff5838', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{item.propertyType}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#555', fontSize: '13px' }}>{item.township} ({item.sideOfYangon})</td>
                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '13px' }}>
                          {item.bedrooms}, {item.bathrooms}<br/>
                          <span style={{ fontSize: '11px', color: '#888' }}>{item.floor} | Pets: {item.petsAllowed}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#ff5838', fontWeight: 'bold', fontSize: '14px' }}>{Number(item.price).toLocaleString()} MMK</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button onClick={() => handleDeleteListing(item.id)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: USER ACTIVITY LOGS */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>👥 Active Users Log</h1>
                <p style={{ color: '#666', fontSize: '14px', marginTop: '6px' }}>Website ကို ဝင်ရောက်အသုံးပြုထားသော User များ၏ Email စာရင်း</p>
              </div>
              <button 
                onClick={handleClearUsers}
                style={{ backgroundColor: '#ff3b30', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Clear History
              </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #ffe4de', overflow: 'hidden', boxShadow: '0 2px 4px rgba(255,88,56,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fff0ec', color: '#9c2b18', borderBottom: '1px solid #ffe4de', fontSize: '13px' }}>
                    <th style={{ padding: '16px' }}>User Name</th>
                    <th style={{ padding: '16px' }}>Email Address</th>
                    <th style={{ padding: '16px' }}>Last Active Time</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                        ဝင်ရောက်အသုံးပြုထားသူ (User Logs) မရှိသေးပါ။
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                    	<tr key={u.id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                        <td style={{ padding: '16px', fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{u.name}</td>
                        <td style={{ padding: '16px', color: '#ff5838', fontWeight: '600', fontSize: '14px' }}>{u.email}</td>
                        <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>{u.lastActive}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                            {u.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
