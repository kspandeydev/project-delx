import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function BottomNav({ currentPage, onNavigate }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', uid), where('isRead', '==', false));
    const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.docs.length));
    return () => unsub();
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'matching',
      label: 'Match',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: 'delivery-request',
      label: '',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      isAction: true,
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: (
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: 'var(--accent-pink)', color: '#000', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unreadCount}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${currentPage === item.id ? 'active' : ''} ${item.isAction ? 'nav-action' : ''}`}
          onClick={() => onNavigate(item.id)}
          id={`nav-${item.id}`}
        >
          {item.isAction ? (
            <div className="nav-action-btn">
              {item.icon}
            </div>
          ) : (
            <>
              {item.icon}
              <span className="nav-item-label">{item.label}</span>
            </>
          )}
        </button>
      ))}

      <style>{`
        .bottom-nav { border-top: 1px solid var(--border-subtle); background: var(--bg-glass); height: 80px; }
        .nav-item { color: var(--text-muted); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); width: 20%; display: flex; justify-content: center; }
        .nav-item.active { color: var(--accent-primary); }
        .nav-item svg { width: 24px; height: 24px; }
        .nav-item-label { font-size: 0.65rem; font-weight: 800; font-family: var(--font-primary); text-transform: uppercase; letter-spacing: 0.05em; }
        .nav-action { position: relative; }
        .nav-action-btn {
          width: 56px; height: 56px; border-radius: 20px;
          background: var(--accent-primary);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 30px rgba(212, 255, 0, 0.2);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          margin-top: -32px; border: 4px solid var(--bg-primary);
        }
        .nav-action-btn svg { width: 28px; height: 28px; color: #000; display: block; }
        .nav-action-btn:hover {
          transform: translateY(-8px) scale(1.05);
          box-shadow: 0 0 40px rgba(212, 255, 0, 0.4);
        }
        .nav-item.active svg { transform: translateY(-4px); }
        .nav-item.active .nav-action-btn svg { transform: none; }
      `}</style>
    </nav>
  );
}
