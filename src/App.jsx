import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, authAPI } from './config/firebase.js';
import { userService, seedDemoData } from './services/api.js';
import GetStartedPage from './pages/GetStartedPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RouteSetup from './pages/RouteSetup.jsx';
import DeliveryRequest from './pages/DeliveryRequest.jsx';
import MatchingPage from './pages/MatchingPage.jsx';
import TrackingPage from './pages/TrackingPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import BottomNav from './components/BottomNav.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState({});
  const [appError, setAppError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('delo_onboarding_completed'));

  useEffect(() => {
    // Helper to catch hanging Firebase promises
    const withTimeout = (promise, ms = 5000) => 
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("FIRESTORE_TIMEOUT")), ms))
      ]);

    const unsubscribe = authAPI.onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          let p = await withTimeout(userService.getProfile(u.uid));
          if (!p) {
            p = await withTimeout(userService.createProfile(u.uid, { 
              name: u.displayName || 'DELo User', 
              email: u.email || '', 
              phone: u.phoneNumber || '' 
            }));
          }
          setProfile(p);
          seedDemoData();
        } catch (err) {
          console.error("Auth/Profile error:", err);
          if (err.message === "FIRESTORE_TIMEOUT") {
             setAppError("Firestore Database is hanging. Check your Firebase Console (Build > Firestore Database) and ensure it's initialized in 'Test Mode'.");
          }
        }
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async () => {
    setLoading(true);
    setAppError(null);
    try {
      const u = auth.currentUser;
      const p = await userService.getProfile(u?.uid);
      setProfile(p);
      setUser(u);
      seedDemoData();
      setCurrentPage('dashboard');
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
    setPageParams({});
  };

  const handleLogout = async () => {
    await authAPI.logOut();
    setUser(null);
    setProfile(null);
    setCurrentPage('dashboard');
  };

  if (appError) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background:'var(--bg-primary)', padding: '24px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--accent-primary)', fontSize: '2rem', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>Setting Up...</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px' }}>{appError}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: 'var(--accent-primary)', color: '#000', borderRadius: '12px', fontWeight: 600 }}>Retry</button>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <GetStartedPage onComplete={() => setShowOnboarding(false)} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background:'var(--bg-primary)' }}>
        <div className="splash-logo font-hero text-gradient animate-pulse" style={{ fontSize: '3rem', fontWeight:800 }}>DELo</div>
        <p style={{ color: 'var(--text-muted)', marginTop: '20px', fontSize: '0.8rem' }}>Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard user={user} profile={profile} onNavigate={handleNavigate} />;
      case 'route-setup': return <RouteSetup onNavigate={handleNavigate} onBack={handleBack} />;
      case 'delivery-request': return <DeliveryRequest onNavigate={handleNavigate} onBack={handleBack} />;
      case 'matching': return <MatchingPage onNavigate={handleNavigate} onBack={handleBack} />;
      case 'tracking': return <TrackingPage deliveryId={pageParams.deliveryId} onNavigate={handleNavigate} onBack={handleBack} />;
      case 'payments': return <PaymentsPage onNavigate={handleNavigate} onBack={handleBack} />;
      case 'profile': return <ProfilePage user={user} profile={profile} onLogout={handleLogout} onBack={handleBack} />;
      case 'notifications': return <NotificationsPage onNavigate={handleNavigate} onBack={handleBack} />;
      default: return <Dashboard user={user} profile={profile} onNavigate={handleNavigate} />;
    }
  };

  const showNav = !['route-setup', 'delivery-request', 'tracking'].includes(currentPage);

  return (
    <div className="app-container">
      {renderPage()}
      {showNav && <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />}
    </div>
  );
}
