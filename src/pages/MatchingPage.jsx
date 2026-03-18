import { useState, useEffect } from 'react';
import { deliveryService } from '../services/api.js';

export default function MatchingPage({ onNavigate, onBack }) {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchingAnim, setMatchingAnim] = useState(true);

  useEffect(() => {
    async function loadDeliveries() {
      try {
        const dels = await deliveryService.getDeliveries();
        const active = (dels || []).filter(d => d.status === 'requested');
        setDeliveries(active);
        if (active.length > 0) {
          setSelectedDelivery(active[0]);
          setTimeout(async () => {
            const found = await deliveryService.findMatches(active[0]);
            setMatches(found || []);
            setMatchingAnim(false);
          }, 2500);
        } else { setMatchingAnim(false); }
      } catch (e) {
        console.error(e);
        setMatchingAnim(false);
      }
    }
    loadDeliveries();
  }, []);

  const handleAcceptMatch = async (match) => {
    if (selectedDelivery) {
      await deliveryService.matchDelivery(selectedDelivery.id, match.route.commuterId);
      onNavigate('tracking', { deliveryId: selectedDelivery.id });
    }
  };

  return (
    <div className="page animate-fadeIn" style={{ padding: '40px 24px' }}>
      <div className="page-header" style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="text-3xl font-display" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>MATCHING.</h1>
        <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
      </div>

      <div className="page-content">
        {matchingAnim ? (
          <div className="flex flex-col items-center justify-center" style={{ minHeight: '50vh' }}>
            <div className="match-pulse-ring" />
            <div className="match-pulse-ring" style={{ animationDelay: '0.5s' }} />
            <div className="match-pulse-ring" style={{ animationDelay: '1s' }} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚡</div>
              <p className="text-sm font-display" style={{ fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8 }}>FINDING PERFECT PARCEL MATCH</p>
            </div>
          </div>
        ) : (
          <div className="animate-slideUp">
            {matches.length > 0 ? (
              <div className="flex flex-col gap-lg">
                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                   <p className="text-xs" style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{matches.length} CONNECTIONS FOUND</p>
                   <span className="chip-neon">LIVE</span>
                </div>
                {matches.map((m, i) => (
                  <div key={i} className="glass-card stagger-1" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div className="flex items-center gap-md" style={{ marginBottom: '20px' }}>
                      <div className="avatar-ring" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {m.route.commuterName?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="text-base" style={{ fontWeight: 800 }}>{m.route.commuterName}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>⭐ {m.route.commuterRating} • Reliable</div>
                      </div>
                      <div className="text-center">
                         <div className="text-xl font-display" style={{ fontWeight: 900, color: 'var(--accent-primary)' }}>{m.matchScore}%</div>
                         <div className="text-xs" style={{ opacity: 0.5, fontWeight: 800 }}>MATCH</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className="text-xs" style={{ fontWeight: 700 }}>Detour: {m.estimatedDetour}</span>
                          <span className="text-xs" style={{ fontWeight: 700 }}>Pickup: ASAP</span>
                       </div>
                       <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                          <div style={{ width: `${m.matchScore}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '2px', boxShadow: '0 0 10px var(--accent-primary)' }} />
                       </div>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="text-lg font-display" style={{ fontWeight: 900 }}>₹{m.estimatedPrice}</div>
                       <button className="btn btn-primary" style={{ padding: '10px 24px' }} onClick={() => handleAcceptMatch(m)}>SELECT</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center" style={{ padding: '80px 24px' }}>
                 <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>👽</div>
                 <h2 className="text-xl font-display" style={{ fontWeight: 800 }}>No commuters yet.</h2>
                 <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Looks like everyone's at home. Try again in a bit?</p>
                 <button className="btn btn-secondary" onClick={() => window.location.reload()}>RETRY</button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .chip-neon { background: var(--accent-primary); color: #000; font-size: 0.6rem; font-weight: 900; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.05em; }
        .match-pulse-ring {
          position: absolute; border: 1px solid var(--accent-primary);
          border-radius: 50%; width: 200px; height: 200px;
          animation: match-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          opacity: 0;
        }
        @keyframes match-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
