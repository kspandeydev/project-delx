import { useState, useEffect, useRef } from 'react';
import { deliveryService } from '../services/api.js';
import { db } from '../config/firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth } from '../config/firebase.js';

export default function TrackingPage({ deliveryId, onNavigate, onBack }) {
  const [delivery, setDelivery] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpType, setOtpType] = useState('pickup'); // pickup or delivery
  const [otpError, setOtpError] = useState('');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [eta, setEta] = useState('12 MIN');

  useEffect(() => {
    if (!deliveryId) return;
    const unsub = onSnapshot(doc(db, 'deliveries', deliveryId), (snap) => {
      if (snap.exists()) {
        setDelivery({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsub();
  }, [deliveryId]);

  useEffect(() => {
    if (mapRef.current && window.google && delivery && !mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: delivery.pickupLocation || { lat: 12.9716, lng: 77.5946 },
        zoom: 14,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#000000' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#111827' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
        ],
        disableDefaultUI: true,
      });

      if (delivery.pickupLocation) {
        new window.google.maps.Marker({
          position: delivery.pickupLocation, map: mapInstance.current,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#d4ff00', fillOpacity: 1, strokeWeight: 2, strokeColor: '#000' }
        });
      }
      if (delivery.dropoffLocation) {
        new window.google.maps.Marker({
          position: delivery.dropoffLocation, map: mapInstance.current,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#ff0055', fillOpacity: 1, strokeWeight: 2, strokeColor: '#000' }
        });
      }

      if (delivery.status === 'in_transit' && delivery.pickupLocation && delivery.dropoffLocation) {
        const poly = new window.google.maps.Polyline({
          path: [delivery.pickupLocation, delivery.dropoffLocation],
          map: mapInstance.current, strokeColor: '#d4ff00', strokeOpacity: 0.4, strokeWeight: 3,
        });
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(delivery.pickupLocation);
        bounds.extend(delivery.dropoffLocation);
        mapInstance.current.fitBounds(bounds, 80);
      }
    }
  }, [delivery]);

  const handleVerifyOtp = async () => {
    const isPickup = otpType === 'pickup';
    let success = false;
    
    if (isPickup) {
      success = await deliveryService.verifyPickupOtp(delivery.id, otpInput);
    } else {
      success = await deliveryService.verifyDeliveryOtp(delivery.id, otpInput);
    }

    if (success) {
      setShowOtpModal(false);
      setOtpInput('');
    } else { 
      setOtpError('INVALID CODE'); 
    }
  };

  if (!delivery) return <div className="page p-lg text-center">LOADING...</div>;

  return (
    <div className="page animate-fadeIn" style={{ display: 'flex', flexDirection: 'column' }}>
       <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
       <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8))', pointerEvents: 'none', zIndex: 1 }} />

       <div className="page-header" style={{ position: 'relative', zIndex: 10, padding: '40px 24px' }}>
          <div className="flex items-center justify-between">
             <button className="btn btn-ghost" onClick={onBack} style={{ padding: 0 }}>← BACK</button>
             {delivery.status === 'in_transit' && (
               <div className="status-badge-neon">LIVE: {eta}</div>
             )}
          </div>
          <h1 className="text-3xl font-display" style={{ fontWeight: 900, marginTop: '12px' }}>TRACKING.</h1>
       </div>

       <div className="page-content" style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
          
          <div className="glass-card animate-slideUp" style={{ padding: '24px' }}>
             <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <div>
                   <p className="text-xs" style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>PACKAGE ID</p>
                   <p className="text-base" style={{ fontWeight: 900 }}>#DEL-{delivery.id.slice(-4).toUpperCase()}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs" style={{ opacity: 0.5, fontWeight: 800 }}>STATUS</p>
                   <p className="text-base" style={{ fontWeight: 900, color: 'var(--accent-primary)' }}>{delivery.status.toUpperCase()}</p>
                </div>
             </div>

             <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
                <div style={{ width: { requested: '20%', matched: '40%', picked_up: '60%', in_transit: '80%', delivered: '100%' }[delivery.status] || '0%', height: '100%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)', transition: 'width 0.5s ease-out' }} />
             </div>

             <div className="flex items-center gap-md" style={{ marginBottom: '24px' }}>
                <div className="avatar-ring" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {delivery.commuterName?.[0] || 'A'}
                </div>
                <div style={{ flex: 1 }}>
                   <p className="text-base" style={{ fontWeight: 800 }}>{delivery.commuterName || 'Secure Commuter'}</p>
                   <p className="text-xs" style={{ opacity: 0.5 }}>Commuter • {delivery.commuterRating || '5.0'}⭐</p>
                </div>
                <button className="btn btn-icon btn-secondary">📞</button>
             </div>

             {['matched', 'in_transit', 'picked_up'].includes(delivery.status) && (
                <button className="btn btn-primary btn-full btn-lg" onClick={() => { setOtpType(delivery.status === 'matched' ? 'pickup' : 'delivery'); setShowOtpModal(true); }}>
                   VERIFY {delivery.status === 'matched' ? 'PICKUP' : 'DELIVERY'}
                </button>
             )}

             {delivery.status === 'delivered' && (
                <div className="flex flex-col gap-sm">
                   {auth.currentUser?.uid === delivery.senderId && !delivery.rated && (
                     <div className="glass-card animate-fadeIn" style={{ padding: '16px', textAlign: 'center', marginBottom: '8px' }}>
                        <p className="text-xs font-display" style={{ fontWeight: 800, marginBottom: '12px' }}>RATE YOUR COMMUTER</p>
                        <div className="flex justify-center gap-xs">
                           {[1, 2, 3, 4, 5].map(star => (
                             <button key={star} style={{ fontSize: '1.5rem', color: 'var(--accent-yellow)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={async () => {
                                await deliveryService.rateDelivery(delivery.id, delivery.commuterId, star);
                             }}>
                               ★
                             </button>
                           ))}
                        </div>
                     </div>
                   )}
                   <button className="btn btn-secondary btn-full btn-lg" onClick={() => onNavigate('dashboard')}>BACK HOME</button>
                </div>
             )}
          </div>
       </div>

       {showOtpModal && (
         <div className="otp-modal-overlay">
            <div className="glass-card animate-scaleIn" style={{ width: '100%', maxWidth: '340px', padding: '40px 32px', textAlign: 'center' }}>
               <h3 className="text-xl font-display" style={{ fontWeight: 900, marginBottom: '12px' }}>OTP VERIFY.</h3>
               <p className="text-sm" style={{ opacity: 0.6, marginBottom: '32px' }}>{auth.currentUser?.uid === delivery.senderId ? 'Share this code with the commuter.' : 'Enter the 4-digit code shared with the commuter.'}</p>
               
               {auth.currentUser?.uid === delivery.senderId ? (
                 <>
                   <div style={{ background: 'rgba(212, 255, 0, 0.1)', color: 'var(--accent-primary)', padding: '12px', borderRadius: '12px', marginBottom: '24px', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.2em' }}>
                      {otpType === 'pickup' ? delivery.pickupOtp : delivery.deliveryOtp}
                   </div>
                   <button className="btn btn-secondary btn-full btn-lg" onClick={() => setShowOtpModal(false)}>CLOSE</button>
                 </>
               ) : (
                 <>
                   <input className="input-field text-center" style={{ fontSize: '2rem', letterSpacing: '0.5em', fontWeight: 900 }} 
                          type="tel" maxLength={4} value={otpInput} onChange={e => setOtpInput(e.target.value)} autoFocus />
                   
                   {otpError && <p className="text-xs" style={{ color: '#ff0055', marginTop: '12px', fontWeight: 800 }}>{otpError}</p>}
                   
                   <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '32px' }} onClick={handleVerifyOtp} disabled={otpInput.length < 4}>VERIFY</button>
                   <button className="btn btn-ghost" style={{ marginTop: '12px' }} onClick={() => setShowOtpModal(false)}>CANCEL</button>
                 </>
               )}
            </div>
         </div>
       )}

       <style>{`
         .status-badge-neon { background: var(--accent-primary); color: #000; font-size: 0.7rem; font-weight: 900; padding: 4px 12px; border-radius: 20px; box-shadow: 0 0 15px var(--accent-primary); }
         .otp-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
       `}</style>
    </div>
  );
}
