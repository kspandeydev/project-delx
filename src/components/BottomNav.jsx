export default function BottomNav({ currentPage, onNavigate }) {
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
      label: 'Send',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      isAction: true,
    },
    {
      id: 'payments',
      label: 'Wallet',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
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
        .nav-action { position: relative; }
        .nav-action-btn {
          width: 48px; height: 48px; border-radius: 50%;
          background: var(--gradient-primary);
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-glow-purple);
          transition: all var(--transition-smooth);
          margin-top: -20px;
        }
        .nav-action-btn svg { width: 22px; height: 22px; color: white; }
        .nav-action-btn:hover, .nav-action:active .nav-action-btn {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(168,85,247,0.4);
        }
      `}</style>
    </nav>
  );
}
