import React, { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('fp_cookie_consent');
    if (!consent) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('fp_cookie_consent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent-card" style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      right: 24,
      zIndex: 9999,
      maxWidth: 480,
      margin: '0 auto',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--glass-border)',
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 24 }}>🍪</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Cookie Consent</h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            We use essential cookies to keep you signed in and store your theme preferences. By continuing, you agree to our use of cookies.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button 
          onClick={() => setVisible(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '8px 12px' }}
        >
          Decline
        </button>
        <button 
          onClick={accept}
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 20px', fontSize: 13 }}
        >
          Accept All
        </button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
