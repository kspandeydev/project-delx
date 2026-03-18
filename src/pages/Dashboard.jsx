import { useState, useEffect } from 'react';
import { db } from '../config/firebase.js';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { deliveryService, routeService, paymentService, notificationService } from '../services/api.js';

export default function Dashboard({ user, profile, onNavigate }) {
  const [mode, setMode] = useState(profile?.activeMode || 'sender');
  const [deliveries, setDeliveries] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [stats, setStats] = useState({ earnings: 0, deliveries: 0, rating: 5.0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [rts, bal] = await Promise.all([
          routeService.getRoutes(user.uid),
          paymentService.getWalletBalance()
        ]);
        if (!mounted) return;
        setRoutes(rts || []);
        setStats(prev => ({
          ...prev,
          earnings: bal || 0,
          rating: profile?.rating || 5.0
        }));
      } catch (err) {
        console.error("Dashboard error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [profile, user.uid]);

  // Real-time listeners
  useEffect(() => {
    // Deliveries listener
    const qDels = query(collection(db, 'deliveries'));
    const unsubDels = onSnapshot(qDels, async (snap) => {
      const allDels = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeliveries(allDels);

      // Compute incoming requests dynamically based on my active routes
      const activeRouteIds = routes.filter(r => r.status === 'active').map(r => r.id);
      const inc = await deliveryService.getIncomingRequests(user.uid, activeRouteIds);
      setIncomingRequests(inc);

      // Update deliveries stat
      setStats(prev => ({
        ...prev,
        deliveries: allDels.filter(d => d.commuterId === user.uid || (d.senderId === user.uid && d.status === 'delivered')).length
      }));
    });

    // Notifications listener
    const qNotifs = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('isRead', '==', false));
    const unsubNotifs = onSnapshot(qNotifs, (snap) => {
      setUnreadCount(snap.docs.length);
    });

    return () => {
      unsubDels();
      unsubNotifs();
    };
  }, [user.uid, routes]);

  const handleAccept = async (id) => {
    await deliveryService.acceptRequest(id, user.uid);
  };

  const handleReject = async (id) => {
    await deliveryService.rejectRequest(id, user.uid);
    setIncomingRequests(prev => prev.filter(r => r.id !== id)); // optimistically hide
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      await routeService.deleteRoute(routeId);
      setRoutes(prev => prev.filter(r => r.id !== routeId));
    }
  };

  const handleToggleRoute = async (routeId, currentStatus) => {
    await routeService.toggleRoute(routeId, currentStatus);
    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, status: currentStatus === 'active' ? 'paused' : 'active' } : r));
  };

  const activeDeliveries = deliveries.filter(d => {
    const isMine = mode === 'commuter' ? d.commuterId === user.uid : d.senderId === user.uid;
    return isMine && ['requested', 'matched', 'picked_up', 'in_transit'].includes(d.status);
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
      <div className="animate-pulse text-lg font-display">Syncing DELo...</div>
    </div>
  );

  return (
    <div className="page animate-fadeIn">
      {/* Header Area */}
      <div className="page-header" style={{ marginBottom: '48px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <div className={`avatar ${profile?.avatar ? '' : 'avatar-ring'}`} 
                 onClick={() => onNavigate('profile')}
                 style={{ width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="text-xl">{(profile?.name || user.displayName || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{getGreeting()}</p>
              <h1 className="text-2xl font-display" style={{ fontWeight: 800 }}>
                {profile?.name || user.displayName || 'User'}
              </h1>
            </div>
          </div>
          <div className="flex" style={{ gap: '12px' }}>
             <button onClick={() => onNavigate('notifications')} style={{ position: 'relative', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && (
                  <span className="badge" style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--accent-pink)', color: '#000', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </span>
                )}
             </button>
             <button onClick={() => onNavigate('profile')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
             </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Mode Switcher */}
        <div className="toggle-group stagger-1">
          <button className={`toggle-btn ${mode === 'sender' ? 'active' : ''}`} onClick={() => setMode('sender')}>
            Send Package
          </button>
          <button className={`toggle-btn ${mode === 'commuter' ? 'active' : ''}`} onClick={() => setMode('commuter')}>
            Commuter Mode
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex gap-md stagger-2" style={{ marginBottom: '48px' }}>
          <div className="glass-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
            <div className="text-gradient text-xl font-display" style={{ fontWeight: 800 }}>₹{stats.earnings}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px', fontWeight: 800 }}>EARNINGS</div>
          </div>
          <div className="glass-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
            <div className="text-xl font-display" style={{ fontWeight: 800, color: 'var(--accent-purple)' }}>{stats.deliveries}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px', fontWeight: 800 }}>DELIVERIES</div>
          </div>
          <div className="glass-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
            <div className="text-xl font-display" style={{ fontWeight: 800, color: 'var(--accent-pink)' }}>⭐ {stats.rating}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px', fontWeight: 800 }}>RATING</div>
          </div>
        </div>

        {/* Action Callouts */}
        {mode === 'sender' ? (
          <div className="glass-card stagger-3" onClick={() => onNavigate('delivery-request')} 
               style={{ padding: '32px', marginBottom: '48px', cursor: 'pointer', border: '1px dashed var(--border-neon)' }}>
             <h3 className="text-xl font-display" style={{ marginBottom: '8px' }}>Need to send something?</h3>
             <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Find a commuter who's already headed your way.</p>
             <button className="btn btn-primary">Create Request</button>
          </div>
        ) : (
          <div className="glass-card stagger-3" onClick={() => onNavigate('route-setup')} 
               style={{ padding: '32px', marginBottom: '48px', cursor: 'pointer', border: '1px dashed var(--accent-purple)' }}>
             <h3 className="text-xl font-display" style={{ marginBottom: '8px' }}>Headed somewhere?</h3>
             <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Share your route and earn while you commute.</p>
             <button className="btn btn-secondary" style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>Add Route</button>
          </div>
        )}

        {/* Commuter Mode: Incoming Requests */}
        {mode === 'commuter' && incomingRequests.length > 0 && (
          <div className="section stagger-4" style={{ marginBottom: '48px' }}>
            <h2 className="text-lg font-display" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Pending Requests <span className="chip chip-purple">{incomingRequests.length}</span>
            </h2>
            <div className="flex flex-col gap-md">
              {incomingRequests.map(req => (
                <div key={req.id} className="glass-card" style={{ padding: '24px' }}>
                  <div className="flex justify-between items-start" style={{ marginBottom: '16px' }}>
                    <div className="flex-1 pr-4">
                        <div className="text-xs" style={{ color: 'var(--accent-primary)', fontWeight: 800, marginBottom: '4px' }}>INCOMING ORDER</div>
                        <div className="text-base font-display" style={{ fontWeight: 700 }}>{req.packageDescription}</div>
                    </div>
                    <div className="text-lg font-display" style={{ color: 'var(--accent-green)', fontWeight: 800 }}>₹{Math.floor((req.price || 50) * 0.8)}</div>
                  </div>
                  
                  <div className="delivery-route" style={{ marginBottom: '24px' }}>
                    <div className="delivery-route-line">
                      <div className="route-dot start" />
                      <div className="route-line" />
                      <div className="route-dot end" />
                    </div>
                    <div className="delivery-locations flex-1 pl-4 flex flex-col justify-between">
                      <div className="text-sm">{req.pickupLocation?.address || 'Origin'}</div>
                      <div className="text-sm" style={{ marginTop: '16px' }}>{req.dropoffLocation?.address || 'Destination'}</div>
                    </div>
                  </div>

                  <div className="flex gap-sm">
                    <button className="btn btn-primary" style={{ flex: 1, padding: '12px' }} onClick={() => handleAccept(req.id)}>Accept</button>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => handleReject(req.id)}>Ignore</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commuter Mode: Active Routes */}
        {mode === 'commuter' && routes.length > 0 && (
          <div className="section stagger-5" style={{ marginBottom: '48px' }}>
            <h2 className="text-lg font-display" style={{ marginBottom: '24px' }}>My Active Routes</h2>
            <div className="flex flex-col gap-md">
              {routes.map(route => (
                <div key={route.id} className="glass-card flex justify-between items-center" style={{ padding: '24px', borderLeft: route.status === 'active' ? '4px solid var(--accent-purple)' : '4px solid var(--border-subtle)' }}>
                  <div>
                    <div className="text-sm font-display" style={{ fontWeight: 800 }}>{route.startLocation?.address}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>to</div>
                    <div className="text-sm font-display" style={{ fontWeight: 800 }}>{route.endLocation?.address}</div>
                  </div>
                  <div className="flex flex-col items-end gap-sm">
                    <div className={`chip chip-${route.status === 'active' ? 'purple' : 'default'}`} style={{ marginBottom: '8px' }}>{route.status.toUpperCase()}</div>
                    <div className="text-xs" style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>{route.startTime} - {route.endTime}</div>
                    <div className="flex gap-sm">
                       <button onClick={() => handleToggleRoute(route.id, route.status)} className="btn-icon" style={{ fontSize: '1.2rem', background: 'transparent', border: 'none', cursor: 'pointer', filter: 'grayscale(1)' }} title={route.status === 'active' ? 'Pause Route' : 'Activate Route'}>
                         {route.status === 'active' ? '⏸️' : '▶️'}
                       </button>
                       <button onClick={() => handleDeleteRoute(route.id)} className="btn-icon" style={{ fontSize: '1.2rem', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Delete Route">
                         🗑️
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Work / History */}
        <div className="section stagger-5">
           <h2 className="text-lg font-display" style={{ marginBottom: '24px' }}>
             {mode === 'sender' ? 'My Shipments' : 'Active Tasks'}
           </h2>
           {activeDeliveries.length > 0 ? (
             <div className="flex flex-col gap-md">
                {activeDeliveries.map(delivery => (
                  <div key={delivery.id} className="glass-card" style={{ padding: '24px', cursor: 'pointer' }} onClick={() => onNavigate('tracking', { deliveryId: delivery.id })}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                      <span className={`chip chip-${delivery.status === 'requested' ? 'purple' : 'green'}`}>
                        {delivery.status.toUpperCase()}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(delivery.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-base font-display" style={{ fontWeight: 700 }}>{delivery.packageDescription}</div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="glass-card text-center" style={{ padding: '60px 24px', border: '1px dashed var(--border-subtle)', background: 'var(--bg-glass)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.5, filter: 'drop-shadow(0 0 20px var(--accent-primary))' }}>📭</div>
                <h3 className="text-lg font-display" style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>Nothing here yet</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No active {mode === 'sender' ? 'shipments exploring the network' : 'tasks in your queue'}.</p>
             </div>
           )}
        </div>
      </div>

      <style>{`
        .text-2xl { font-size: 2rem !important; }
        .stagger-1 { animation-delay: 0.1s; opacity: 0; animation: fadeIn 0.5s ease forwards 0.1s; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; animation: fadeIn 0.5s ease forwards 0.2s; }
        .stagger-3 { animation-delay: 0.3s; opacity: 0; animation: fadeIn 0.5s ease forwards 0.3s; }
        .stagger-4 { animation-delay: 0.4s; opacity: 0; animation: fadeIn 0.5s ease forwards 0.4s; }
        .stagger-5 { animation-delay: 0.5s; opacity: 0; animation: fadeIn 0.5s ease forwards 0.5s; }
        
        .delivery-route {
          display: flex;
          align-items: stretch;
          margin-top: 16px;
        }
        .delivery-route-line {
          width: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .route-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 2px solid;
          background: #000;
        }
        .route-dot.start {
          border-color: var(--accent-green);
        }
        .route-dot.end {
          border-color: var(--accent-purple);
        }
        .route-line {
          width: 2px;
          flex: 1;
          margin: 4px 0;
          background: linear-gradient(to bottom, var(--accent-green), var(--accent-purple));
          opacity: 0.5;
        }
        .pr-4 { padding-right: 16px; }
        .pl-4 { padding-left: 16px; }
      `}</style>
    </div>
  );
}
