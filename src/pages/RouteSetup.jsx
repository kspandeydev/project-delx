import { useState, useEffect, useRef, useCallback } from 'react';
import { routeService } from '../services/api.js';

export default function RouteSetup({ onNavigate, onBack }) {
  const [step, setStep] = useState('start'); // start, end, schedule, confirm
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [maxWeight, setMaxWeight] = useState(3);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  const blrCenter = { lat: 12.9716, lng: 77.5946 };

  const popularLocations = [
    { name: 'Koramangala', lat: 12.9279, lng: 77.6271, address: 'Koramangala, Bangalore' },
    { name: 'Whitefield', lat: 12.9698, lng: 77.7500, address: 'Whitefield, Bangalore' },
    { name: 'Electronic City', lat: 12.8399, lng: 77.6770, address: 'Electronic City, Bangalore' },
    { name: 'Manyata Tech Park', lat: 13.0462, lng: 77.6214, address: 'Manyata Tech Park, Bangalore' },
    { name: 'HSR Layout', lat: 12.9116, lng: 77.6389, address: 'HSR Layout, Bangalore' },
    { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, address: 'Indiranagar, Bangalore' },
    { name: 'MG Road', lat: 12.9756, lng: 77.6066, address: 'MG Road, Bangalore' },
    { name: 'BTM Layout', lat: 12.9166, lng: 77.6101, address: 'BTM Layout, Bangalore' },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (mapRef.current && window.google && !mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: blrCenter,
        zoom: 12,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0f' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
          { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#12121a' }] },
          { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
      });
      setMapReady(true);
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

    if (mapInstance.current && window.google) {
      new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: type === 'start' ? '#10b981' : '#ec4899',
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: type === 'start' ? '#059669' : '#db2777',
        }
      });
      mapInstance.current.panTo({ lat: loc.lat, lng: loc.lng });
      mapInstance.current.setZoom(14);
    }
  };

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await routeService.createRoute({
        startLocation: { ...startCoords, address: startAddress },
        endLocation: { ...endCoords, address: endAddress },
        startTime,
        endTime,
        recurringDays: selectedDays,
        maxPackageWeight: maxWeight,
        commuterId: 'current_user',
        commuterName: 'You',
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
            {step === 'confirm' ? 'Route Created!' : 'Set Your Route'}
          </h1>
        </div>
        {step !== 'confirm' && (
          <div className="route-steps">
            <div className={`route-step ${step === 'start' ? 'active' : (step !== 'start' ? 'done' : '')}`}>1</div>
            <div className="route-step-line" />
            <div className={`route-step ${step === 'end' ? 'active' : (['schedule', 'confirm'].includes(step) ? 'done' : '')}`}>2</div>
            <div className="route-step-line" />
            <div className={`route-step ${step === 'schedule' ? 'active' : (step === 'confirm' ? 'done' : '')}`}>3</div>
          </div>
        )}
      </div>

      <div className="page-content">
        {/* Map */}
        <div className="map-container animate-fadeIn" ref={mapRef} style={{ marginBottom: '24px' }}>
          {!window.google && (
            <div className="map-placeholder">
              <span style={{ fontSize: '2rem' }}>🗺️</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Map loading...</p>
            </div>
          )}
        </div>

        {/* Start Location */}
        {step === 'start' && (
          <div className="animate-slideUp">
            <h2 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '4px' }}>
              Where do you start? 📍
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Your commute starting point
            </p>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search or pick from popular spots"
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
              />
            </div>

            <div className="section-title" style={{ marginBottom: '12px' }}>Popular in Bangalore</div>
            <div className="location-grid">
              {popularLocations.map(loc => (
                <button key={loc.name} className="location-chip" onClick={() => selectLocation(loc, 'start')}>
                  <span>📍</span>
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* End Location */}
        {step === 'end' && (
          <div className="animate-slideUp">
            <div className="selected-location glass-card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
              <span className="text-xs" style={{ color: 'var(--accent-green)' }}>FROM</span>
              <span className="text-sm" style={{ fontWeight: 500 }}>{startAddress}</span>
            </div>

            <h2 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '4px' }}>
              Where do you go? 🏁
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Your destination
            </p>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search or pick from popular spots"
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
              />
            </div>

            <div className="location-grid">
              {popularLocations.filter(l => l.address !== startAddress).map(loc => (
                <button key={loc.name} className="location-chip" onClick={() => selectLocation(loc, 'end')}>
                  <span>🏁</span>
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        {step === 'schedule' && (
          <div className="animate-slideUp">
            <div className="route-summary glass-card" style={{ padding: '16px', marginBottom: '24px' }}>
              <div className="delivery-route">
                <div className="delivery-route-line">
                  <div className="route-dot start" />
                  <div className="route-line" />
                  <div className="route-dot end" />
                </div>
                <div className="delivery-locations">
                  <div className="delivery-location"><div className="truncate">{startAddress}</div></div>
                  <div className="delivery-location"><div className="truncate">{endAddress}</div></div>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '16px' }}>
              Schedule & Preferences ⏰
            </h2>

            <div className="flex gap-md" style={{ marginBottom: '24px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Depart</label>
                <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Arrive by</label>
                <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="input-label" style={{ marginBottom: '12px', display: 'block' }}>Recurring Days</label>
              <div className="days-grid">
                {days.map(day => (
                  <button
                    key={day}
                    className={`day-chip ${selectedDays.includes(day) ? 'active' : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label className="input-label" style={{ marginBottom: '12px', display: 'block' }}>
                Max Package Weight: <strong style={{ color: 'var(--text-primary)' }}>{maxWeight} kg</strong>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={maxWeight}
                onChange={(e) => setMaxWeight(parseInt(e.target.value))}
                className="weight-slider"
              />
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>1 kg</span><span>10 kg</span>
              </div>
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading || selectedDays.length === 0}>
              {loading ? <span className="btn-spinner" style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.6s linear infinite'}} /> : 'Create Route 🚀'}
            </button>
          </div>
        )}

        {/* Confirmation */}
        {step === 'confirm' && (
          <div className="animate-scaleIn text-center" style={{ padding: '32px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
            <h2 className="text-2xl font-display" style={{ fontWeight: 700, marginBottom: '8px' }}>
              Route Created!
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              You'll now receive delivery requests that match your commute. Earn while you travel!
            </p>

            <div className="route-summary glass-card" style={{ padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
              <div className="delivery-route">
                <div className="delivery-route-line">
                  <div className="route-dot start" />
                  <div className="route-line" />
                  <div className="route-dot end" />
                </div>
                <div className="delivery-locations">
                  <div className="delivery-location">
                    <div className="delivery-location-label">From</div>
                    <div>{startAddress}</div>
                  </div>
                  <div className="delivery-location">
                    <div className="delivery-location-label">To</div>
                    <div>{endAddress}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-sm" style={{ marginTop: '12px', flexWrap: 'wrap' }}>
                <span className="chip chip-blue">{startTime} - {endTime}</span>
                {selectedDays.map(d => <span key={d} className="chip chip-purple" style={{padding:'2px 8px',fontSize:'0.65rem'}}>{d}</span>)}
              </div>
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={() => onNavigate('dashboard')}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

      <style>{`
        .route-steps {
          display: flex; align-items: center; gap: 8px; margin-top: 12px;
        }
        .route-step {
          width: 28px; height: 28px; border-radius: 50%; font-size: 0.75rem; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-glass); border: 1px solid var(--border-subtle); color: var(--text-muted);
          transition: all var(--transition-smooth);
        }
        .route-step.active { background: var(--gradient-primary); color: white; border-color: transparent; box-shadow: var(--shadow-glow-purple); }
        .route-step.done { background: var(--accent-green); color: white; border-color: transparent; }
        .route-step-line { width: 24px; height: 2px; background: var(--border-subtle); }
        .location-grid {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .location-chip {
          display: flex; align-items: center; gap: 6px; padding: 10px 16px;
          border-radius: var(--radius-full); background: var(--bg-glass);
          border: 1px solid var(--border-subtle); font-size: 0.85rem;
          color: var(--text-secondary); transition: all var(--transition-smooth);
          cursor: pointer;
        }
        .location-chip:hover { background: var(--bg-glass-hover); border-color: var(--border-accent); color: var(--text-primary); }
        .days-grid { display: flex; gap: 8px; flex-wrap: wrap; }
        .day-chip {
          padding: 10px 14px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 500;
          background: var(--bg-glass); border: 1px solid var(--border-subtle); color: var(--text-muted);
          transition: all var(--transition-smooth); cursor: pointer;
        }
        .day-chip.active { background: var(--gradient-primary); color: white; border-color: transparent; box-shadow: var(--shadow-glow-purple); }
        .weight-slider {
          width: 100%; appearance: none; -webkit-appearance: none;
          height: 4px; border-radius: 2px; background: var(--bg-tertiary); outline: none;
        }
        .weight-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
          background: var(--gradient-primary); cursor: pointer; box-shadow: var(--shadow-glow-purple);
        }
        .map-placeholder {
          width: 100%; height: 100%; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
        }
        .selected-location { display: flex; flex-direction: column; gap: 4px; }
      `}</style>
    </div>
  );
}
