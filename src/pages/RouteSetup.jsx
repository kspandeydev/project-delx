import { useState, useEffect, useRef } from 'react';
import { routeService } from '../services/api.js';
import { auth } from '../config/firebase.js';

export default function RouteSetup({ onNavigate, onBack }) {
  const [step, setStep] = useState('start'); // start, end, schedule, confirm
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [maxWeight, setMaxWeight] = useState(3);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  const popularLocations = [
    { name: 'Koramangala', lat: 12.9279, lng: 77.6271, address: 'Koramangala, Bangalore' },
    { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, address: 'Indiranagar, Bangalore' },
    { name: 'Whitefield', lat: 12.9698, lng: 77.7500, address: 'Whitefield, Bangalore' },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
      attachAC('route-start-input', 'start');
      attachAC('route-end-input', 'end');
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
        ],
        disableDefaultUI: true,
      });

      mapInstance.current.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const geocoder = new window.google.maps.Geocoder();
        const type = step === 'start' ? 'start' : 'end';
        geocoder.geocode({ location: { lat, lng } }, (res) => {
          const addr = (res && res[0]) ? res[0].formatted_address.split(',')[0] : 'Selected';
          selectLocation({ lat, lng, address: addr }, type);
        });
      });
    }
  }, [step]);

  const selectLocation = (loc, type) => {
    if (type === 'start') {
      setStartAddress(loc.address);
      setStartCoords({ lat: loc.lat, lng: loc.lng });
      setStep('end');
    } else {
      setEndAddress(loc.address);
      setEndCoords({ lat: loc.lat, lng: loc.lng });
      setStep('schedule');
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
      await routeService.createRoute({
        commuterId: auth.currentUser?.uid,
        startLocation: { ...startCoords, address: startAddress },
        endLocation: { ...endCoords, address: endAddress },
        startTime, endTime, recurringDays: selectedDays, maxPackageWeight: maxWeight
      });
      setStep('confirm');
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="page animate-fadeIn" style={{ display: 'flex', flexDirection: 'column' }}>
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8))', pointerEvents: 'none', zIndex: 1 }} />

      <div className="page-header" style={{ position: 'relative', zIndex: 10, padding: '40px 24px' }}>
         <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: '20px', padding: '0' }}>← BACK</button>
         <h1 className="text-3xl font-display" style={{ fontWeight: 900 }}>PLAN ROUTE.</h1>
      </div>

      <div className="page-content" style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
        
        {step === 'start' && (
          <div className="glass-card animate-slideUp" style={{ padding: '32px' }}>
             <p className="text-xs" style={{ fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '12px' }}>DEPARTURE</p>
             <h2 className="text-xl font-display" style={{ fontWeight: 800, marginBottom: '24px' }}>Where do you start?</h2>
             <input id="route-start-input" className="input-field" placeholder="Search or tap map" value={startAddress} onChange={e => setStartAddress(e.target.value)} style={{ marginBottom: '24px' }} />
             <div className="flex gap-sm">
                {popularLocations.map(l => (
                  <button key={l.name} className="chip" onClick={() => selectLocation(l, 'start')}>{l.name}</button>
                ))}
             </div>
          </div>
        )}

        {step === 'end' && (
          <div className="glass-card animate-slideUp" style={{ padding: '32px' }}>
             <p className="text-xs" style={{ fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '12px' }}>DESTINATION</p>
             <h2 className="text-xl font-display" style={{ fontWeight: 800, marginBottom: '24px' }}>Where's the end?</h2>
             <input id="route-end-input" className="input-field" placeholder="Drop-off point" value={endAddress} onChange={e => setEndAddress(e.target.value)} style={{ marginBottom: '24px' }} />
             <div className="flex gap-sm">
                {popularLocations.map(l => (
                  <button key={l.name} className="chip" onClick={() => selectLocation(l, 'end')}>{l.name}</button>
                ))}
             </div>
          </div>
        )}

        {step === 'schedule' && (
          <div className="glass-card animate-slideUp" style={{ padding: '32px' }}>
             <p className="text-xs" style={{ fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '12px' }}>SCHEDULE</p>
             <h2 className="text-xl font-display" style={{ fontWeight: 800, marginBottom: '24px' }}>Timing & Days</h2>
             
             <div className="flex flex-col gap-md">
                <div className="flex gap-sm">
                   <div style={{ flex: 1 }}>
                      <label className="text-xs" style={{ fontWeight: 800, opacity: 0.5 }}>DEPART</label>
                      <input className="input-field" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                   </div>
                   <div style={{ flex: 1 }}>
                      <label className="text-xs" style={{ fontWeight: 800, opacity: 0.5 }}>ARRIVE</label>
                      <input className="input-field" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                   </div>
                </div>

                <div className="flex flex-wrap gap-xs">
                   {days.map(d => (
                     <button key={d} className={`day-chip ${selectedDays.includes(d) ? 'active' : ''}`} 
                             onClick={() => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}>
                        {d[0]}
                     </button>
                   ))}
                </div>

                <div style={{ marginTop: '12px' }}>
                   <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                      <span className="text-xs" style={{ fontWeight: 800 }}>MAX WEIGHT</span>
                      <span className="text-xs" style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{maxWeight} KG</span>
                   </div>
                   <input type="range" min="1" max="10" value={maxWeight} onChange={e => setMaxWeight(parseInt(e.target.value))} 
                          style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                </div>

                <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading || selectedDays.length === 0}>
                   {loading ? 'SETTING UP...' : 'LOCK IN ROUTE'}
                </button>
             </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="glass-card animate-scaleIn" style={{ padding: '48px 32px', textAlign: 'center' }}>
             <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🛣️</div>
             <h2 className="text-2xl font-display" style={{ fontWeight: 900, marginBottom: '12px' }}>ROUTE LOCKED.</h2>
             <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>We'll notify you when a package matches your vibe.</p>
             <button className="btn btn-primary btn-full" onClick={() => onNavigate('dashboard')}>GO TO DASHBOARD</button>
          </div>
        )}

      </div>

      <style>{`
        .chip { border: 1px solid var(--border-subtle); background: var(--bg-glass); color: var(--text-secondary); font-size: 0.7rem; font-weight: 800; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; }
        .day-chip { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-glass); border: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.8rem; font-weight: 800; }
        .day-chip.active { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); }
      `}</style>
    </div>
  );
}
