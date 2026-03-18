import { useState, useEffect, useRef } from 'react';
import { deliveryService } from '../services/api.js';

export default function TrackingPage({ deliveryId, onNavigate, onBack }) {
  const [delivery, setDelivery] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpType, setOtpType] = useState('pickup'); // pickup or delivery
  const [otpError, setOtpError] = useState('');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [eta, setEta] = useState('12 min');

  useEffect(() => {
    const deliveries = deliveryService.getDeliveries();
    const found = deliveries.find(d => d.id === deliveryId) || deliveries[0];
    setDelivery(found);
  }, [deliveryId]);

  useEffect(() => {
    if (mapRef.current && window.google && delivery && !mapInstance.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: delivery.pickupLocation || { lat: 12.9716, lng: 77.5946 },
        zoom: 13,
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
      mapInstance.current = map;

      if (delivery.pickupLocation) {
        new window.google.maps.Marker({
          position: delivery.pickupLocation, map,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#10b981', fillOpacity: 1, strokeWeight: 3, strokeColor: '#059669' }
        });
      }
      if (delivery.dropoffLocation) {
        new window.google.maps.Marker({
          position: delivery.dropoffLocation, map,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#ec4899', fillOpacity: 1, strokeWeight: 3, strokeColor: '#db2777' }
        });
      }

      // Animate a moving marker for in-transit
      if (delivery.status === 'in_transit' && delivery.pickupLocation && delivery.dropoffLocation) {
        const movingMarker = new window.google.maps.Marker({
          position: delivery.pickupLocation, map,
          icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: '#a855f7', fillOpacity: 1, strokeWeight: 2, strokeColor: '#7c3aed', rotation: 45 }
        });
        let progress = 0;
        const animate = () => {
          progress += 0.002;
          if (progress > 1) progress = 0;
          const lat = delivery.pickupLocation.lat + (delivery.dropoffLocation.lat - delivery.pickupLocation.lat) * progress;
          const lng = delivery.pickupLocation.lng + (delivery.dropoffLocation.lng - delivery.pickupLocation.lng) * progress;
          movingMarker.setPosition({ lat, lng });
          requestAnimationFrame(animate);
        };
        animate();

        // Draw route path
        new window.google.maps.Polyline({
          path: [delivery.pickupLocation, delivery.dropoffLocation],
          map,
          strokeColor: '#a855f7',
          strokeOpacity: 0.6,
          strokeWeight: 3,
          geodesic: true,
        });

        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(delivery.pickupLocation);
        bounds.extend(delivery.dropoffLocation);
        map.fitBounds(bounds, 60);
      }
    }
  }, [delivery]);

  // ETA countdown
  useEffect(() => {
    if (delivery?.status === 'in_transit') {
      let mins = 12;
      const interval = setInterval(() => {
        mins = Math.max(0, mins - 1);
        setEta(`${mins} min`);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [delivery]);

  const handleVerifyOtp = () => {
    const correctOtp = otpType === 'pickup' ? delivery.pickupOtp : delivery.deliveryOtp;
    if (otpInput === correctOtp) {
      const newStatus = otpType === 'pickup' ? 'in_transit' : 'delivered';
      deliveryService.updateDeliveryStatus(delivery.id, newStatus);
      setDelivery({ ...delivery, status: newStatus });
      setShowOtpModal(false);
      setOtpInput('');
      setOtpError('');
    } else {
      setOtpError('Invalid OTP');
    }
  };

  const getStatusSteps = () => [
    { key: 'requested', label: 'Requested', emoji: '📝' },
    { key: 'matched', label: 'Matched', emoji: '🤝' },
    { key: 'picked_up', label: 'Picked Up', emoji: '📦' },
    { key: 'in_transit', label: 'In Transit', emoji: '🚀' },
    { key: 'delivered', label: 'Delivered', emoji: '✅' },
  ];

  const statusSteps = getStatusSteps();
  const currentStepIdx = statusSteps.findIndex(s => s.key === delivery?.status);

  if (!delivery) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="flex items-center gap-md">
            <button className="btn-icon btn-secondary" onClick={onBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <h1 className="page-title font-display">Tracking</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active deliveries to track</p>
            <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>Go to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <button className="btn-icon btn-secondary" onClick={onBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <h1 className="page-title font-display">Live Tracking</h1>
          </div>
          {delivery.status === 'in_transit' && (
            <div className="eta-badge animate-fadeIn">
              <span className="status-dot active" />
              <span className="font-display" style={{ fontWeight: 700, color: 'var(--accent-green)' }}>ETA {eta}</span>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Map */}
        <div className="map-container map-container-large animate-fadeIn" ref={mapRef} style={{ marginBottom: '24px' }}>
          {!window.google && (
            <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              <span style={{fontSize:'2rem'}}>🗺️</span>
              <p className="text-sm" style={{color:'var(--text-muted)'}}>Map loading...</p>
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <div className="tracking-timeline glass-card animate-fadeIn stagger-1" style={{ padding: '20px', marginBottom: '24px' }}>
          <div className="timeline-steps">
            {statusSteps.map((s, i) => (
              <div key={s.key} className={`timeline-step ${i <= currentStepIdx ? 'completed' : ''} ${i === currentStepIdx ? 'current' : ''}`}>
                <div className="timeline-dot">
                  {i <= currentStepIdx ? s.emoji : <span style={{ opacity: 0.3 }}>{s.emoji}</span>}
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`timeline-line ${i < currentStepIdx ? 'filled' : ''}`} />
                )}
                <span className="timeline-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="delivery-card animate-fadeIn stagger-2" style={{ marginBottom: '24px' }}>
          <div className="delivery-route">
            <div className="delivery-route-line">
              <div className="route-dot start" />
              <div className="route-line" />
              <div className="route-dot end" />
            </div>
            <div className="delivery-locations">
              <div className="delivery-location">
                <div className="delivery-location-label">Pickup</div>
                <div>{delivery.pickupLocation?.address}</div>
              </div>
              <div className="delivery-location">
                <div className="delivery-location-label">Drop-off</div>
                <div>{delivery.dropoffLocation?.address}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: '16px' }}>
            <span className="chip chip-blue">📦 {delivery.packageDescription}</span>
            <span className="text-base font-display" style={{ fontWeight: 700, color: 'var(--accent-green)' }}>₹{delivery.price}</span>
          </div>
        </div>

        {/* Commuter Info */}
        {delivery.commuterName && delivery.commuterName !== 'You' && (
          <div className="glass-card animate-fadeIn stagger-3" style={{ padding: '16px', marginBottom: '24px' }}>
            <div className="flex items-center gap-md">
              <div className="avatar avatar-ring">{delivery.commuterName[0]}</div>
              <div style={{ flex: 1 }}>
                <div className="text-base" style={{ fontWeight: 600 }}>{delivery.commuterName}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Your commuter</div>
              </div>
              <button className="btn btn-secondary btn-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                Call
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="animate-fadeIn stagger-4">
          {delivery.status === 'matched' && (
            <button className="btn btn-primary btn-full btn-lg" onClick={() => { setOtpType('pickup'); setShowOtpModal(true); }}>
              Verify Pickup OTP
            </button>
          )}
          {delivery.status === 'in_transit' && (
            <button className="btn btn-primary btn-full btn-lg" onClick={() => { setOtpType('delivery'); setShowOtpModal(true); }}>
              Verify Delivery OTP
            </button>
          )}
          {delivery.status === 'delivered' && (
            <div className="text-center">
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
              <h3 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '8px' }}>Delivered Successfully!</h3>
              <button className="btn btn-primary btn-lg" onClick={() => onNavigate('dashboard')} style={{ marginTop: '16px' }}>
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="otp-modal-overlay" onClick={() => setShowOtpModal(false)}>
          <div className="otp-modal glass-card animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display" style={{ fontWeight: 600, marginBottom: '4px' }}>
              {otpType === 'pickup' ? 'Pickup' : 'Delivery'} Verification
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Enter the 4-digit OTP to confirm {otpType}
            </p>

            <div className="text-xs" style={{ color: 'var(--accent-purple)', marginBottom: '8px', textAlign: 'center' }}>
              Demo OTP: <strong>{otpType === 'pickup' ? delivery.pickupOtp : delivery.deliveryOtp}</strong>
            </div>

            <div className="otp-container" style={{ marginBottom: '16px' }}>
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  type="tel"
                  className="otp-input"
                  maxLength={1}
                  value={otpInput[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !/^\d$/.test(val)) return;
                    const newOtp = otpInput.split('');
                    newOtp[i] = val;
                    setOtpInput(newOtp.join(''));
                    if (val && i < 3) {
                      e.target.nextElementSibling?.focus();
                    }
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {otpError && <p style={{ color: 'var(--accent-pink)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '12px' }}>{otpError}</p>}

            <button className="btn btn-primary btn-full" onClick={handleVerifyOtp} disabled={otpInput.length < 4}>
              Verify
            </button>
          </div>
        </div>
      )}

      <style>{`
        .eta-badge {
          display: flex; align-items: center; gap: 8px; padding: 6px 14px;
          border-radius: var(--radius-full); background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
        }
        .tracking-timeline { overflow-x: auto; }
        .timeline-steps {
          display: flex; align-items: flex-start; gap: 0; min-width: max-content;
        }
        .timeline-step {
          display: flex; flex-direction: column; align-items: center; position: relative;
          flex: 1; min-width: 70px;
        }
        .timeline-dot {
          width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; background: var(--bg-glass); border: 2px solid var(--border-subtle);
          font-size: 1rem; position: relative; z-index: 2; transition: all var(--transition-smooth);
        }
        .timeline-step.completed .timeline-dot { border-color: var(--accent-purple); background: rgba(168,85,247,0.1); }
        .timeline-step.current .timeline-dot { border-color: var(--accent-green); background: rgba(16,185,129,0.1); box-shadow: 0 0 12px var(--accent-green-glow); }
        .timeline-line {
          position: absolute; top: 18px; left: 50%; width: 100%; height: 2px;
          background: var(--border-subtle); z-index: 1;
        }
        .timeline-line.filled { background: var(--gradient-primary); }
        .timeline-label {
          font-size: 0.65rem; color: var(--text-muted); margin-top: 8px; text-align: center;
        }
        .timeline-step.completed .timeline-label { color: var(--text-secondary); }
        .timeline-step.current .timeline-label { color: var(--accent-green); font-weight: 600; }
        .otp-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 24px;
        }
        .otp-modal {
          width: 100%; max-width: 380px; padding: 32px; text-align: center;
        }
      `}</style>
    </div>
  );
}
