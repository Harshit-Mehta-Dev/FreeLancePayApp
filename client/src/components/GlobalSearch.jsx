import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Command, ArrowRight, X, Layout, Users, Rocket, Clock, 
  FileText, CreditCard, Calendar, TrendingUp, BarChart, LifeBuoy, 
  Shield, Zap, PlusCircle, History, Sparkles
} from 'lucide-react';

const CATEGORIES = ['All', 'Management', 'Finance', 'Analytics', 'Support', 'Admin'];

const QUICK_ACTIONS = [
  { id: 'add-bill', label: 'Create New Bill', icon: <PlusCircle size={14} />, color: '#10b981' },
  { id: 'add-client', label: 'Add New Client', icon: <PlusCircle size={14} />, color: '#06b6d4' },
  { id: 'add-invoice', label: 'Draft Invoice', icon: <PlusCircle size={14} />, color: '#8b5cf6' },
];

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
];

export default function GlobalSearch({ setPage, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(['projects', 'invoices', 'dashboard']);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecent = (id) => {
    const updated = [id, ...recentSearches.filter(i => i !== id)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  useEffect(() => {
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
  }, [filteredResults, activeCategory]);

  const handleSelect = (target) => {
    saveRecent(target.id);
    setPage(target.id);
    closeSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
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
          gap: 12,
          background: 'rgba(2, 6, 23, 0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '10px 18px',
          width: '320px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.05)'
        }}
      >
        <Search size={16} style={{ color: 'var(--primary)', opacity: 0.8 }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, flex: 1, letterSpacing: '0.2px' }}>Search modules, actions...</span>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 4, 
          background: 'rgba(255,255,255,0.06)', padding: '3px 7px', 
          borderRadius: '6px', fontSize: '10px', fontWeight: 800,
          color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <Command size={10} /> K
        </div>
      </div>

      {/* Premium Search Hub Modal */}
      {isOpen && (
        <div className="search-hub-overlay" onClick={closeSearch}>
          <div 
            className="search-hub-content"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '720px',
              background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.99))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '28px',
              boxShadow: '0 50px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(var(--primary-rgb), 0.1)',
              overflow: 'hidden',
              animation: 'hub-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
              display: 'flex',
              flexDirection: 'column',
              backdropFilter: 'blur(40px) saturate(180%)'
            }}
          >
            {/* Search Input Area */}
            <div style={{ padding: '32px 32px 20px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={28} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 10px rgba(var(--primary-rgb), 0.5))' }} />
                  <div className="search-input-pulse"></div>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Tell us what you're looking for..."
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
                <div style={{ display: 'flex', gap: 10 }}>
                   <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 900, background: 'rgba(var(--primary-rgb), 0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(var(--primary-rgb), 0.2)' }}>ACTIVE</div>
                   <button onClick={closeSearch} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 10, borderRadius: 12, transition: 'all 0.2s ease' }} className="hover-close">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Category Navigation */}
              <div className="search-nav-tabs" style={{ display: 'flex', gap: 10, marginTop: 32 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`nav-tab ${activeCategory === cat ? 'active' : ''}`}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 800,
                      border: '1px solid transparent',
                      background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                      color: activeCategory === cat ? '#000' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: activeCategory === cat ? '0 8px 20px rgba(var(--primary-rgb), 0.3)' : 'none'
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
              <div style={{ maxHeight: '520px', overflowY: 'auto', padding: '20px 24px', borderRight: query ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                {!query && (
                  <div style={{ marginBottom: 20, padding: '0 8px' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={12} color="var(--primary)" /> Suggested Modules
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredResults.length > 0 ? (
                    filteredResults.map((r, i) => (
                      <div
                        key={r.id}
                        className={`hub-item ${i === selectedIndex ? 'active' : ''}`}
                        onClick={() => handleSelect(r)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        style={{
                          padding: '16px 20px',
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
                          border: `1px solid ${r.color}30`
                        }}>
                          {r.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 17, fontWeight: 800, color: i === selectedIndex ? '#fff' : 'var(--text-primary)' }}>{r.label}</span>
                            <span style={{ fontSize: 9, fontWeight: 900, color: i === selectedIndex ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', background: i === selectedIndex ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{r.status}</span>
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, opacity: 0.8 }}>{r.desc}</div>
                        </div>
                        <div className="hub-item-action" style={{ 
                          opacity: i === selectedIndex ? 1 : 0,
                          transform: i === selectedIndex ? 'translateX(0)' : 'translateX(-10px)',
                          transition: 'all 0.3s ease',
                          color: 'var(--primary)'
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

              {/* Sidebar Info (Only when not searching) */}
              {!query && (
                <div style={{ padding: '24px', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {/* Quick Actions */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Quick Actions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {QUICK_ACTIONS.map(action => (
                        <div key={action.id} className="quick-action-btn" style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                          borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                          cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          <div style={{ color: action.color }}>{action.icon}</div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{action.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent History */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <History size={12} /> Recent
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {recentSearches.map(id => {
                        const target = SEARCH_TARGETS.find(t => t.id === id);
                        if (!target) return null;
                        return (
                          <div key={id} onClick={() => handleSelect(target)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', opacity: 0.7 }} className="recent-item">
                             <div style={{ width: 8, height: 8, borderRadius: '50%', background: target.color }}></div>
                             <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{target.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Footer */}
            <div style={{ 
              padding: '20px 32px', 
              background: 'rgba(2, 6, 23, 0.9)', 
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 700
            }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={hintBox}><span style={hintKey}>TAB</span> NEXT CATEGORY</div>
                <div style={hintBox}><span style={hintKey}>↑↓</span> NAVIGATE</div>
                <div style={hintBox}><span style={hintKey}>↵</span> OPEN</div>
              </div>
              <div style={{ letterSpacing: 1, opacity: 0.6, fontFamily: 'JetBrains Mono' }}>CYBER_OS // SEARCH_v2.4.0</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .search-hub-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.9);
          backdrop-filter: blur(20px);
          z-index: 10005;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 10vh;
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

        @keyframes search-pulse {
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

const hintBox = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  opacity: 0.8
};

const hintKey = {
  background: 'rgba(255,255,255,0.1)',
  padding: '3px 7px',
  borderRadius: '6px',
  color: '#fff',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '10px'
};
