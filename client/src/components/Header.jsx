import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/ToastContext';
import { Bell } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const NotificationBell = () => {
  const { unreadCount, setShowCenter } = useNotification();
  return (
    <div 
      className="notif-bell-trigger" 
      onClick={() => setShowCenter(true)}
      style={{ position: 'relative', cursor: 'pointer', padding: 8, display: 'flex' }}
    >
      <Bell size={20} color={unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)'} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2, background: 'var(--accent-purple)',
          color: 'white', fontSize: 9, fontWeight: 900, minWidth: 16, height: 16,
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px var(--accent-purple)',
          border: '2px solid #05050a'
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default function Header({ pageLabel, isHidden, setPage }) {
  const { user } = useAuth();
  const [uptime, setUptime] = useState('00:00:00');
  const [isLocked, setIsLocked] = useState(false);
  const [packets, setPackets] = useState([]);

  // Lock Animation on mount
  useEffect(() => {
    setTimeout(() => setIsLocked(true), 300);
  }, []);

  // Uptime Counter
  useEffect(() => {
    const start = Date.now();
    const itv = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(itv);
  }, []);

  // Data Stream Effect
  useEffect(() => {
    const spawnPacket = () => {
      const id = Math.random();
      const content = Math.random() > 0.5 
        ? Math.random().toString(16).slice(2, 8).toUpperCase() 
        : Math.random().toString(2).slice(2, 8);
      
      setPackets(prev => [...prev, { id, content, top: Math.random() * 80 + 10 }]);
      setTimeout(() => {
        setPackets(prev => prev.filter(p => p.id !== id));
      }, 4000);
    };

    const itv = setInterval(() => {
      if (Math.random() > 0.6) spawnPacket();
    }, 1500);
    return () => clearInterval(itv);
  }, []);

  return (
    <header 
      className={`main-header header-desktop glass-card ${isHidden ? 'header-hidden' : ''}`}
      style={{
        position: 'sticky',
        top: 15,
        zIndex: 900,
        margin: '0 24px 20px',
        padding: '16px 28px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid var(--glass-border)',
        borderTop: '1px solid rgba(var(--primary-rgb), 0.3)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-glass), var(--glass-inner-glow)',
        overflow: 'visible'
      }}
    >
      {/* Background Visual Layer (Isolated for overflow:hidden) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit' }}>
        <div className="header-scanning-line" style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '1px',
          background: 'linear-gradient(to right, transparent, var(--primary), transparent)',
          opacity: 0.2, animation: 'header-scan 8s linear infinite'
        }}></div>
        
        {/* Data Stream */}
        {packets.map(p => (
          <div key={p.id} className="data-packet" style={{
            position: 'absolute', right: '-100px',
            top: `${p.top}%`,
            fontFamily: 'monospace', fontSize: '9px',
            color: 'var(--primary)', opacity: 0.3,
            whiteSpace: 'nowrap', pointerEvents: 'none',
            animation: 'data-zip 4s linear forwards'
          }}>
            {p.content}
          </div>
        ))}

        {/* Subtle Decorative Hex Fragments */}
        <div style={{ position: 'absolute', bottom: 6, left: '20%', fontSize: '8px', fontFamily: 'monospace', color: 'var(--text-muted)', opacity: 0.2, letterSpacing: '2px' }}>
          SEC_TOKEN: {Math.random().toString(16).slice(2, 10).toUpperCase()}
        </div>
        <div style={{ position: 'absolute', bottom: 6, right: '20%', fontSize: '8px', fontFamily: 'monospace', color: 'var(--text-muted)', opacity: 0.2, letterSpacing: '2px' }}>
          NODE_ID: {Math.random().toString(16).slice(2, 6).toUpperCase()}
        </div>
      </div>

      <div className="hud-corner hud-tl"></div>
      <div className="hud-corner hud-tr"></div>
      <div className="hud-corner hud-bl"></div>
      <div className="hud-corner hud-br"></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative', zIndex: 2 }}>
        <div className="header-status-dot-wrap">
          <div className="header-status-dot"></div>
          <div className="header-status-dot-pulse"></div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ 
              fontSize: 22, fontWeight: 900, margin: 0, 
              textTransform: 'uppercase', letterSpacing: '-0.5px', 
              color: 'var(--text-primary)', fontFamily: 'var(--font-display)',
              textShadow: '0 0 20px rgba(var(--primary-rgb), 0.2)'
            }}>
              {pageLabel}
            </h2>
          </div>
          <div className="ticker-content" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              color: 'var(--primary)', fontWeight: 800, fontSize: '10px', 
              letterSpacing: '1px', textTransform: 'uppercase',
              background: 'rgba(var(--primary-rgb), 0.1)',
              padding: '2px 6px', borderRadius: '4px'
            }}>
              ACTIVE
            </span>
            <span style={{ fontSize: 10, letterSpacing: '0.5px', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)', opacity: 0.7 }}>
              {user ? `// AUTH: ${user.name.toUpperCase()}` : '// GUEST_LINK_ANON'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Search Hub - Perfectly Centered */}
      <div style={{ 
        position: 'absolute', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'center',
        width: 'auto'
      }}>
        <GlobalSearch setPage={setPage} userRole={user?.role} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div className="header-uptime-tag" style={{ 
            fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', 
            letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 
          }}>
            <span className="uptime-pulse"></span>
            UPTIME: {uptime}
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'var(--font-display)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
          </div>
        </div>

        <NotificationBell />

        {user && (
          <div 
            className="header-avatar-wrap"
            onClick={() => setPage('settings')}
            style={{ 
              width: 42, height: 42, borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              padding: '2px', flexShrink: 0,
              boxShadow: '0 0 20px rgba(var(--primary-rgb), 0.2)',
              cursor: 'pointer', transition: 'transform 0.3s ease'
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {user.avatar?.startsWith('data:image') || user.avatar?.startsWith('http') ? (
                <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
              ) : (
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary)' }}>{user.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
          </div>
        )}

        <div className="live-status-pill" style={{ 
          display: 'flex', alignItems: 'center', gap: 10, 
          background: 'rgba(var(--primary-rgb), 0.1)', 
          padding: '6px 14px', 
          borderRadius: '99px', 
          border: '1px solid rgba(var(--primary-rgb), 0.2)',
          cursor: 'default',
          position: 'relative'
        }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px' }}>LIVE</span>
          <div className="pulse-dot"></div>
        </div>
      </div>

      <style>{`
        @keyframes header-scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(60px); }
          100% { transform: translateY(0); }
        }
        @keyframes data-zip {
          from { right: -100px; transform: scaleX(1.5); }
          to { right: 110%; transform: scaleX(1); }
        }
        .header-status-dot-wrap { position: relative; width: 10px; height: 10px; }
        .header-status-dot { 
          width: 8px; height: 8px; border-radius: 50%; 
          background: var(--primary); box-shadow: 0 0 10px var(--primary); 
        }
        .header-status-dot-pulse {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 1px solid var(--primary); opacity: 0;
          animation: dot-pulse 2s infinite;
        }
        @keyframes dot-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .uptime-pulse {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--accent-emerald); animation: blink 1s infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .header-avatar-wrap:hover { transform: scale(1.1) rotate(5deg); }
        .pulse-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--primary); animation: pulse-glow-small 1.5s infinite;
        }
        @keyframes pulse-glow-small {
          0%, 100% { box-shadow: 0 0 4px var(--primary); }
          50% { box-shadow: 0 0 12px var(--primary); transform: scale(1.2); }
        }
        .live-status-pill:hover { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.2); }
      `}</style>
    </header>
  );
}


