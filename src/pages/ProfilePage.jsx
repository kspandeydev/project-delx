import { useState, useEffect } from 'react';
import { userService, deliveryService, routeService, paymentService } from '../services/api.js';
import { auth } from '../config/firebase.js';

export default function ProfilePage({ user, profile, onLogout, onBack }) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    deliveries: 0,
    routes: 0,
    earnings: 0,
    rating: 5.0,
  });

  useEffect(() => {
    setStats({
      deliveries: deliveryService.getDeliveries().length,
      routes: routeService.getRoutes().length,
      earnings: paymentService.getWalletBalance(),
      rating: profile?.rating || 5.0,
    });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateProfile(user?.uid, { name, email, phone });
      await auth.updateProfile({ displayName: name });
      setEditMode(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await auth.signOut();
      onLogout();
    }
  };

  const menuItems = [
    { icon: '🔔', label: 'Notifications', desc: 'Manage alerts & preferences' },
    { icon: '🔒', label: 'Privacy & Security', desc: 'Password, 2FA, data' },
    { icon: '📋', label: 'Delivery History', desc: 'View past deliveries' },
    { icon: '❓', label: 'Help & Support', desc: 'FAQs, contact support' },
    { icon: '📜', label: 'Terms & Conditions', desc: 'Legal agreements' },
    { icon: '⭐', label: 'Rate DELo', desc: 'Love the app? Rate us!' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <h1 className="page-title font-display">Profile</h1>
          {!editMode ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}>Edit</button>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)} style={{color:'var(--accent-pink)'}}>Cancel</button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Profile Card */}
        <div className="profile-hero animate-fadeIn">
          <div className="profile-hero-bg" />
          <div className="profile-hero-content">
            <div className="avatar avatar-xl avatar-ring" style={{ fontSize: '2rem', marginBottom: '12px' }}>
              {(profile?.name || 'U')[0].toUpperCase()}
            </div>
            {!editMode ? (
              <>
                <h2 className="text-xl font-display" style={{ fontWeight: 700 }}>{profile?.name || 'DELo User'}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  {profile?.email || profile?.phone || 'Complete your profile'}
                </p>
                <div className="flex items-center gap-sm" style={{ marginTop: '12px' }}>
                  <span className="chip chip-green">⭐ {stats.rating} Rating</span>
                  {profile?.kycVerified ? (
                    <span className="chip chip-green">✅ KYC Verified</span>
                  ) : (
                    <span className="chip chip-orange">⚠️ KYC Pending</span>
                  )}
                </div>
              </>
            ) : (
              <div style={{ width: '100%', marginTop: '12px' }}>
                <div className="input-group" style={{ marginBottom: '12px' }}>
                  <label className="input-label">Name</label>
                  <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: '12px' }}>
                  <label className="input-label">Email</label>
                  <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label">Phone</label>
                  <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats animate-fadeIn stagger-2" style={{ marginTop: '24px' }}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient">{stats.deliveries}</div>
            <div className="stat-label">Deliveries</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.routes}</div>
            <div className="stat-label">Routes</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>₹{stats.earnings}</div>
            <div className="stat-label">Earned</div>
          </div>
        </div>

        {/* KYC Banner */}
        {!profile?.kycVerified && (
          <div className="kyc-banner glass-card animate-fadeIn stagger-3" style={{ padding: '16px', marginTop: '24px' }}>
            <div className="flex items-center gap-md">
              <div style={{ fontSize: '1.5rem' }}>🪪</div>
              <div style={{ flex: 1 }}>
                <div className="text-sm" style={{ fontWeight: 600 }}>Complete KYC Verification</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Verify identity to unlock all features</div>
              </div>
              <button className="btn btn-primary btn-sm">Verify</button>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="section animate-fadeIn stagger-4" style={{ marginTop: '24px' }}>
          <div className="flex flex-col gap-sm">
            {menuItems.map((item, i) => (
              <button key={i} className="profile-menu-item glass-card" style={{ padding: '14px 16px' }}>
                <div className="flex items-center gap-md">
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div className="text-sm" style={{ fontWeight: 500 }}>{item.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button className="btn btn-full animate-fadeIn stagger-5" onClick={handleLogout}
          style={{ marginTop: '24px', color: 'var(--accent-pink)', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          Log Out
        </button>

        {/* App Version */}
        <div className="text-center" style={{ marginTop: '24px', marginBottom: '16px' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>DELo v1.0.0 • Made in Bangalore 🇮🇳</p>
        </div>
      </div>

      <style>{`
        .profile-hero {
          position: relative; border-radius: var(--radius-xl); overflow: hidden; padding: 32px 24px;
        }
        .profile-hero-bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.1));
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
        }
        .profile-hero-content {
          position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .profile-stats {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }
        .profile-menu-item {
          width: 100%; cursor: pointer; transition: all var(--transition-smooth);
        }
        .profile-menu-item:hover { background: var(--bg-glass-hover); }
        .kyc-banner { border-color: rgba(245,158,11,0.3) !important; }
      `}</style>
    </div>
  );
}
