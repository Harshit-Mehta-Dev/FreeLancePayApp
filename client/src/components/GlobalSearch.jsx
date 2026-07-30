import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Command, ArrowRight, X, Layout, Users, Rocket, Clock, 
  FileText, CreditCard, Calendar, TrendingUp, BarChart, LifeBuoy, 
  Shield, Zap, PlusCircle, History, Sparkles, Target, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ShineBorder } from './ui/shine-border';

const CATEGORIES = ['All', 'Management', 'Finance', 'Subscription', 'Analytics', 'Support', 'Admin'];

const SEARCH_TARGETS = [
  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={20} />, category: 'General', desc: 'Financial overview & stats', keywords: ['home', 'stats', 'overview'], color: '#6366f1', status: 'Core' },
  { id: 'clients', label: 'Client Portfolio', icon: <Users size={20} />, category: 'Management', desc: 'Manage your client base', keywords: ['customers', 'contacts', 'portfolio'], color: '#06b6d4', status: 'Live' },
  { id: 'projects', label: 'Project Launcher', icon: <Rocket size={20} />, category: 'Management', desc: 'Track active projects & milestones', keywords: ['jobs', 'tasks', 'deliveries'], color: '#8b5cf6', status: 'Active' },
  { id: 'time', label: 'Time Tracker', icon: <Clock size={20} />, category: 'Management', desc: 'Precision billing & focus logs', keywords: ['timer', 'hours', 'working'], color: '#f59e0b', status: 'Ready' },
  { id: 'invoices', label: 'Invoice Manager', icon: <FileText size={20} />, category: 'Finance', desc: 'Generate professional invoices', keywords: ['billing', 'receipts', 'payments'], color: '#10b981', status: 'Audit' },
  { id: 'expenses', label: 'Business Expenses', icon: <Zap size={20} />, category: 'Finance', desc: 'Log spending & tax deductions', keywords: ['outflow', 'receipts', 'spending'], color: '#ef4444', status: 'Tax' },
  { id: 'bills', label: 'Bills Manager', icon: <CreditCard size={20} />, category: 'Finance', desc: 'Track & pay recurring bills', keywords: ['pay', 'expenses', 'due'], color: '#ec4899', status: 'Pay' },
  { id: 'calendar', label: 'Calendar View', icon: <Calendar size={20} />, category: 'Finance', desc: 'Visual timeline of payments', keywords: ['dates', 'schedule', 'timeline'], color: '#3b82f6', status: 'Plan' },
  { id: 'income', label: 'Income Tracker', icon: <TrendingUp size={20} />, category: 'Finance', desc: 'Log freelance earnings', keywords: ['money', 'earn', 'revenue'], color: '#10b981', status: 'Earn' },
  { id: 'cashflow', label: 'Cashflow Projections', icon: <BarChart size={20} />, category: 'Analytics', desc: 'Predict future balances', keywords: ['future', 'forecast', 'chart'], color: '#6366f1', status: 'Beta' },
  { id: 'payments', label: 'Payment History', icon: <FileText size={20} />, category: 'Analytics', desc: 'Full transaction logs', keywords: ['history', 'records', 'past'], color: '#94a3b8', status: 'Logs' },
  { id: 'feedback', label: 'Feedback', icon: <LifeBuoy size={20} />, category: 'Support', desc: 'Send us your thoughts', keywords: ['contact', 'support', 'message'], color: '#f43f5e', status: 'Help' },
  { id: 'bugs', label: 'Bug Reports', icon: <Shield size={20} />, category: 'Support', desc: 'Report technical issues', keywords: ['error', 'help', 'fix'], color: '#f59e0b', status: 'Help' },
  { id: 'security', label: 'Security Center', icon: <Shield size={20} />, category: 'Admin', desc: 'Admin monitoring tools', keywords: ['admin', 'users', 'logs'], adminOnly: true, color: '#ef4444', status: 'Restricted' },
  { id: 'subscriptions', label: 'My Subscriptions', icon: <CreditCard size={20} />, category: 'Subscription', desc: 'Manage recurring SaaS & tools', keywords: ['recurring', 'bills', 'monthly', 'saas'], color: '#ec4899', status: 'Active' },
];

export default function GlobalSearch({ setPage, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
    setActiveCategory('All');
  };

  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    let results = SEARCH_TARGETS.filter(t => !t.adminOnly || userRole === 'admin');
    
    if (activeCategory !== 'All') {
      results = results.filter(t => t.category === activeCategory);
    }

    if (!q) return results;
    
    return results.filter(t => 
      t.label.toLowerCase().includes(q) || 
      t.desc.toLowerCase().includes(q) || 
      t.keywords.some(k => k.includes(q)) ||
      t.category.toLowerCase().includes(q)
    );
  }, [query, activeCategory, userRole]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  const handleSelect = (result) => {
    if (!result) return;
    setPage(result.id);
    closeSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(filteredResults[selectedIndex]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const currentIndex = CATEGORIES.indexOf(activeCategory);
      const nextIndex = (currentIndex + (e.shiftKey ? -1 : 1) + CATEGORIES.length) % CATEGORIES.length;
      setActiveCategory(CATEGORIES[nextIndex]);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Header Trigger */}
      <div 
        className="search-trigger-header"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(2, 6, 23, 0.45)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '12px 24px',
          width: '100%',
          maxWidth: '420px',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 25px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.03)'
        }}
      >
        <Search size={18} style={{ color: 'var(--primary)', opacity: 0.9, flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span className="search-cmd-badge" style={{ fontSize: 9, color: 'var(--primary)', fontWeight: 900, letterSpacing: '1.5px', background: 'rgba(var(--primary-rgb), 0.12)', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0 }}>Command Center</span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Quick search...</span>
        </div>
        <div className="search-k-shortcut" style={{ 
          display: 'flex', alignItems: 'center', gap: 5, 
          background: 'rgba(255,255,255,0.05)', padding: '4px 10px', 
          borderRadius: '8px', fontSize: '11px', fontWeight: 800,
          color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0
        }}>
          <Command size={12} /> K
        </div>
      </div>

      {/* Premium Search Hub Modal */}
      {isOpen && createPortal(
        <div className="search-hub-overlay" onClick={closeSearch}>
          <div 
            className="search-hub-content"
            onClick={e => e.stopPropagation()}
            style={{
              width: '95%',
              maxWidth: '800px',
              maxHeight: '85vh',
              background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.99))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              boxShadow: '0 50px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(var(--primary-rgb), 0.1)',
              overflow: 'hidden',
              animation: 'hub-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
              display: 'flex',
              flexDirection: 'column',
              backdropFilter: 'blur(40px) saturate(180%)'
            }}
          >
            {/* Search Input Area */}
            <div style={{ padding: '28px 32px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={28} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 10px rgba(var(--primary-rgb), 0.5))' }} />
                  <div className="search-input-pulse"></div>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="What's up?"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '22px',
                    fontWeight: 700,
                    width: '100%',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.5px'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                   <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 900, background: 'rgba(var(--primary-rgb), 0.1)', padding: '0 12px', borderRadius: 8, border: '1px solid rgba(var(--primary-rgb), 0.2)', height: '32px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>ACTIVE</div>
                   <button onClick={closeSearch} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }} className="hover-close">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Category Navigation */}
              <div className="search-nav-tabs" style={{ 
                display: 'flex', 
                gap: 12, 
                marginTop: 24,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`nav-tab ${activeCategory === cat ? 'active' : ''}`}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 800,
                      border: '1px solid transparent',
                      background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                      color: activeCategory === cat ? '#000' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: activeCategory === cat ? '0 8px 20px rgba(var(--primary-rgb), 0.3)' : 'none',
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Hub */}
            <div className="search-hub-body" style={{ display: 'grid', gridTemplateColumns: query ? '1fr' : '2fr 1fr', gap: 0 }}>
              {/* Main Results List */}
              <div style={{ maxHeight: '520px', overflowY: 'auto', padding: '24px', borderRight: query ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                {!query && (
                  <div style={{ marginBottom: 20, padding: '0 8px' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={12} color="var(--primary)" /> Suggested Modules
                    </div>
                    <div className="text-neutral-500 font-bold text-lg tracking-widest uppercase">No Modules Found</div>
                    <div className="text-neutral-600 text-sm mt-3 font-medium">Try searching for keywords like "money", "timer", or "admin"</div>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredResults.length > 0 ? (
                    filteredResults.map((r, i) => (
                      <div
                        key={r.id}
                        className={`hub-item ${i === selectedIndex ? 'active' : ''}`}
                        onClick={() => handleSelect(r)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        style={{
                          padding: '18px 22px',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 20,
                          transition: 'all 0.3s ease',
                          background: i === selectedIndex ? 'rgba(255,255,255,0.05)' : 'transparent',
                          border: '1px solid',
                          borderColor: i === selectedIndex ? 'rgba(255,255,255,0.1)' : 'transparent',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ 
                          width: 52, height: 52, borderRadius: '16px', 
                          background: i === selectedIndex ? r.color : `${r.color}15`, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: i === selectedIndex ? '#fff' : r.color,
                          transition: 'all 0.3s ease',
                          boxShadow: i === selectedIndex ? `0 10px 25px ${r.color}40` : 'none',
                          border: `1px solid ${r.color}30`,
                          flexShrink: 0
                        }}>
                          {r.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 17, fontWeight: 800, color: i === selectedIndex ? '#fff' : 'var(--text-primary)', flexShrink: 0, whiteSpace: 'nowrap' }}>{r.label}</span>
                            <span style={{ fontSize: 9, fontWeight: 900, color: i === selectedIndex ? 'rgba(255,255,255,0.85)' : 'var(--primary)', background: i === selectedIndex ? 'rgba(0,0,0,0.2)' : 'rgba(var(--primary-rgb), 0.1)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0 }}>{r.status}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</div>
                        </div>
                        <div className="hub-item-action" style={{ 
                          opacity: i === selectedIndex ? 1 : 0,
                          transform: i === selectedIndex ? 'translateX(0)' : 'translateX(-10px)',
                          transition: 'all 0.3s ease',
                          color: 'var(--primary)',
                          flexShrink: 0
                        }}>
                          <ArrowRight size={22} />
                        </div>
                        {i === selectedIndex && <div className="hub-item-glow" style={{ background: r.color }}></div>}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                      <div className="no-results-anim">🛸</div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '20px', marginTop: 20 }}>No matching entries</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: 10 }}>The directory returned zero results for your query.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center text-[10px] text-neutral-500 font-bold uppercase tracking-widest shrink-0">
              <div className="flex gap-6">
                <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-0.5 rounded border border-white/10">TAB</kbd> CATEGORY</span>
                <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-0.5 rounded border border-white/10">↑↓</kbd> NAVIGATE</span>
                <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-0.5 rounded border border-white/10">ENTER</kbd> SELECT</span>
              </div>
              <div style={{ fontFamily: 'monospace', opacity: 0.3, letterSpacing: '1px' }}>FREELANCE_PAY // CYBER_OS V2.5</div>
            </div>
          </div>
        </div>,
        document.body
      )}
      <style>{`
        .search-hub-overlay {
          position: fixed;
          inset: 0;
          background: rgba(3, 7, 18, 0.95) !important;
          backdrop-filter: blur(30px) !important;
          -webkit-backdrop-filter: blur(30px) !important;
          z-index: 99999999 !important;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 7vh;
          animation: hub-fade-in 0.3s ease;
        }

        @keyframes hub-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes hub-pop { 
          from { opacity: 0; transform: scale(0.95) translateY(-30px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }

        .search-trigger-header:hover {
          background: rgba(var(--primary-rgb), 0.08) !important;
          border-color: rgba(var(--primary-rgb), 0.4) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.4), 0 0 15px rgba(var(--primary-rgb), 0.1);
        }

        .hub-item.active {
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
          transform: translateX(8px);
        }

        .hub-item-glow {
          position: absolute;
          left: 0; top: 0; width: 4px; height: 100%;
          opacity: 0.8;
          box-shadow: 0 0 20px inherit;
        }

        .hover-close:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          color: #ef4444 !important;
        }

        .quick-action-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.1) !important;
          transform: scale(1.02);
        }

        .recent-item:hover {
          opacity: 1 !important;
          color: var(--primary) !important;
          transform: translateX(4px);
          transition: all 0.2s ease;
        }

        .search-input-pulse {
          position: absolute;
          inset: -10px;
          border: 2px solid var(--primary);
          border-radius: 50%;
          opacity: 0;
          animation: search-pulse 2s infinite;
          pointer-events: none;
        }
        
        .search-nav-tabs::-webkit-scrollbar { display: none; }

        @media (max-width: 900px) {
          .main-header.header-desktop { display: none !important; }
        }

        @media (max-width: 768px) {
          .search-hub-body {
            grid-template-columns: 1fr !important;
          }
          .search-nav-tabs {
            overflow-x: auto !important;
            padding-bottom: 4px;
            scroll-behavior: smooth;
          }
          .nav-tab {
            flex-shrink: 0 !important;
          }
          .search-trigger-header {
            max-width: 100% !important;
          }
        }

        @media (max-width: 640px) {
          .search-cmd-badge {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .search-k-shortcut {
            display: none !important;
          }
        }

        @keyframes header-scan {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .no-results-anim {
          font-size: 64px;
          animation: float-no-res 4s ease-in-out infinite;
        }

        @keyframes float-no-res {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }

        .search-hub-body::-webkit-scrollbar { width: 0; }
        .search-hub-body *::-webkit-scrollbar { width: 6px; }
        .search-hub-body *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
