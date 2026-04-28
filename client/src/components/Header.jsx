import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/ToastContext';
import { Bell } from 'lucide-react';

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

export default function Header({ pageLabel, isHidden }) {
  const { user } = useAuth();
  const [uptime, setUptime] = useState('00:00:00');
  const [isLocked, setIsLocked] = useState(false);
  const headerRef = useRef(null);
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

  // Mouse Grid Glow
  const handleMouseMove = (e) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    headerRef.current.style.setProperty('--mouse-x', `${x}px`);
    headerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <header 
      ref={headerRef}
      onMouseMove={handleMouseMove}
      className={`main-header ${isLocked ? 'locked' : ''} ${isHidden ? 'header-hidden' : ''}`} 
      style={{
        position: 'sticky',
        top: 15,
        zIndex: 80,
        margin: '0 24px 20px',
        padding: '14px 28px',
        background: 'rgba(5, 5, 10, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(var(--primary-rgb), 0.2)',
        borderTop: '1px solid rgba(var(--primary-rgb), 0.4)',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'inset 0 0 20px rgba(var(--primary-rgb), 0.05), 0 10px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}
    >
      {/* Cyber Accents */}
      <div className="header-grid-bg"></div>
      <div className="header-scanning-line"></div>
      
      {/* Data Stream */}
      {packets.map(p => (
        <div key={p.id} className="data-packet" style={{
          top: `${p.top}%`,
          animation: 'data-zip 4s linear forwards'
        }}>
          {p.content}
        </div>
      ))}

      <div className="hud-corner hud-tl"></div>
      <div className="hud-corner hud-tr"></div>
      <div className="hud-corner hud-bl"></div>
      <div className="hud-corner hud-br"></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative', zIndex: 2 }}>
        <div className="header-status-dot"></div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', color: '#fff' }}>{pageLabel}</h2>
            <span className="header-metadata">SYS_ID: 004-X</span>
          </div>
          <div className="ticker-content" style={{ marginTop: 4 }}>
            <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>ACTIVE</span>
            <span style={{ margin: '0 8px', opacity: 0.3 }}>•</span>
            <span style={{ fontSize: 11, letterSpacing: '0.5px', fontFamily: 'JetBrains Mono' }}>
              {user ? `ESTABLISHED // USER: ${user.name.toUpperCase()}` : 'ASYNC_GUEST_LINK // ON'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'right' }}>
          <div className="header-metadata">UPTIME: {uptime}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
          </div>
        </div>

        <NotificationBell />

        {user && (
          <div style={{ 
            width: 38, height: 38, borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary), #06b6d4)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: 16, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
            border: '2px solid rgba(var(--primary-rgb), 0.3)',
            boxShadow: '0 0 15px rgba(var(--primary-rgb), 0.2)',
            cursor: 'pointer'
          }}>
            {user.avatar?.startsWith('data:image') || user.avatar?.startsWith('http') ? (
              <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
            ) : (
              user.avatar || user.name?.[0]?.toUpperCase()
            )}
          </div>
        )}

        <div className="btn-cyber-status" style={{ 
          display: 'flex', alignItems: 'center', gap: 10, 
          background: 'rgba(var(--primary-rgb), 0.15)', 
          padding: '8px 16px', 
          borderRadius: 2, 
          border: '1px solid rgba(var(--primary-rgb), 0.3)',
          cursor: 'crosshair',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: '2px' }}>LIVE</span>
          <div className="pulse-mini"></div>
        </div>
      </div>

      <style>{`
        .btn-cyber-status:hover {
          background: rgba(var(--primary-rgb), 0.25);
          border-color: var(--primary);
          box-shadow: 0 0 15px rgba(var(--primary-rgb), 0.4);
          transform: translateY(-1px);
        }
        .btn-cyber-status:hover .pulse-mini {
          animation-duration: 0.5s;
        }
      `}</style>
    </header>
  );
}


