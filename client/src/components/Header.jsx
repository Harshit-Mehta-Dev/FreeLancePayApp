import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/ToastContext';
import { Bell, Zap, Activity, Clock, ShieldCheck, Globe } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isLocked, setIsLocked] = useState(false);
  const [packets, setPackets] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock Animation on mount
  useEffect(() => {
    setTimeout(() => setIsLocked(true), 300);
  }, []);



  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: isHidden ? -120 : 0, 
        opacity: isHidden ? 0 : 1 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        "main-header fixed top-0 z-[900] flex items-center justify-between transition-all duration-500"
      )}
      style={{ 
        left: 'clamp(0px, 280px, 280px)',
        right: 0,
        height: '72px',
        background: isScrolled ? 'rgba(2, 6, 23, 0.85)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
        padding: '0 40px',
        boxShadow: isScrolled ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)' : 'none'
      }}
    >
      {/* Flex Layout for Better Responsiveness */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%',
        gap: 20
      }}>
        {/* Left Side: Page Identity */}
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

        {/* Center: Search Hub */}
        <div style={{ display: 'flex', justifyContent: 'center', zIndex: 10 }}>
          <GlobalSearch setPage={setPage} userRole={user?.role} />
        </div>

        {/* Right Side: Actions & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
          </div>

          <NotificationBell />

          {user && (
            <div 
              className="header-avatar-wrap"
              onClick={() => setPage('settings')}
              style={{ 
                width: 40, height: 40, borderRadius: '12px', 
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                padding: '2px', flexShrink: 0,
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: '10px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {user.avatar?.startsWith('data:image') || user.avatar?.startsWith('http') ? (
                  <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary)' }}>{user.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>
          )}

          <div className="live-status-pill" style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            background: 'rgba(var(--primary-rgb), 0.08)', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            border: '1px solid rgba(var(--primary-rgb), 0.15)',
            cursor: 'default'
          }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px' }}>LIVE</span>
            <div className="pulse-dot"></div>
          </div>
        </div>
      </div>

      <style>{`
        .main-header {
          transition: border-color 0.3s ease, background 0.3s ease;
        }
        .main-header:hover {
          border-color: rgba(var(--primary-rgb), 0.2);
          background: rgba(15, 23, 42, 0.5);
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </motion.header>
  );
}


