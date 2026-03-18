import { useState, useEffect } from 'react';
import { deliveryService, routeService } from '../services/api.js';

export default function MatchingPage({ onNavigate, onBack }) {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchingAnim, setMatchingAnim] = useState(true);

  useEffect(() => {
    const allDeliveries = deliveryService.getDeliveries().filter(d => d.status === 'requested');
    setDeliveries(allDeliveries);
    if (allDeliveries.length > 0) {
      setSelectedDelivery(allDeliveries[0]);
      // Simulate matching animation
      setTimeout(() => {
        const found = deliveryService.findMatches(allDeliveries[0]);
        setMatches(found);
        setMatchingAnim(false);
      }, 2000);
    } else {
      setMatchingAnim(false);
    }
  }, []);

  const handleAcceptMatch = async (match) => {
    if (selectedDelivery) {
      await deliveryService.matchDelivery(selectedDelivery.id, match.route.commuterId);
      onNavigate('tracking', { deliveryId: selectedDelivery.id });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-md">
          <button className="btn-icon btn-secondary" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="page-title font-display">Find Matches</h1>
        </div>
      </div>

      <div className="page-content">
        {/* Selected delivery summary */}
        {selectedDelivery && (
          <div className="delivery-card animate-fadeIn" style={{ marginBottom: '24px' }}>
            <div className="delivery-route">
              <div className="delivery-route-line">
                <div className="route-dot start" />
                <div className="route-line" />
                <div className="route-dot end" />
              </div>
              <div className="delivery-locations">
                <div className="delivery-location">
                  <div className="delivery-location-label">Pickup</div>
                  <div className="truncate">{selectedDelivery.pickupLocation?.address}</div>
                </div>
                <div className="delivery-location">
                  <div className="delivery-location-label">Drop</div>
                  <div className="truncate">{selectedDelivery.dropoffLocation?.address}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-sm" style={{ marginTop: '12px' }}>
              <span className="chip chip-blue">📦 {selectedDelivery.packageDescription}</span>
            </div>
          </div>
        )}

        {/* Matching Animation */}
        {matchingAnim && (
          <div className="matching-animation animate-fadeIn">
            <div className="matching-radar">
              <div className="radar-ring ring-1" />
              <div className="radar-ring ring-2" />
              <div className="radar-ring ring-3" />
              <div className="radar-center">🔍</div>
            </div>
            <h3 className="text-lg font-display" style={{ fontWeight: 600, marginTop: '24px' }}>
              Finding commuters...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Matching your delivery with nearby commuters
            </p>
          </div>
        )}

        {/* Match Results */}
        {!matchingAnim && matches.length > 0 && (
          <div className="animate-slideUp">
            <div className="section-header">
              <h2 className="section-title">
                {matches.length} Commuters Found
              </h2>
              <span className="chip chip-green">Live</span>
            </div>

            <div className="flex flex-col gap-md">
              {matches.map((match, i) => (
                <div key={i} className="match-card glass-card animate-fadeIn" style={{ animationDelay: `${i * 0.1}s`, padding: '20px' }}>
                  <div className="flex items-center gap-md" style={{ marginBottom: '16px' }}>
                    <div className="avatar avatar-ring">
                      {match.route.commuterName?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="text-base" style={{ fontWeight: 600 }}>{match.route.commuterName}</div>
                      <div className="flex items-center gap-xs">
                        <span style={{ color: 'var(--accent-orange)', fontSize: '0.8rem' }}>⭐ {match.route.commuterRating}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>• {match.route.recurringDays?.length || 5} days/week</span>
                      </div>
                    </div>
                    <div className="match-score">
                      <div className="match-score-value text-gradient font-display">{match.matchScore}%</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>match</div>
                    </div>
                  </div>

                  {/* Route overlap visualization */}
                  <div className="match-route-viz">
                    <div className="progress-bar" style={{ marginBottom: '12px' }}>
                      <div className="progress-fill" style={{ width: `${match.matchScore}%` }} />
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>📍 {match.route.startLocation?.address?.split(',')[0]}</span>
                      <span>{match.route.endLocation?.address?.split(',')[0]} 🏁</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between" style={{ marginTop: '16px' }}>
                    <div className="flex items-center gap-md">
                      <span className="chip chip-blue">🕐 {match.estimatedDetour} detour</span>
                      <span className="chip chip-green" style={{ fontWeight: 600 }}>₹{match.estimatedPrice}</span>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAcceptMatch(match)}>
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Matches */}
        {!matchingAnim && matches.length === 0 && deliveries.length === 0 && (
          <div className="empty-state animate-fadeIn">
            <div className="empty-state-icon">📦</div>
            <h3 className="text-lg font-display" style={{ fontWeight: 600 }}>No Pending Requests</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Create a delivery request to find commuters
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate('delivery-request')}>
              Send a Package
            </button>
          </div>
        )}
      </div>

      <style>{`
        .matching-animation {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 48px 0;
        }
        .matching-radar {
          position: relative; width: 120px; height: 120px;
        }
        .radar-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid var(--accent-purple);
          animation: radar-expand 2s ease-out infinite;
        }
        .ring-1 { inset: 30px; animation-delay: 0s; }
        .ring-2 { inset: 15px; animation-delay: 0.5s; }
        .ring-3 { inset: 0; animation-delay: 1s; }
        .radar-center {
          position: absolute; inset: 40px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; z-index: 2;
        }
        @keyframes radar-expand {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        .match-card { transition: all var(--transition-smooth); }
        .match-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-glow-purple); }
        .match-score { text-align: center; }
        .match-score-value { font-size: 1.3rem; font-weight: 700; }
      `}</style>
    </div>
  );
}
