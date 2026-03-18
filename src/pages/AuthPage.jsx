import { useState } from 'react';
import { authAPI, auth } from '../config/firebase.js';
import { userService } from '../services/api.js';

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily'
];

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Missing credentials');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await authAPI.signInEmail(email, password);
        onAuthSuccess();
      } else {
        const res = await authAPI.signUpEmail(email, password);
        await authAPI.updateUserName(name);
        await userService.createProfile(res.user.uid, { 
            name, 
            email, 
            avatar: selectedAvatar,
            defaultMode: 'sender'
        });
        onAuthSuccess();
      }
    } catch (err) {
      setError(err.message || 'Auth failed');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await authAPI.signInGoogle();
      const u = res.user;
      const p = await userService.getProfile(u.uid);
      if (!p) {
         await userService.createProfile(u.uid, { 
           name: u.displayName || 'User', 
           email: u.email || '', 
           avatar: u.photoURL || DEFAULT_AVATARS[0],
           defaultMode: 'sender'
         });
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Google error');
    }
    setLoading(false);
  };

  return (
    <div className="page animate-fadeIn" style={{ padding: '60px 24px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-md" style={{ marginBottom: '80px' }}>
         <div className="logo-box" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
         </div>
         <h1 className="text-xl font-display" style={{ fontWeight: 900 }}>DELo</h1>
      </div>

      <div className="stagger-1">
        <h2 className="font-display" style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, marginBottom: '24px' }}>
          {mode === 'login' ? 'Welcome back.' : 'Join the move.'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '1.1rem' }}>
          {mode === 'login' ? 'Sign in to access your dashboard.' : "India's first decentralized delivery network."}
        </p>

        <form onSubmit={handleEmailAuth} className="flex flex-col">
          {mode === 'signup' && (
            <>
              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label">Your Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Kshitij Pandey"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Profile Picture</label>
                <div className="flex items-center gap-md" style={{ paddingTop: '8px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-primary)', flexShrink: 0 }}>
                    <img src={selectedAvatar} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <label className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', flex: 1 }}>
                    Upload Image
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setSelectedAvatar(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 700 }}>{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginBottom: '24px' }}>
             {loading ? 'Authenticating...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>

          <div className="text-center" style={{ marginBottom: '24px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>OR</div>

          <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="btn btn-secondary btn-full" style={{ background: 'var(--bg-glass)', gap: '16px' }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '48px' }}>
           <button 
             onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
             style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}
           >
             {mode === 'login' ? "Don't have an account? " : "Already registered? "}
             <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{mode === 'login' ? 'Sign up' : 'Log in'}</span>
           </button>
        </div>
      </div>
    </div>
  );
}
