import { useState, useEffect } from 'react';
import { userService, deliveryService, routeService, paymentService } from '../services/api.js';
import { auth } from '../config/firebase.js';

export default function ProfilePage({ user, profile, onLogout, onBack }) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ deliveries: 0, routes: 0, earnings: 0, rating: 5.0 });

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const [dels, rts, bal] = await Promise.all([
          deliveryService.getDeliveries(),
          routeService.getRoutes(),
          paymentService.getWalletBalance()
        ]);
        if (!mounted) return;
        setStats({
          deliveries: (dels || []).length,
          routes: (rts || []).length,
          earnings: bal || 0,
          rating: profile?.rating || 5.0,
        });
      } catch (err) { console.error(err); }
    }
    loadStats();
    return () => { mounted = false; };
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateProfile(user?.uid, { name, email, phone });
      setEditMode(false);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const menuItems = [
    { icon: '📦', label: 'My Deliveries', desc: 'Active & finished tasks' },
    { icon: '🗺️', label: 'My Routes', desc: 'Saved commute routes' },
    { icon: '🔔', label: 'Notifications', desc: 'Alerts & preferences' },
    { icon: '🛡️', label: 'Security', desc: 'Password & privacy' },
  ];

  return (
    <div className="page animate-fadeIn" style={{ padding: '40px 24px' }}>
      <div className="page-header" style={{ marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-2xl font-display" style={{ fontWeight: 900 }}>Profile</h1>
        <button className="btn btn-ghost" onClick={() => setEditMode(!editMode)}>
           {editMode ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Avatar & Identitiy */}
        <div className="flex flex-col items-center text-center">
           <div className={`avatar ${profile?.avatar ? '' : 'avatar-ring'}`} 
                style={{ width: '120px', height: '120px', overflow: 'hidden', marginBottom: '24px' }}>
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="text-3xl">{(profile?.name || user.displayName || 'U')[0].toUpperCase()}</span>
              )}
           </div>
           
           {!editMode ? (
             <div className="stagger-1">
                <h2 className="text-xl font-display" style={{ fontWeight: 800 }}>{profile?.name || user.displayName}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{profile?.email}</p>
             </div>
           ) : (
             <div className="flex flex-col gap-md w-full stagger-1">
                <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
                <input className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
             </div>
           )}
        </div>

        {/* Stats Section */}
        <div className="flex gap-md stagger-2">
           <div className="glass-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
              <div className="text-xl font-display" style={{ fontWeight: 800 }}>{stats.deliveries}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>TASKS</div>
           </div>
           <div className="glass-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
              <div className="text-xl font-display" style={{ fontWeight: 800, color: 'var(--accent-purple)' }}>{stats.routes}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>ROUTES</div>
           </div>
           <div className="glass-card" style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
              <div className="text-xl font-display" style={{ fontWeight: 800, color: 'var(--accent-pink)' }}>⭐ {stats.rating}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>RATING</div>
           </div>
        </div>

        {/* Action Menu */}
        <div className="section stagger-3">
           <div className="flex flex-col gap-md">
              {menuItems.map(item => (
                <div key={item.label} className="glass-card" style={{ padding: '20px', cursor: 'pointer' }}>
                   <div className="flex items-center gap-md">
                      <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                         <div className="text-sm" style={{ fontWeight: 800 }}>{item.label}</div>
                         <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>→</div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Dangerous Actions */}
        <div className="stagger-4" style={{ marginTop: '24px' }}>
           <button className="btn btn-full" onClick={() => auth.signOut() && onLogout()}
                   style={{ border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)', background: 'rgba(244,114,182,0.1)' }}>
              Log Out
           </button>
           <p className="text-center text-xs" style={{ marginTop: '24px', opacity: 0.3 }}>DELo v1.0.4 • Bangalore with ❤️</p>
        </div>
      </div>
    </div>
  );
}
