import { useState, useRef, useEffect } from 'react';
import { deliveryService } from '../services/api.js';

export default function DeliveryRequest({ onNavigate, onBack }) {
  const [step, setStep] = useState('pickup'); // pickup, dropoff, details, confirm
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [packageDesc, setPackageDesc] = useState('');
  const [weight, setWeight] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const categories = [
    { id: 'docs', label: 'Documents', emoji: '📄' },
    { id: 'electronics', label: 'Electronics', emoji: '💻' },
    { id: 'food', label: 'Food', emoji: '🍱' },
    { id: 'clothes', label: 'Clothes', emoji: '👕' },
    { id: 'books', label: 'Books', emoji: '📚' },
    { id: 'gift', label: 'Gift', emoji: '🎁' },
    { id: 'medicine', label: 'Medicine', emoji: '💊' },
    { id: 'other', label: 'Other', emoji: '📦' },
  ];

  const quickLocations = [
    { name: 'Koramangala', lat: 12.9279, lng: 77.6271, address: 'Koramangala, Bangalore' },
    { name: 'Whitefield', lat: 12.9698, lng: 77.7500, address: 'Whitefield, Bangalore' },
    { name: 'HSR Layout', lat: 12.9116, lng: 77.6389, address: 'HSR Layout, Bangalore' },
    { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, address: 'Indiranagar, Bangalore' },
    { name: 'Electronic City', lat: 12.8399, lng: 77.6770, address: 'Electronic City, Bangalore' },
    { name: 'BTM Layout', lat: 12.9166, lng: 77.6101, address: 'BTM Layout, Bangalore' },
  ];

  useEffect(() => {
    if (mapRef.current && window.google && !mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 12.9716, lng: 77.5946 },
        zoom: 12,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0f' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });
    }
  }, []);

  const selectLocation = (loc, type) => {
    if (type === 'pickup') {
      setPickupAddress(loc.address);
      setPickupCoords({ lat: loc.lat, lng: loc.lng });
      setStep('dropoff');
    } else {
      setDropoffAddress(loc.address);
      setDropoffCoords({ lat: loc.lat, lng: loc.lng });
      setStep('details');
    }
    if (mapInstance.current && window.google) {
      new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE, scale: 10,
          fillColor: type === 'pickup' ? '#10b981' : '#ec4899',
          fillOpacity: 1, strokeWeight: 3,
          strokeColor: type === 'pickup' ? '#059669' : '#db2777',
        }
      });
      mapInstance.current.panTo({ lat: loc.lat, lng: loc.lng });
    }
  };

  const handleSubmit = async () => {
    if (!packageDesc || !weight || !category) return;
    setLoading(true);
    try {
      await deliveryService.createDelivery({
        senderId: 'current_user',
        senderName: 'You',
        pickupLocation: { ...pickupCoords, address: pickupAddress },
        dropoffLocation: { ...dropoffCoords, address: dropoffAddress },
        packageDescription: `${categories.find(c=>c.id===category)?.emoji} ${packageDesc}`,
        weight: parseFloat(weight),
        category,
        price: Math.floor(20 + parseFloat(weight) * 15 + Math.random() * 30),
      });
      setStep('confirm');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-md">
          <button className="btn-icon btn-secondary" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="page-title font-display">
            {step === 'confirm' ? 'Request Sent!' : 'Send a Package'}
          </h1>
        </div>
      </div>

      <div className="page-content">
        {/* Map */}
        <div className="map-container animate-fadeIn" ref={mapRef} style={{ marginBottom: '24px' }}>
          {!window.google && (
            <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              <span style={{fontSize:'2rem'}}>📦</span>
              <p className="text-sm" style={{color:'var(--text-muted)'}}>Map loading...</p>
            </div>
          )}
        </div>

        {/* Pickup Location */}
        {step === 'pickup' && (
          <div className="animate-slideUp">
            <h2 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '4px' }}>
              Pickup Location 📍
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Where should the commuter pick up your package?
            </p>
            <input
              type="text" className="input-field"
              placeholder="Search for a location..."
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
              {quickLocations.map(loc => (
                <button key={loc.name} className="location-chip-sm" onClick={() => selectLocation(loc, 'pickup')}>
                  📍 {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dropoff Location */}
        {step === 'dropoff' && (
          <div className="animate-slideUp">
            <div className="glass-card" style={{padding:'12px 16px',marginBottom:'16px',display:'flex',flexDirection:'column',gap:'4px'}}>
              <span className="text-xs" style={{color:'var(--accent-green)'}}>PICKUP</span>
              <span className="text-sm" style={{fontWeight:500}}>{pickupAddress}</span>
            </div>
            <h2 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '4px' }}>
              Drop-off Location 🏁
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Where should the package be delivered?
            </p>
            <input
              type="text" className="input-field"
              placeholder="Search for a location..."
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
              {quickLocations.filter(l => l.address !== pickupAddress).map(loc => (
                <button key={loc.name} className="location-chip-sm" onClick={() => selectLocation(loc, 'dropoff')}>
                  🏁 {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Package Details */}
        {step === 'details' && (
          <div className="animate-slideUp">
            <div className="delivery-card" style={{marginBottom:'24px'}}>
              <div className="delivery-route">
                <div className="delivery-route-line">
                  <div className="route-dot start" />
                  <div className="route-line" />
                  <div className="route-dot end" />
                </div>
                <div className="delivery-locations">
                  <div className="delivery-location"><div className="delivery-location-label">Pickup</div><div className="truncate">{pickupAddress}</div></div>
                  <div className="delivery-location"><div className="delivery-location-label">Drop-off</div><div className="truncate">{dropoffAddress}</div></div>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '16px' }}>
              Package Details 📦
            </h2>

            <div style={{marginBottom:'20px'}}>
              <label className="input-label" style={{marginBottom:'10px',display:'block'}}>Category</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-chip ${category === cat.id ? 'active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <span style={{fontSize:'1.2rem'}}>{cat.emoji}</span>
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group" style={{marginBottom:'16px'}}>
              <label className="input-label">What's in the package?</label>
              <input
                type="text" className="input-field"
                placeholder="e.g., Laptop charger and cables"
                value={packageDesc}
                onChange={(e) => setPackageDesc(e.target.value)}
              />
            </div>

            <div className="input-group" style={{marginBottom:'32px'}}>
              <label className="input-label">Weight (kg)</label>
              <input
                type="number" className="input-field"
                placeholder="Approximate weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="0.1" max="10" step="0.1"
              />
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleSubmit}
              disabled={loading || !packageDesc || !weight || !category}
            >
              {loading ? '...' : 'Find Commuters →'}
            </button>
          </div>
        )}

        {/* Confirmation */}
        {step === 'confirm' && (
          <div className="animate-scaleIn text-center" style={{padding:'32px 0'}}>
            <div style={{fontSize:'4rem',marginBottom:'16px'}}>🎉</div>
            <h2 className="text-2xl font-display" style={{fontWeight:700,marginBottom:'8px'}}>Request Sent!</h2>
            <p className="text-sm" style={{color:'var(--text-muted)',marginBottom:'24px'}}>
              We're matching you with commuters going your way. You'll be notified when someone accepts!
            </p>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => onNavigate('matching')}>
              View Matches
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => onNavigate('dashboard')} style={{marginTop:'12px'}}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      <style>{`
        .location-chip-sm {
          padding: 8px 14px; border-radius: var(--radius-full); font-size: 0.8rem;
          background: var(--bg-glass); border: 1px solid var(--border-subtle);
          color: var(--text-secondary); transition: all var(--transition-smooth); cursor: pointer;
        }
        .location-chip-sm:hover { background: var(--bg-glass-hover); border-color: var(--border-accent); color: var(--text-primary); }
        .category-chip {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 14px 8px; border-radius: var(--radius-md);
          background: var(--bg-glass); border: 1px solid var(--border-subtle);
          transition: all var(--transition-smooth); cursor: pointer; color: var(--text-secondary);
        }
        .category-chip.active {
          border-color: var(--accent-purple); background: rgba(168,85,247,0.08);
          color: var(--text-primary); box-shadow: var(--shadow-glow-purple);
        }
        .category-chip:hover { border-color: var(--border-light); }
      `}</style>
    </div>
  );
}
