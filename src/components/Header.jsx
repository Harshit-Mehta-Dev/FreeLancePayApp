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
  const [uptime, setUptime] = useState('00:00:00');
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
      {/* Header Grid Background */}
      <div className="header-grid-bg" />

      <div className="flex items-center justify-between w-full h-full relative z-10 gap-4">
        {/* Left: Page Title & Identity */}
        <div className="flex items-center gap-5 shrink-0 min-w-0 max-w-[240px]">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.8)]" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-[-4px] rounded-full bg-primary/30" 
            />
          </div>
          
          <div className="flex flex-col min-w-0">
            <motion.h2 
              layoutId="header-title"
              className="text-2xl font-black text-white font-display tracking-tight leading-none truncate"
            >
              {pageLabel}
            </motion.h2>
            <div className="flex items-center gap-2 mt-1 overflow-hidden opacity-60">
              <Activity size={10} className="text-primary animate-pulse" />
              <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-wider truncate uppercase">
                {user ? `SECURE_NODE // ${user.name.split(' ')[0]}` : 'ANON_SESSION'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Hub (Flexible) */}
        <div className="flex-1 flex justify-center min-w-0 max-w-2xl px-4">
          <GlobalSearch setPage={setPage} userRole={user?.role} />
        </div>

        {/* Right: Telemetry & Actions */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden xl:flex flex-col items-end border-r border-white/5 pr-6">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <Clock size={12} className="text-emerald-500/70" />
              SESSION: <span className="font-mono text-white/90">{uptime}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-primary/70" />
              V3.0 // STABLE
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-1 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
              <NotificationBell />
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-10 w-10 rounded-xl bg-neutral-900 border border-white/10 p-0.5 flex items-center justify-center cursor-pointer shadow-lg hover:border-primary/40 transition-all"
            >
               <img 
                src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user?.id || 'guest'}&backgroundColor=transparent`} 
                alt="Avatar" 
                className="w-full h-full rounded-[10px]"
              />
            </motion.div>
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


