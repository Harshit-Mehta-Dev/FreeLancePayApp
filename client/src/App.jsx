import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import Income from './pages/Income';
import Cashflow from './pages/Cashflow';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import SecurityDashboard from './pages/SecurityDashboard';
import Legal from './pages/Legal';
import Feedback from './pages/Feedback';
import Bugs from './pages/Bugs';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import TimeTracker from './pages/TimeTracker';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import VirtualInbox from './pages/VirtualInbox';
import Footer from './components/Footer';
import Header from './components/Header';
import axios from 'axios';
import { API, apiHeaders } from './api/config';
import { notificationEngine } from './utils/NotificationManager';
import CookieConsent from './components/CookieConsent';
import { AuroraBackground } from './components/ui/aurora-background';

// Pages that require authentication
const AUTH_REQUIRED = [
  'bills', 'income', 'cashflow', 'payments', 'calendar', 'settings', 'feedback', 'bugs',
  'clients', 'projects', 'time', 'invoices', 'expenses'
];

// ─── Audio Engine (Mechanical Switch Sound) ───
const playClickSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master Gain
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    masterGain.connect(audioCtx.destination);

    // 1. "Click" Layer - High frequency transient
    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    clickOsc.type = 'square'; // Sharper than sine
    clickOsc.frequency.setValueAtTime(800, audioCtx.currentTime);
    clickOsc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.02);
    
    clickGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);
    
    clickOsc.connect(clickGain);
    clickGain.connect(masterGain);
    
    // 2. "Mechanical Thud" - Low frequency body
    const thudOsc = audioCtx.createOscillator();
    const thudGain = audioCtx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(120, audioCtx.currentTime);
    thudOsc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.08);
    
    thudGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    thudGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    thudOsc.connect(thudGain);
    thudGain.connect(masterGain);

    // 3. "Noise" Layer - Texture (using procedural noise)
    const bufferSize = audioCtx.sampleRate * 0.05; // 50ms of noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.02);
    
    noiseSource.connect(noiseGain);
    noiseGain.connect(masterGain);

    // Start all
    clickOsc.start();
    thudOsc.start();
    noiseSource.start();
    
    // Stop all
    clickOsc.stop(audioCtx.currentTime + 0.05);
    thudOsc.stop(audioCtx.currentTime + 0.15);
    noiseSource.stop(audioCtx.currentTime + 0.05);
    
  } catch { /* Audio blocked */ }
};

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', public: true },
  { id: 'clients',   label: 'Clients',   icon: '👥', public: false },
  { id: 'projects',  label: 'Projects',  icon: '📁', public: false },
  { id: 'time',      label: 'Time Tracker', icon: '⏱️', public: false },
  { id: 'invoices',  label: 'Invoices',  icon: '🧾', public: false },
  { id: 'bills',     label: 'Bills',     icon: '💳', public: false },
  { id: 'expenses',  label: 'Expenses',  icon: '💸', public: false },
  { id: 'calendar',  label: 'Calendar',  icon: '📅', public: false },
  { id: 'income',    label: 'Income',    icon: '💰', public: false },
  { id: 'cashflow',  label: 'Cashflow',  icon: '📊', public: false },
  { id: 'payments',  label: 'Payment History', icon: '📜', public: false },
  { id: 'feedback',  label: 'Feedback', icon: '💬', public: false },
  { id: 'bugs',      label: 'Bug Reports', icon: '🐛', public: false },
  { id: 'security',  label: 'Security', icon: '🛡️', public: false, adminOnly: true },
];

// ─── Auth Gate Banner ──────────────────────────────────────────────────────────
const AuthGateBanner = ({ pageName, onLogin, onRegister }) => (
  <div className="page">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        {/* Glow orb */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px', boxShadow: '0 0 60px rgba(var(--primary-rgb),0.35)', animation: 'float 3s ease-in-out infinite' }}>
          🔐
        </div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          Sign in to Access {pageName}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
          Create a free account or sign in to unlock bills tracking, income logging, cashflow projections, and more.
        </p>

        {/* Feature teaser */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
          {[
            { icon: '✅', text: 'Add & manage recurring bills' },
            { icon: '📊', text: 'View cashflow projections' },
            { icon: '💰', text: 'Track freelance income' },
            { icon: '🧾', text: 'Full payment history' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--glass)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onRegister} style={{ fontSize: 15, padding: '12px 28px' }}>
            🚀 Create Free Account
          </button>
          <button className="btn btn-ghost" onClick={onLogin} style={{ fontSize: 15, padding: '12px 28px' }}>
            🔐 Sign In
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, logout, open, setOpen, onLogin, onRegister, onRefresh }) {
  const { toggleTheme, isDark } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleNav = (id) => {
    setPage(id);
    setOpen(false);
  };
  void handleNav; // Keep for future use if needed, but resolve lint
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} style={{
      background: 'var(--bg-glass)',
      borderRight: '1px solid var(--glass-border)',
      boxShadow: 'none', /* Elevation through lightness */
      backdropFilter: 'blur(40px) saturate(200%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    }}>
      <div className="sidebar-logo" onClick={onRefresh}>
        <div className="sidebar-logo-icon" style={{ fontSize: 18 }}>💸</div>
        <div>
          <div className="sidebar-logo-text">FreeLancePay App</div>
          <div className="sidebar-logo-sub">Bills Dashboard</div>
        </div>
      </div>

      <div className="nav-section">Menu</div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.filter(n => !n.adminOnly || (user && user.role === 'admin')).map(n => (
          <button key={n.id} className={`nav-link ${page === n.id ? 'active' : ''}`}
            onClick={() => { setPage(n.id); setOpen(false); }}
            data-id={n.id}
            style={{ position: 'relative' }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            {n.label}
            {n.adminOnly && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>ADM</span>}
            {!n.public && !user && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 99 }}>
                🔒
              </span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
        <div className="nav-section" style={{ paddingTop: 0 }}>Account</div>

        {/* ─── Theme Toggle (logged-in only) ─── */}
        {user && (
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={toggleTheme}
              className="glass-card"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{isDark ? '🌙' : '☀️'}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              {/* Animated pill toggle */}
              <div style={{
                width: 42, height: 24, borderRadius: 99,
                background: isDark ? 'var(--primary-dark)' : '#f59e0b',
                position: 'relative', transition: 'background 0.3s ease', flexShrink: 0
              }}>
                <div style={{
                  position: 'absolute', top: 3,
                  left: isDark ? 20 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.3s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9
                }}>
                  {isDark ? '🌙' : '☀️'}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ─── Sound Toggle ─── */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => {
              const newVal = !soundEnabled;
              setSoundEnabled(newVal);
              localStorage.setItem('click_sound', newVal);
            }}
            className="glass-card"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              cursor: 'pointer', opacity: soundEnabled ? 1 : 0.7,
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{soundEnabled ? '🔊' : '🔇'}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Audio Feedback</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: soundEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
              {soundEnabled ? 'ON' : 'OFF'}
            </div>
          </button>
        </div>

        {user && (
          <button className={`nav-link ${page === 'settings' ? 'active' : ''}`}
            onClick={() => { setPage('settings'); setOpen(false); }}
            data-id="settings">
            <span style={{ fontSize: 18 }}>⚙️</span> Settings
          </button>
        )}

        {user ? (
          <div style={{ padding: '14px', marginTop: 8, background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                {user.avatar?.startsWith('data:image') || user.avatar?.startsWith('http') ? (
                  <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                ) : (
                  user.avatar || user.name?.[0]?.toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{user.name}</div>
                  {user.email === 'harshitmehta1012@gmail.com' && (
                    <span style={{ fontSize: 8, padding: '1px 5px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', borderRadius: 4, fontWeight: 900, flexShrink: 0, letterSpacing: '0.5px' }}>SENIOR ADMIN</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {user.email === 'harshitmehta1012@gmail.com' ? 'Senior Administrator / Developer' : user.role === 'admin' ? 'Administrator' : 'Freelancer Account'}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (window.confirm("🔴 SECURE LOGOUT\n\nAre you sure you want to terminate your session? You will need to re-authenticate to access your financial dashboard.")) {
                  logout();
                }
              }} 
              className="btn-logout-premium"
              style={{ width: '100%', padding: '10px' }}
              title="Secure Logout"
            >
              <div className="logout-content">
                <span style={{ fontSize: 14 }}>🚪</span>
                <span className="logout-label">SECURE LOGOUT</span>
              </div>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, padding: '0 4px' }}>
            <button className="btn btn-primary btn-sm" onClick={onRegister} style={{ width: '100%', justifyContent: 'center' }}>
              🚀 Get Started Free
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onLogin} style={{ width: '100%', justifyContent: 'center' }}>
              🔐 Sign In
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '0 12px', marginTop: 'auto', paddingBottom: 16 }}>
        <button 
          onClick={() => { setPage('legal'); setOpen(false); }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.7 }}
        >
          ⚖️ Legal & Privacy
        </button>
      </div>
    </aside>
  );
}

function MobileHeader({ setOpen }) {
  return (
    <div className="mobile-header glass-card" style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 'var(--z-header)', 
      padding: '12px 16px', 
      background: 'var(--bg-glass)', 
      borderBottom: '1px solid var(--glass-border)', 
      backdropFilter: 'blur(20px) saturate(180%)', 
      WebkitBackdropFilter: 'blur(20px) saturate(180%)', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderRadius: 0,
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 15px rgba(var(--primary-rgb), 0.3)', color: 'white' }}>💸</div>
        <span style={{ letterSpacing: -0.5, color: 'var(--text-primary)' }}>FreeLancePay</span>
      </div>
      <button 
        onClick={() => setOpen(o => !o)} 
        className="btn-icon glass-card"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: 20, width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        ☰
      </button>
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────────
const MaintenanceOverlay = () => {
  const messages = [
    "Just taking a quick nap... we'll be back in a flash! ✨",
    "Brewing some fresh financial magic just for you. ☕",
    "Polishing your dashboard to a high premium shine. 💎",
    "Our numbers are doing some yoga. Namaste. 🧘",
    "The data streams are resting. Waking them up soon. 🌙",
    "Adding a touch of stardust to your financial vault. 🌌",
  ];
  const [msg, setMsg] = useState(messages[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsg(messages[Math.floor(Math.random() * messages.length)]);
        setFade(true);
      }, 800);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'var(--bg-primary)', zIndex: 999999, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(30px)', color: 'var(--text-primary)', textAlign: 'center', padding: 20
    }}>
      <div className="maintenance-container" style={{
        padding: '50px 60px', background: 'var(--bg-glass)',
        borderRadius: 40, border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        transition: 'all 0.5s ease',
        cursor: 'default'
      }}>
        <div className="maintenance-anim" style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 40px' }}>
          <div className="pulse-orb" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary)', opacity: 0.2, animation: 'maintenance-pulse 2s infinite' }}></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 50, height: 50 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
              <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z"/>
              <path d="M12 22V12" strokeOpacity="0.5"/>
              <path d="M21 7L12 12L3 7" strokeOpacity="0.5"/>
            </svg>
          </div>
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -1 }}>
          System Maintenance
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)', maxWidth: 420, fontSize: '1.2rem', marginTop: 25, 
          transition: 'all 0.8s ease', opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(10px)',
          minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500
        }}>
          {msg}
        </p>
        <div style={{ marginTop: 40, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: 2 }}>
          <div style={{ width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%', animation: 'blink 1.5s infinite' }}></div>
          RECONNECTING...
        </div>
      </div>
      <style>{`
        @keyframes maintenance-pulse { 0% { transform: scale(0.9); opacity: 0.4; } 50% { transform: scale(1.4); opacity: 0.1; } 100% { transform: scale(0.9); opacity: 0.4; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        .maintenance-container:hover { transform: scale(1.02) translateY(-5px); border-color: var(--primary); }
      `}</style>
    </div>
  );
};

export default function App() {
  const { user, loading, isBanned, logout } = useAuth();
  const { colorThemeId } = useTheme();
  const [page, setPage] = useState('dashboard');
  const [pageData, setPageData] = useState(null);
  const [billFilter, setBillFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null); // null | 'login' | 'register'
  const [showWelcome, setShowWelcome] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Force reset to dashboard on every fresh load/refresh
    // user requested to ALWAYS open dashboard, so we force it.
    if (page !== 'dashboard') setPage('dashboard');
    
    // Clean up URL to keep it at root
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate heavy loading/refresh
    setTimeout(() => {
      window.location.reload();
    }, 2500);
  };

  // Real-time Server Monitor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      res => {
        setServerDown(false);
        return res;
      },
      err => {
        if (!err.response) {
          setServerDown(true);
        }
        return Promise.reject(err);
      }
    );
    
    // Heartbeat check every 10s
    const heartbeat = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/auth/me`);
        if (res.data.is_banned) {
          window.location.reload(); // Force trigger ban overlay
        }
        setServerDown(false);
      } catch (e) {
        if (!e.response) {
          setServerDown(true);
        } else if (e.response.status === 403) {
          // IMMEDIATE BAN ENFORCEMENT
          window.location.reload(); 
        }
      }
    }, 5000);

    return () => {
      axios.interceptors.response.eject(interceptor);
      clearInterval(heartbeat);
    };
  }, []);

  // Interactive Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Hide/Show Header logic
      if (scrollY > lastScrollY.current && scrollY > 100) {
        setIsHeaderHidden(true);
      } else {
        setIsHeaderHidden(false);
      }
      lastScrollY.current = scrollY;

      // Parallax Background
      const bg = document.querySelector('.parallax-bg');
      if (bg) {
        bg.style.transform = `translateY(${scrollY * 0.1}px)`;
      }
    };

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 30;
      const yPos = (clientY / window.innerHeight - 0.5) * 30;
      
      const bg = document.querySelector('.parallax-bg');
      if (bg) {
        bg.style.backgroundPosition = `${50 + xPos * 0.2}% ${50 + yPos * 0.2}%`;
      }
    };

    const handleMouseLeave = () => {
      // Logic removed as per user request
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.05 });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));

    // Global Click Sound Listener
    const handleGlobalClick = (e) => {
      const isClickable = e.target.closest('button, a, .nav-link, .sidebar-logo, .clickable');
      if (isClickable && localStorage.getItem('click_sound') !== 'false') {
        playClickSound();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleGlobalClick);
    
    return () => {
      elements.forEach(el => observer.unobserve(el));
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [page, user, isRefreshing]);

  // Cyber-Cloud Notification Sentinel
  useEffect(() => {
    if (!user) return;

    const checkFinancials = async () => {
      try {
        const { data: bills } = await axios.get(`${API}/bills`, { headers: apiHeaders() });
        const overdue = bills.filter(b => b.status === 'overdue');
        
        if (overdue.length > 0) {
          const first = overdue[0];
          notificationEngine.alertOverdue(
            first.name, 
            first.amount, 
            user.currency === 'INR' ? '₹' : (user.currency === 'EUR' ? '€' : '$')
          );
        }
      } catch (err) {
        console.warn('Sentinel failed to scan financials', err);
      }
    };

    // Check once on login/refresh
    checkFinancials();
  }, [user]);

  const envAssets = React.useMemo(() => {
    const genStreams = () => [...Array(15)].map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${Math.random() * 2 + 2}s`
    }));
    const genDrops = () => [...Array(12)].map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 3 + 4}s`,
      fontSize: `${Math.random() * 15 + 15}px`,
      emoji: ['💸', '✨', '💰', '💎'][Math.floor(Math.random() * 4)]
    }));
    const genParticles = () => [...Array(12)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${12 + Math.random() * 12}s`,
      size: `${12 + Math.random() * 10}px`
    }));
    return { streams: genStreams(), drops: genDrops(), particles: genParticles() };
  }, []);

  if (loading || isRefreshing) return (
    <div className="refresh-overlay">
      {/* Background Data Streams */}
      {envAssets.streams.map((s, i) => (
        <div key={`stream-${i}`} className="data-stream" style={{
          left: s.left,
          animationDelay: s.delay,
          animationDuration: s.duration
        }} />
      ))}

      {/* Floating Money Particles */}
      {envAssets.drops.map((d, i) => (
        <div key={`drop-${i}`} className="money-drop" style={{
          left: d.left,
          animationDelay: d.delay,
          animationDuration: d.duration,
          fontSize: d.fontSize
        }}>
          {d.emoji}
        </div>
      ))}

      <div className="refresh-content">
        <div className="pulse-orb-wrap">
          <div className="pulse-orb"></div>
          <div className="orb-core"></div>
          <div className="orb-ring"></div>
        </div>
        
        <div className="refresh-text-wrap">
          <span className="refresh-text">FreeLancePay App</span>
          <div className="refresh-subtext">
            {isRefreshing ? 'Synchronizing your financial assets...' : 'Booting premium environment...'}
          </div>
        </div>
      </div>
    </div>
  );

  // Show auth modal/page
  if (authMode) {
    return <AuthPage
      defaultMode={authMode}
      onSuccess={() => { setAuthMode(null); setShowWelcome(true); }}
      onCancel={() => setAuthMode(null)}
      showCancel={true}
    />;
  }

  // Determine what to render
  const needsAuth = AUTH_REQUIRED.includes(page) && !user;
  const pageLabel = NAV.find(n => n.id === page)?.label || page;

  const renderPage = () => {
    if (page === 'dashboard') {
      return <Dashboard
        onLogin={() => setAuthMode('login')}
        onRegister={() => setAuthMode('register')}
        setPage={setPage}
        setBillFilter={setBillFilter}
        showWelcome={showWelcome}
        onWelcomeClose={() => setShowWelcome(false)}
      />;
    }
    if (needsAuth) {
      return <AuthGateBanner
        pageName={pageLabel}
        onLogin={() => setAuthMode('login')}
        onRegister={() => setAuthMode('register')}
      />;
    }
    const pageMap = {
      dashboard: () => (
        <Dashboard
          onLogin={() => setAuthMode('login')}
          onRegister={() => setAuthMode('register')}
          setPage={setPage}
          setBillFilter={setBillFilter}
          showWelcome={showWelcome}
          onWelcomeClose={() => setShowWelcome(false)}
        />
      ),
      clients:   () => <Clients setPage={setPage} setPageData={setPageData} />,
      projects:  () => <Projects clientId={pageData?.clientId} />,
      time:      () => <TimeTracker />,
      invoices:  () => <Invoices clientId={pageData?.clientId} projectId={pageData?.projectId} />,
      expenses:  () => <Expenses />,
      bills:     () => <Bills initialFilter={billFilter} />,
      income:    () => <Income />,
      cashflow:  () => <Cashflow />,
      payments:  () => <Payments />,
      calendar:  () => <Calendar />,
      settings:  () => <Settings />,
      legal:     () => <Legal />,
      feedback:  () => <Feedback />,
      security:  () => <SecurityDashboard />,
      bugs:      () => <Bugs />,
      'verification-help': () => <VirtualInbox />
    };

    const RenderComp = pageMap[page] || pageMap.dashboard;

    // Admin Guard
    if (NAV.find(n => n.id === page)?.adminOnly && user?.role !== 'admin') {
      return pageMap.dashboard();
    }

    return RenderComp();
  };

  const isCyber = colorThemeId === 'cyber';

  return (
    <div className={`layout ${isCyber ? 'cyber-layout' : ''}`}>
      <AuroraBackground />
      {isCyber && (
        <>
          <div className="hud-corner hud-tl" style={{ position: 'fixed', zIndex: 10000, opacity: 0.8 }}></div>
          <div className="hud-corner hud-tr" style={{ position: 'fixed', zIndex: 10000, opacity: 0.8 }}></div>
          <div className="hud-corner hud-bl" style={{ position: 'fixed', zIndex: 10000, opacity: 0.8 }}></div>
          <div className="hud-corner hud-br" style={{ position: 'fixed', zIndex: 10000, opacity: 0.8 }}></div>
        </>
      )}
      <Sidebar
        page={page} setPage={setPage}
        user={user} logout={logout}
        open={sidebarOpen} setOpen={setSidebarOpen}
        onLogin={() => setAuthMode('login')}
        onRegister={() => setAuthMode('register')}
        onRefresh={handleRefresh}
      />
      <div className="main-content">
        <MobileHeader setOpen={setSidebarOpen} />
        <Header 
          pageLabel={page.charAt(0).toUpperCase() + page.slice(1)} 
          isHidden={isHeaderHidden}
          setPage={setPage}
        />
        <div className="main-content-inner">
          {renderPage()}
        </div>
        <Footer />
      </div>
      <CookieConsent />
      
      {serverDown && (
        <MaintenanceOverlay />
      )}

      {isBanned && (
        <BanOverlay />
      )}

      <style>{`
        @media (max-width: 900px) {
          .mobile-header { display: flex !important; }
        }

        .btn-logout-premium {
          background: rgba(var(--primary-rgb), 0.08);
          border: 1px solid rgba(var(--primary-rgb), 0.3);
          border-radius: 12px;
          cursor: pointer;
          padding: 12px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
        }

        .btn-logout-premium:hover {
          background: rgba(var(--primary-rgb), 0.2);
          border-color: var(--primary);
          box-shadow: 0 0 25px rgba(var(--primary-rgb), 0.4), inset 0 0 10px rgba(var(--primary-rgb), 0.1);
          transform: translateY(-2px);
        }

        .btn-logout-premium:hover .logout-label {
          color: var(--text-primary);
        }

        .btn-logout-premium::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.2), transparent);
          transition: 0.5s;
        }

        .btn-logout-cyber:hover::before {
          left: 100%;
          transition: 0.5s;
        }

        .logout-content {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .logout-label {
          font-size: 11px;
          font-weight: 900;
          color: #fca5a5;
          letter-spacing: 2px;
          transition: all 0.3s ease;
        }

      `}</style>
    </div>
  );
}

const BanOverlay = () => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: '#000', zIndex: 9999999, display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', color: '#ff4444', overflow: 'hidden'
  }}>
    <div className="crack-container">
      <div className="crack"></div>
      <div className="crack"></div>
      <div className="crack"></div>
      <div className="crack"></div>
      <div className="crack"></div>
    </div>
    <div style={{ position: 'relative', zIndex: 10, padding: 20 }}>
      <div style={{ fontSize: '5rem', marginBottom: 20, animation: 'shake 0.5s infinite' }}>🚫</div>
      <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 900, marginBottom: 20, letterSpacing: 5, textShadow: '0 0 20px rgba(255,0,0,0.5)' }}>ACCESS REVOKED</h1>
      <p style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6, color: '#fff', opacity: 0.8 }}>
        This account has been <b>permanently blacklisted</b> for severe security violations. 
        Your digital footprint has been logged and all access nodes are terminated.
      </p>
      <div style={{ marginTop: 40, padding: '16px 32px', border: '2px solid #ff4444', borderRadius: 12, display: 'inline-block', background: 'rgba(255,0,0,0.1)' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: 3 }}>STATUS: PERMANENT_TERMINATION</span>
      </div>
      <p style={{ marginTop: 30, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Attempting to bypass this restriction will trigger further automated responses.</p>
    </div>
    <style>{`
      @keyframes crack-expand {
        0% { transform: scale(1); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: scale(5) translate(var(--tx), var(--ty)); opacity: 0; }
      }
      @keyframes shake {
        0%, 100% { transform: translate(0,0); }
        25% { transform: translate(-5px, 5px); }
        50% { transform: translate(5px, -5px); }
        75% { transform: translate(-5px, -5px); }
      }
      .crack-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
      .crack { 
        position: absolute; top: 50%; left: 50%; width: 1px; height: 200%; 
        background: rgba(255,255,255,0.8); transform-origin: center;
        animation: crack-expand 0.4s ease-out forwards;
      }
      .crack:nth-child(1) { --tx: 20%; --ty: -30%; transform: translate(-50%, -50%) rotate(15deg); animation-delay: 0s; }
      .crack:nth-child(2) { --tx: -40%; --ty: 10%; transform: translate(-50%, -50%) rotate(110deg); animation-delay: 0.1s; }
      .crack:nth-child(3) { --tx: 10%; --ty: 50%; transform: translate(-50%, -50%) rotate(220deg); animation-delay: 0.2s; }
      .crack:nth-child(4) { --tx: -50%; --ty: -20%; transform: translate(-50%, -50%) rotate(310deg); animation-delay: 0.3s; }
      .crack:nth-child(5) { --tx: 30%; --ty: 40%; transform: translate(-50%, -50%) rotate(45deg); animation-delay: 0.4s; }
    `}</style>
  </div>
);
