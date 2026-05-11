import React, { useEffect, useState } from 'react';

export default function VirtualInbox() {
  const [code, setCode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code') || '';
  });
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#080812', color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif', padding: '40px 20px',
      backgroundimage: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.05), transparent)'
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#a78bfa', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🛡️</span> Sentinel Inbox
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 0.5 }}>SECURE ENCRYPTED VERIFICATION NODE</p>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
            ENCRYPTION ACTIVE
          </div>
        </header>

        <div style={{ background: 'rgba(15, 15, 25, 0.6)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 40, boxShadow: '0 30px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
            <span>SRC: security@freelance-pay.cloud</span>
            <span>TS: {time}</span>
          </div>

          <h2 style={{ fontSize: 20, marginBottom: 24, fontWeight: 700 }}>Action Required: Identity Verification</h2>
          
          <div style={{ lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
            <p>A verification request was initiated for your account. Please use the temporary access code below.</p>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(30, 30, 50, 0.5) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '32px', borderRadius: 20, textAlign: 'center', margin: '32px 0',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: 10, color: '#fff', marginBottom: 16, textShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}>
                {code || '000000'}
              </div>
              
              <button 
                onClick={handleCopy}
                style={{
                  background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', padding: '8px 16px', borderRadius: 12,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8
                }}
              >
                {copied ? '✅ Copied!' : '📋 Copy Code'}
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              🔒 This code is protected by end-to-end encryption and will expire in 10 minutes.
            </p>
          </div>
        </div>

        <footer style={{ marginTop: 40, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
          SENTINEL SECURITY PROTOCOL v2.4.0-REV
        </footer>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
