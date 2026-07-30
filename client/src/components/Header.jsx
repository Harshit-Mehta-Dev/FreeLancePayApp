import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/ToastContext';
import { Bell, Settings } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { motion } from 'framer-motion';

const NotificationBell = () => {
  const { unreadCount, setShowCenter } = useNotification();
  return (
    <div
      className="notif-bell-trigger"
      onClick={() => setShowCenter(true)}
      title="Notifications"
      style={{
        position: 'relative', cursor: 'pointer',
        width: 38, height: 38, borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        transition: 'all 0.2s ease',
        flexShrink: 0
      }}
    >
      <Bell size={17} color={unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)'} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          background: 'var(--accent-purple)', color: 'white',
          fontSize: 9, fontWeight: 900, minWidth: 17, height: 17,
          borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 8px var(--accent-purple)',
          border: '2px solid var(--bg-primary)'
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default function Header({ pageLabel, isHidden, setPage }) {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: isHidden ? -90 : 0, opacity: isHidden ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 280,
          right: 0,
          height: 64,
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          background: isScrolled
            ? 'rgba(5, 10, 30, 0.92)'
            : 'rgba(5, 10, 30, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: isScrolled ? '0 4px 24px rgba(0,0,0,0.4)' : '0 1px 10px rgba(0,0,0,0.2)',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* ── Left: Live indicator + Page title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180, flex: '0 0 auto' }}>
          {/* Pulsing live dot */}
          <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 8px var(--primary)'
            }} />
            <div style={{
              position: 'absolute', inset: -3,
              borderRadius: '50%',
              border: '1.5px solid var(--primary)',
              opacity: 0.5,
              animation: 'ping 2s ease-in-out infinite'
            }} />
          </div>

          <div>
            <div style={{
              fontSize: 15, fontWeight: 900, color: 'var(--text-primary)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              fontFamily: 'var(--font-display)', lineHeight: 1,
            }}>
              {pageLabel}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 3,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 800, color: 'var(--primary)',
                textTransform: 'uppercase', letterSpacing: '1px',
                background: 'rgba(var(--primary-rgb), 0.12)',
                padding: '1px 5px', borderRadius: 3
              }}>
                ACTIVE
              </span>
              {user && (
                <span style={{
                  fontSize: 9, color: 'var(--text-muted)',
                  fontFamily: 'monospace', letterSpacing: '0.3px'
                }}>
                  {user.name?.split(' ')[0]?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Center: Global Search ── */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
          <GlobalSearch setPage={setPage} userRole={user?.role} />
        </div>

        {/* ── Right: Date, Bell, Avatar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          flex: '0 0 auto', justifyContent: 'flex-end'
        }}>
          {/* Date */}
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
            letterSpacing: '0.5px', fontFamily: 'var(--font-display)',
            padding: '5px 10px', background: 'rgba(255,255,255,0.03)',
            borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
            whiteSpace: 'nowrap'
          }}>
            {dateStr}
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Avatar → Settings */}
          {user && (
            <div
              onClick={() => setPage('settings')}
              title="Settings"
              style={{
                width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                padding: 2, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(var(--primary-rgb), 0.3)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div style={{
                width: '100%', height: '100%', borderRadius: '8px',
                background: 'var(--bg-primary)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {user.avatar?.startsWith('data:image') || user.avatar?.startsWith('http') ? (
                  <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary)' }}>
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* LIVE pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(var(--primary-rgb), 0.08)',
            padding: '5px 10px', borderRadius: 8,
            border: '1px solid rgba(var(--primary-rgb), 0.18)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 6px #22c55e',
              animation: 'ping 2s ease-in-out infinite'
            }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#22c55e', letterSpacing: '1.5px' }}>
              LIVE
            </span>
          </div>
        </div>

        <style>{`
          @keyframes ping {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.4); opacity: 0.3; }
          }
          .notif-bell-trigger:hover {
            background: rgba(var(--primary-rgb), 0.1) !important;
            border-color: rgba(var(--primary-rgb), 0.2) !important;
          }
        `}</style>
      </motion.header>
    </>
  );
}
