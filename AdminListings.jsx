import React, { useState } from 'react';

export default function AdminListings() {
  const [listings, setListings] = useState([
    { id: 1, title: 'Modern Condo in Hlaing', price: '250000000', township: 'Hlaing', image: 'https://via.placeholder.com/150' }
  ]);
  const [formData, setFormData] = useState({ id: null, title: '', price: '', township: 'Hlaing', image: null, previewUrl: '' });
  const [isEditing, setIsEditing] = useState(false);

  // File ရွေးချယ်သည့်အခါ Preview ထုတ်ပြခြင်း
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file, previewUrl: URL.createObjectURL(file) });
    }
  };

  // Save/Submit (Add/Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setListings(listings.map(item => item.id === formData.id ? { ...formData, image: formData.previewUrl || item.image } : item));
      setIsEditing(false);
    } else {
      const newItem = { ...formData, id: Date.now(), image: formData.previewUrl || 'https://via.placeholder.com/150' };
      setListings([...listings, newItem]);
    }
    setFormData({ id: null, title: '', price: '', township: 'Hlaing', image: null, previewUrl: '' });
  };

  // Edit Button နှိပ်ပါက
  const handleEdit = (item) => {
    setFormData({ ...item, previewUrl: item.image });
    setIsEditing(true);
  };

  // Delete
  const handleDelete = (id) => {
    if (confirm("ဖျက်မှာ သေချာပါသလား။")) {
      setListings(listings.filter(item => item.id !== id));
    }
  };

  return (
    <div>
      <h3>{isEditing ? 'Edit Listing' : 'Add New Listing'}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', maxWidth: '500px', marginBottom: '30px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={inputStyle} />
        <input type="number" placeholder="Price (MMK)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={inputStyle} />
        
        {/* Media Upload */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Property Image:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {formData.previewUrl && <img src={formData.previewUrl} alt="Preview" style={{ width: '100px', height: '100px', marginTop: '10px', objectFit: 'cover' }} />}
        </div>

        <button type="submit" style={{ padding: '10px', backgroundColor: isEditing ? '#3182ce' : '#38a169', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isEditing ? 'Update Listing' : 'Save Listing'}
        </button>
      </form>

      {/* Listings Table */}
      <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#edf2f7', textAlign: 'left' }}>
            <th style={thTdStyle}>Image</th>
            <th style={thTdStyle}>Title</th>
            <th style={thTdStyle}>Price</th>
            <th style={thTdStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={thTdStyle}><img src={item.image} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover' }} /></td>
              <td style={thTdStyle}>{item.title}</td>
              <td style={thTdStyle}>{item.price} MMK</td>
              <td style={thTdStyle}>
                <button onClick={() => handleEdit(item)} style={{ marginRight: '10px', color: '#3182ce' }}>Edit</button>
                <button onClick={() => handleDelete(item.id)} style={{ color: '#e53e3e' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const thTdStyle = { padding: '12px' };