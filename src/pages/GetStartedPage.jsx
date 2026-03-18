import { useState } from 'react';

export default function GetStartedPage({ onComplete }) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Send Anything",
      description: "Fast, peer-to-peer delivery across the city.",
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      )
    },
    {
      title: "Earn While You Commute",
      description: "Pick up packages on your everyday route.",
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20"></path>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      title: "Track in Real Time",
      description: "Secure OTP verification and live tracking.",
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      )
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('delo_onboarding_completed', 'true');
      onComplete();
    }
  };

  return (
    <div className="page" style={{ 
      display: 'flex', flexDirection: 'column', height: '100dvh', padding: '0', 
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '140%',
        background: 'radial-gradient(circle at center, rgba(212, 255, 0, 0.05) 0%, transparent 60%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        <div style={{ padding: '60px 24px 24px', display: 'flex', justifyContent: 'center' }}>
          <h1 className="font-hero text-gradient" style={{ fontSize: '2.5rem' }}>DELo</h1>
        </div>

        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {slides.map((slide, i) => (
            <div 
              key={i}
              style={{
                position: 'absolute', width: '100%', padding: '0 40px',
                opacity: step === i ? 1 : 0,
                transform: `translateX(${(i - step) * 50}px) scale(${step === i ? 1 : 0.95})`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
              }}
            >
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '32px', 
                background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', marginBottom: '40px',
                border: '1px solid var(--border-color)', color: 'var(--accent-primary)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}>
                {slide.icon}
              </div>
              <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 800 }}>
                {slide.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: 1.5 }}>
                {slide.description}
              </p>
            </div>
          ))}
        </div>

        <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {slides.map((_, i) => (
              <div 
                key={i}
                style={{
                  width: step === i ? '24px' : '8px', height: '8px', borderRadius: '4px',
                  background: step === i ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
          
          <button 
            className="btn btn-primary btn-full"
            style={{ padding: '20px', fontSize: '1.2rem' }}
            onClick={handleNext}
          >
            {step === slides.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
