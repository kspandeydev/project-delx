import { useState, useRef, useEffect } from 'react';
import { deliveryService, paymentService } from '../services/api.js';
import { auth } from '../config/firebase.js';

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
    { id: 'docs', label: 'Docs', emoji: '📄' },
    { id: 'electronics', label: 'Tech', emoji: '💻' },
    { id: 'food', label: 'Food', emoji: '🍱' },
    { id: 'clothes', label: 'Fits', emoji: '👕' },
    { id: 'books', label: 'Books', emoji: '📚' },
    { id: 'gift', label: 'Gift', emoji: '🎁' },
    { id: 'medicine', label: 'Meds', emoji: '💊' },
    { id: 'other', label: 'Misc', emoji: '📦' },
  ];

  const quickLocations = [
    { name: 'Koramangala', lat: 12.9279, lng: 77.6271, address: 'Koramangala, Bangalore' },
    { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, address: 'Indiranagar, Bangalore' },
    { name: 'HSR Layout', lat: 12.9116, lng: 77.6389, address: 'HSR Layout, Bangalore' },
  ];

  useEffect(() => {
    if (window.google) {
      const attachAC = (id, type) => {
        const el = document.getElementById(id);
        if (el && !el.hasAttribute('data-ac')) {
          const ac = new window.google.maps.places.Autocomplete(el);
          ac.addListener('place_changed', () => {
             const place = ac.getPlace();
             if (place.geometry) {
               selectLocation({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng(), address: place.formatted_address }, type);
             }
          });
          el.setAttribute('data-ac', 'true');
        }
      };
      attachAC('del-pickup-input', 'pickup');
      attachAC('del-dropoff-input', 'dropoff');
    }

    if (mapRef.current && window.google && !mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 12.9716, lng: 77.5946 },
        zoom: 13,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#000000' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#111827' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        ],
        disableDefaultUI: true,
      });

      mapInstance.current.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const geocoder = new window.google.maps.Geocoder();
        const type = step === 'pickup' ? 'pickup' : 'dropoff';
        geocoder.geocode({ location: { lat, lng } }, (res) => {
          const addr = (res && res[0]) ? res[0].formatted_address.split(',')[0] : 'Selected Location';
          selectLocation({ lat, lng, address: addr }, type);
        });
      });
    }
  }, [step]);

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
    if (window.google) {
      new window.google.maps.Marker({
        position: loc,
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE, scale: 8,
          fillColor: '#d4ff00', fillOpacity: 1, strokeWeight: 2, strokeColor: '#000'
        }
      });
      mapInstance.current.panTo(loc);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const price = Math.floor(40 + Math.random() * 60);
      const deliveryData = {
        pickupLocation: { ...pickupCoords, address: pickupAddress },
        dropoffLocation: { ...dropoffCoords, address: dropoffAddress },
        packageDescription: packageDesc,
        weight: parseFloat(weight),
        category,
        price
      };

      const order = await paymentService.createOrder(price, 'temp_id');
      paymentService.openPayment(order, 
        async (res) => {
          try {
            const created = await deliveryService.createDelivery(deliveryData);
            await paymentService.recordTransaction({
              userId: auth.currentUser?.uid,
              amount: price,
              type: 'debit',
              description: 'Payment for delivery ' + created.id
            });
            setStep('confirm');
          } catch(err) { console.error(err); }
          setLoading(false);
        },
        (err) => {
          console.error('Payment failed', err);
          alert('Payment was cancelled or failed.');
          setLoading(false);
        }
      );
    } catch (e) { 
      console.error(e); 
      setLoading(false);
    }
  };

  return (
    <div className="page animate-fadeIn" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Absolute Map Layer */}
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8))', pointerEvents: 'none', zIndex: 1 }} />

      {/* Content Overlay */}
      <div className="page-header" style={{ position: 'relative', zIndex: 10, padding: '40px 24px' }}>
         <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: '20px', padding: '0' }}>← BACK</button>
         <h1 className="text-3xl font-display" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
           {step === 'confirm' ? 'LIT! 🔥' : 'SEND IT.'}
         </h1>
      </div>

      <div className="page-content" style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
        
        {step === 'pickup' && (
          <div className="glass-card animate-slideUp" style={{ padding: '32px' }}>
             <p className="text-xs" style={{ fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '12px' }}>STEP 01/03</p>
             <h2 className="text-xl font-display" style={{ fontWeight: 800, marginBottom: '24px' }}>Where's the pickup?</h2>
             <input id="del-pickup-input" className="input-field" placeholder="Search address or tap map" value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} style={{ marginBottom: '24px' }} />
             <div className="flex gap-sm">
                {quickLocations.map(l => (
                  <button key={l.name} className="chip" onClick={() => selectLocation(l, 'pickup')}>{l.name}</button>
                ))}
             </div>
          </div>
        )}

        {step === 'dropoff' && (
          <div className="glass-card animate-slideUp" style={{ padding: '32px' }}>
             <p className="text-xs" style={{ fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '12px' }}>STEP 02/03</p>
             <h2 className="text-xl font-display" style={{ fontWeight: 800, marginBottom: '24px' }}>Where's it going?</h2>
             <input id="del-dropoff-input" className="input-field" placeholder="Drop-off point" value={dropoffAddress} onChange={e => setDropoffAddress(e.target.value)} style={{ marginBottom: '24px' }} />
             <div className="flex gap-sm">
                {quickLocations.map(l => (
                  <button key={l.name} className="chip" onClick={() => selectLocation(l, 'dropoff')}>{l.name}</button>
                ))}
             </div>
          </div>
        )}

        {step === 'details' && (
          <div className="glass-card animate-slideUp" style={{ padding: '32px' }}>
             <p className="text-xs" style={{ fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '12px' }}>FINAL STEP</p>
             <h2 className="text-xl font-display" style={{ fontWeight: 800, marginBottom: '24px' }}>Package Details</h2>
             
             <div className="flex flex-col gap-md">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                   {categories.map(c => (
                     <button key={c.id} className={`glass-card ${category === c.id ? 'active' : ''}`} 
                             onClick={() => setCategory(c.id)} style={{ padding: '12px 4px', textAlign: 'center', border: category === c.id ? '1px solid var(--accent-primary)' : '1px solid transparent' }}>
                        <div style={{ fontSize: '1.2rem' }}>{c.emoji}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, marginTop: '4px' }}>{c.label}</div>
                     </button>
                   ))}
                </div>
                <input className="input-field" placeholder="What's inside?" value={packageDesc} onChange={e => setPackageDesc(e.target.value)} />
                <input className="input-field" type="number" placeholder="Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} />
                <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading || !packageDesc || !weight || !category}>
                   {loading ? 'SENDING...' : 'CONFIRM REQUEST'}
                </button>
             </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="glass-card animate-scaleIn" style={{ padding: '48px 32px', textAlign: 'center' }}>
             <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🚀</div>
             <h2 className="text-2xl font-display" style={{ fontWeight: 900, marginBottom: '12px' }}>REQUEST LIVE</h2>
             <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Commuters are being notified. Sit tight!</p>
             <div className="flex flex-col gap-sm">
                <button className="btn btn-primary btn-full" onClick={() => onNavigate('matching')}>VIEW MATCHES</button>
                <button className="btn btn-ghost btn-full" onClick={() => onNavigate('dashboard')}>DASHBOARD</button>
             </div>
          </div>
        )}

      </div>

      <style>{`
        .chip { border: 1px solid var(--border-subtle); background: var(--bg-glass); color: var(--text-secondary); font-size: 0.7rem; font-weight: 800; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; }
        .chip:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
      `}</style>
    </div>
  );
}
