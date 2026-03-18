import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from './config/firebase.js';
import { userService, seedDemoData } from './services/api.js';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RouteSetup from './pages/RouteSetup.jsx';
import DeliveryRequest from './pages/DeliveryRequest.jsx';
import MatchingPage from './pages/MatchingPage.jsx';
import TrackingPage from './pages/TrackingPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import BottomNav from './components/BottomNav.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState({});
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Splash screen
    const timer = setTimeout(() => setShowSplash(false), 2200);

    // Auth listener
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const p = await userService.getProfile(u.uid);
        setProfile(p);
        seedDemoData();
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async () => {
    const p = await userService.getProfile(auth.currentUser?.uid);
    setProfile(p);
    setUser(auth.currentUser);
    seedDemoData();
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
    setPageParams({});
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setCurrentPage('dashboard');
  };

  // Splash Screen
  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-logo font-display">DELo</div>
        <div className="splash-tagline">delivery on the go ✨</div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="splash-logo font-display" style={{ fontSize: '2rem' }}>DELo</div>
      </div>
    );
  }

  // Auth
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Main App
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} profile={profile} onNavigate={handleNavigate} />;
      case 'route-setup':
        return <RouteSetup onNavigate={handleNavigate} onBack={handleBack} />;
      case 'delivery-request':
        return <DeliveryRequest onNavigate={handleNavigate} onBack={handleBack} />;
      case 'matching':
        return <MatchingPage onNavigate={handleNavigate} onBack={handleBack} />;
      case 'tracking':
        return <TrackingPage deliveryId={pageParams.deliveryId} onNavigate={handleNavigate} onBack={handleBack} />;
      case 'payments':
        return <PaymentsPage onNavigate={handleNavigate} onBack={handleBack} />;
      case 'profile':
        return <ProfilePage user={user} profile={profile} onLogout={handleLogout} onBack={handleBack} />;
      default:
        return <Dashboard user={user} profile={profile} onNavigate={handleNavigate} />;
    }
  };

  const showNav = !['route-setup', 'delivery-request', 'tracking'].includes(currentPage);

  return (
    <div className="app-container">
      {renderPage()}
      {showNav && (
        <BottomNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
