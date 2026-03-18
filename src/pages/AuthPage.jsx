import { useState, useRef } from 'react';
import { auth } from '../config/firebase.js';
import { userService } from '../services/api.js';

export default function AuthPage({ onAuthSuccess }) {
  const [step, setStep] = useState('welcome'); // welcome, phone, otp, profile-setup
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef([]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Enter a valid 10-digit number');
      return;
    }
    setError('');
    setLoading(true);
    // Simulate OTP send
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1200);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1];
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) return;
    setLoading(true);
    setError('');
    try {
      await auth.signInWithPhone('+91' + phone);
      setStep('profile-setup');
    } catch (err) {
      setError('Invalid OTP. Try again.');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await auth.signInWithGoogle();
      setName(user.displayName || '');
      setStep('profile-setup');
    } catch (err) {
      setError('Google sign-in failed');
    }
    setLoading(false);
  };

  const handleProfileComplete = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    try {
      await auth.updateProfile({ displayName: name });
      await userService.createProfile(auth.currentUser.uid, {
        name,
        phone: auth.currentUser.phone || '',
        email: auth.currentUser.email || ''
      });
      onAuthSuccess();
    } catch (err) {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-container">
        {/* Logo */}
        <div className="auth-logo-section animate-fadeIn">
          <div className="auth-logo font-display">DELo</div>
          <p className="auth-tagline">delivery on the go ✨</p>
        </div>

        {/* Welcome */}
        {step === 'welcome' && (
          <div className="auth-content animate-slideUp stagger-2">
            <h2 className="auth-title font-display">Join the movement</h2>
            <p className="auth-subtitle">Turn your daily commute into deliveries. Send packages with people already going your way.</p>

            <div className="auth-actions">
              <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep('phone')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Continue with Phone
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button className="btn btn-secondary btn-full btn-lg" onClick={handleGoogleSignIn} disabled={loading}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </div>

            <p className="auth-terms">
              By continuing, you agree to DELo's <a href="#" className="text-accent">Terms</a> & <a href="#" className="text-accent">Privacy Policy</a>
            </p>
          </div>
        )}

        {/* Phone Input */}
        {step === 'phone' && (
          <div className="auth-content animate-slideUp">
            <button className="auth-back" onClick={() => setStep('welcome')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <h2 className="auth-title font-display">Your phone number</h2>
            <p className="auth-subtitle">We'll send a verification code</p>

            <form onSubmit={handlePhoneSubmit}>
              <div className="phone-input-container">
                <div className="phone-prefix">🇮🇳 +91</div>
                <input
                  type="tel"
                  className="input-field phone-input"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  autoFocus
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || phone.length < 10} style={{ marginTop: '24px' }}>
                {loading ? <span className="btn-spinner" /> : 'Send OTP'}
              </button>
            </form>
          </div>
        )}

        {/* OTP Verification */}
        {step === 'otp' && (
          <div className="auth-content animate-slideUp">
            <button className="auth-back" onClick={() => setStep('phone')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <h2 className="auth-title font-display">Verify OTP</h2>
            <p className="auth-subtitle">Enter the code sent to +91 {phone}</p>

            <div className="otp-container">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="tel"
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  maxLength={1}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn btn-primary btn-full btn-lg" onClick={handleOtpSubmit} disabled={loading || otp.join('').length < 6} style={{ marginTop: '24px' }}>
              {loading ? <span className="btn-spinner" /> : 'Verify'}
            </button>

            <button className="btn btn-ghost btn-full" style={{ marginTop: '12px' }}>
              Resend OTP
            </button>
          </div>
        )}

        {/* Profile Setup */}
        {step === 'profile-setup' && (
          <div className="auth-content animate-slideUp">
            <h2 className="auth-title font-display">Almost there!</h2>
            <p className="auth-subtitle">Set up your profile to start using DELo</p>

            <div className="profile-setup-avatar">
              <div className="avatar avatar-xl">
                {name ? name[0].toUpperCase() : '?'}
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '24px' }}>
              <label className="input-label">Your Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn btn-primary btn-full btn-lg" onClick={handleProfileComplete} disabled={loading || !name.trim()} style={{ marginTop: '24px' }}>
              {loading ? <span className="btn-spinner" /> : 'Start Using DELo →'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh; min-height: 100dvh;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }
        .auth-bg { position: absolute; inset: 0; z-index: 0; }
        .auth-orb {
          position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15;
          animation: float 8s ease-in-out infinite;
        }
        .auth-orb-1 { width: 300px; height: 300px; background: var(--accent-purple); top: -50px; right: -50px; }
        .auth-orb-2 { width: 250px; height: 250px; background: var(--accent-blue); bottom: -30px; left: -60px; animation-delay: 2s; }
        .auth-orb-3 { width: 200px; height: 200px; background: var(--accent-pink); top: 50%; left: 50%; animation-delay: 4s; }
        .auth-container {
          position: relative; z-index: 1; width: 100%; max-width: 400px;
        }
        .auth-logo-section { text-align: center; margin-bottom: 48px; }
        .auth-logo {
          font-size: 3.5rem; font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; letter-spacing: -0.02em;
        }
        .auth-tagline { color: var(--text-muted); font-size: 0.95rem; margin-top: 4px; }
        .auth-content {
          background: var(--gradient-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
          padding: 32px; position: relative;
        }
        .auth-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
        .auth-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 32px; }
        .auth-actions { display: flex; flex-direction: column; gap: 16px; }
        .auth-divider {
          display: flex; align-items: center; gap: 16px;
          color: var(--text-muted); font-size: 0.8rem;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border-subtle);
        }
        .auth-terms {
          text-align: center; font-size: 0.75rem; color: var(--text-muted);
          margin-top: 24px; line-height: 1.5;
        }
        .auth-back {
          position: absolute; top: 20px; left: 20px; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-md); background: var(--bg-glass);
          border: 1px solid var(--border-subtle);
          transition: all var(--transition-smooth); color: var(--text-secondary);
        }
        .auth-back:hover { background: var(--bg-glass-hover); color: var(--text-primary); }
        .auth-error {
          color: var(--accent-pink); font-size: 0.8rem; margin-top: 12px; text-align: center;
        }
        .phone-input-container {
          display: flex; gap: 8px; align-items: stretch;
        }
        .phone-prefix {
          display: flex; align-items: center; padding: 0 16px;
          background: var(--bg-glass); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); font-size: 0.9rem; color: var(--text-secondary);
          white-space: nowrap;
        }
        .phone-input { flex: 1; font-size: 1.1rem !important; letter-spacing: 0.1em; }
        .profile-setup-avatar {
          display: flex; justify-content: center; margin-top: 8px;
        }
        .text-accent { color: var(--accent-purple); }
        .btn-spinner {
          width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
