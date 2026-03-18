import { useState, useEffect } from 'react';
import { deliveryService, routeService, paymentService, notificationService } from '../services/api.js';

export default function Dashboard({ user, profile, onNavigate }) {
  const [mode, setMode] = useState(profile?.activeMode || 'sender');
  const [deliveries, setDeliveries] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stats, setStats] = useState({ earnings: 0, deliveries: 0, rating: 5.0 });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setDeliveries(deliveryService.getDeliveries());
    setRoutes(routeService.getRoutes());
    setNotifications(notificationService.getNotifications());
    setStats({
      earnings: paymentService.getWalletBalance(),
      deliveries: deliveryService.getDeliveries().length,
      rating: profile?.rating || 5.0
    });
  }, [profile]);

  const activeDeliveries = deliveries.filter(d =>
    ['requested', 'matched', 'picked_up', 'in_transit'].includes(d.status)
  );
  const myRoutes = routes.filter(r => r.status === 'active');
  const unreadCount = notifications.filter(n => !n.read).length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'orange';
      case 'matched': return 'blue';
      case 'picked_up': case 'in_transit': return 'green';
      case 'delivered': return 'purple';
      default: return 'blue';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <div className="avatar avatar-ring" onClick={() => onNavigate('profile')}>
              {(profile?.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{getGreeting()}</p>
              <h1 className="text-lg font-display" style={{ fontWeight: 700 }}>
                {profile?.name || 'DELo User'}
              </h1>
            </div>
          </div>
          <button className="btn-icon btn-secondary" onClick={() => onNavigate('profile')} style={{ position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Mode Toggle */}
        <div className="toggle-container animate-fadeIn stagger-1" style={{ marginBottom: '24px' }}>
          <div className={`toggle-option ${mode === 'sender' ? 'active' : ''}`} onClick={() => setMode('sender')}>
            📦 Send
          </div>
          <div className={`toggle-option ${mode === 'commuter' ? 'active' : ''}`} onClick={() => setMode('commuter')}>
            🚀 Deliver
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid animate-fadeIn stagger-2">
          <div className="stat-card">
            <div className="stat-value text-gradient">₹{stats.earnings}</div>
            <div className="stat-label">{mode === 'commuter' ? 'Earnings' : 'Spent'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.deliveries}</div>
            <div className="stat-label">Deliveries</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>⭐ {stats.rating}</div>
            <div className="stat-label">Rating</div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="section animate-fadeIn stagger-3" style={{ marginTop: '24px' }}>
          {mode === 'sender' ? (
            <button className="quick-action-card" onClick={() => onNavigate('delivery-request')}>
              <div className="quick-action-icon">📦</div>
              <div className="quick-action-text">
                <span className="text-base" style={{ fontWeight: 600 }}>Send a Package</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Find a commuter going your way</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ) : (
            <button className="quick-action-card" onClick={() => onNavigate('route-setup')}>
              <div className="quick-action-icon">🗺️</div>
              <div className="quick-action-text">
                <span className="text-base" style={{ fontWeight: 600 }}>Set Your Route</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Start earning on your daily commute</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
        </div>

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <div className="section animate-fadeIn stagger-4">
            <div className="section-header">
              <h2 className="section-title">Active Deliveries</h2>
              <span className="chip chip-purple">{activeDeliveries.length}</span>
            </div>
            <div className="flex flex-col gap-md">
              {activeDeliveries.slice(0, 3).map(delivery => (
                <div key={delivery.id} className="delivery-card" onClick={() => onNavigate('tracking', { deliveryId: delivery.id })}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                    <span className={`chip chip-${getStatusColor(delivery.status)}`}>
                      <span className={`status-dot ${delivery.status === 'in_transit' ? 'active' : 'pending'}`} />
                      {delivery.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-display" style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                      ₹{delivery.price}
                    </span>
                  </div>
                  <div className="delivery-route">
                    <div className="delivery-route-line">
                      <div className="route-dot start" />
                      <div className="route-line" />
                      <div className="route-dot end" />
                    </div>
                    <div className="delivery-locations">
                      <div className="delivery-location">
                        <div className="delivery-location-label">Pickup</div>
                        <div className="truncate">{delivery.pickupLocation?.address || 'Location'}</div>
                      </div>
                      <div className="delivery-location">
                        <div className="delivery-location-label">Drop</div>
                        <div className="truncate">{delivery.dropoffLocation?.address || 'Location'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm" style={{ marginTop: '12px' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      📦 {delivery.packageDescription}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Routes (Commuter Mode) */}
        {mode === 'commuter' && (
          <div className="section animate-fadeIn stagger-4">
            <div className="section-header">
              <h2 className="section-title">Your Routes</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('route-setup')}>+ Add</button>
            </div>
            {myRoutes.length > 0 ? (
              <div className="flex flex-col gap-md">
                {myRoutes.slice(0, 3).map(route => (
                  <div key={route.id} className="delivery-card">
                    <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                      <div className="flex items-center gap-sm">
                        <span className="status-dot active" />
                        <span className="text-sm" style={{ fontWeight: 500 }}>Active</span>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {route.startTime} — {route.endTime}
                      </span>
                    </div>
                    <div className="delivery-route">
                      <div className="delivery-route-line">
                        <div className="route-dot start" />
                        <div className="route-line" />
                        <div className="route-dot end" />
                      </div>
                      <div className="delivery-locations">
                        <div className="delivery-location">
                          <div className="truncate">{route.startLocation?.address}</div>
                        </div>
                        <div className="delivery-location">
                          <div className="truncate">{route.endLocation?.address}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm" style={{ marginTop: '8px' }}>
                      {route.recurringDays?.map(day => (
                        <span key={day} className="chip chip-blue" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{day}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🗺️</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No routes yet. Add your daily commute to start earning!</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <div className="section animate-fadeIn stagger-5">
            <div className="section-header">
              <h2 className="section-title">Recent Activity</h2>
            </div>
            <div className="flex flex-col gap-sm">
              {notifications.slice(0, 3).map(notif => (
                <div key={notif.id} className="notif-item glass-card" style={{ padding: '12px 16px', opacity: notif.read ? 0.6 : 1 }}>
                  <div className="flex items-center gap-md">
                    <div className="notif-icon-wrap">
                      {notif.type === 'match' ? '🤝' : notif.type === 'pickup' ? '📦' : notif.type === 'delivery' ? '🚀' : '🔔'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-sm" style={{ fontWeight: 600 }}>{notif.title}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{notif.message}</div>
                    </div>
                    {!notif.read && <div className="status-dot active" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .stats-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }
        .quick-action-card {
          width: 100%; display: flex; align-items: center; gap: 16px;
          padding: 20px; border-radius: var(--radius-lg);
          background: var(--gradient-card); border: 1px solid var(--border-accent);
          transition: all var(--transition-smooth); text-align: left;
        }
        .quick-action-card:hover {
          box-shadow: var(--shadow-glow-purple); transform: translateY(-2px);
        }
        .quick-action-icon {
          width: 48px; height: 48px; border-radius: var(--radius-md);
          background: var(--bg-glass); display: flex; align-items: center;
          justify-content: center; font-size: 1.5rem; flex-shrink: 0;
        }
        .quick-action-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .notif-badge {
          position: absolute; top: -4px; right: -4px;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--accent-pink); color: white;
          font-size: 0.65rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .notif-icon-wrap {
          width: 36px; height: 36px; border-radius: var(--radius-sm);
          background: var(--bg-glass); display: flex; align-items: center;
          justify-content: center; font-size: 1.1rem; flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
