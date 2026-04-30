import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight } from 'lucide-react';

const SEARCH_TARGETS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', desc: 'Financial overview & stats', keywords: ['home', 'stats', 'overview'] },
  { id: 'bills', label: 'Bills Manager', icon: '💳', desc: 'Track & pay recurring bills', keywords: ['pay', 'expenses', 'due'] },
  { id: 'calendar', label: 'Calendar View', icon: '📅', desc: 'Visual timeline of payments', keywords: ['dates', 'schedule', 'timeline'] },
  { id: 'income', label: 'Income Tracker', icon: '💰', desc: 'Log freelance earnings', keywords: ['money', 'earn', 'revenue'] },
  { id: 'cashflow', label: 'Cashflow Projections', icon: '📊', desc: 'Predict future balances', keywords: ['future', 'forecast', 'chart'] },
  { id: 'payments', label: 'Payment History', icon: '🧾', desc: 'Full transaction logs', keywords: ['history', 'records', 'past'] },
  { id: 'feedback', label: 'Feedback', icon: '💬', desc: 'Send us your thoughts', keywords: ['contact', 'support', 'message'] },
  { id: 'bugs', label: 'Bug Reports', icon: '🐛', desc: 'Report technical issues', keywords: ['error', 'help', 'fix'] },
  { id: 'security', label: 'Security Center', icon: '🛡️', desc: 'Admin monitoring tools', keywords: ['admin', 'users', 'logs'], adminOnly: true },
];

export default function GlobalSearch({ setPage, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Keyboard shortcut Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search logic using useMemo for performance and purity
  const filteredResults = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return SEARCH_TARGETS.filter(t => {
      if (t.adminOnly && userRole !== 'admin') return false;
      return t.label.toLowerCase().includes(q) || 
             t.desc.toLowerCase().includes(q) || 
             t.keywords.some(k => k.includes(q));
    });
  }, [query, userRole]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  const handleSelect = (target) => {
    setPage(target.id);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      handleSelect(filteredResults[selectedIndex]);
    }
  };

  // Close on outside click
  useEffect(() => {
    const clickOut = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  return (
    <div className="global-search-container" ref={containerRef} style={{ position: 'relative' }}>
      <div 
        className={`search-bar-wrap ${isOpen ? 'active' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: isOpen ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 8,
          padding: '6px 14px',
          width: isOpen ? 320 : 180,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: 'text',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isOpen ? '0 0 25px rgba(var(--primary-rgb), 0.2)' : 'none'
        }}
        onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
      >
        <Search size={16} color={isOpen ? 'var(--primary)' : 'rgba(255,255,255,0.4)'} />
        <input
          ref={inputRef}
          type="text"
          placeholder={isOpen ? "Search systems..." : "Quick Search..."}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: 13,
            width: '100%',
            fontFamily: 'Space Grotesk, sans-serif'
          }}
        />
        {!isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>
            <Command size={10} /> K
          </div>
        )}
        {isOpen && (
          <div style={{ position: 'absolute', right: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--primary)', opacity: 0.8, fontWeight: 700, letterSpacing: 1 }}>
            <span className="search-pulse-dot"></span>
            SCANNING
          </div>
        )}
        {isOpen && <div className="search-scan-effect" />}
      </div>

      {/* Results Dropdown */}
      {isOpen && filteredResults.length > 0 && (
        <div className="search-results-dropdown">
          <div style={{ padding: '10px 14px', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            System Modules Found ({filteredResults.length})
          </div>
          <div className="search-results-list">
            {filteredResults.map((r, i) => (
              <div
                key={r.id}
                className={`search-result-item ${i === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className="result-icon">{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="result-label">{r.label}</div>
                  <div className="result-desc">{r.desc}</div>
                </div>
                <ArrowRight size={14} className="result-arrow" />
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .search-bar-wrap.active {
          border-color: var(--primary) !important;
          box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3), inset 0 0 10px rgba(var(--primary-rgb), 0.1) !important;
          animation: search-border-pulse 2s infinite ease-in-out;
        }
        @keyframes search-border-pulse {
          0%, 100% { border-color: var(--primary); }
          50% { border-color: rgba(var(--primary-rgb), 0.4); }
        }
        .search-pulse-dot {
          width: 6px; height: 6px; background: var(--primary); border-radius: 50%;
          animation: dot-pulse 1s infinite alternate;
        }
        @keyframes dot-pulse {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px var(--primary); }
        }
        .search-bar-wrap:hover {
          border-color: rgba(var(--primary-rgb), 0.5) !important;
          background: rgba(var(--primary-rgb), 0.05) !important;
        }
        .search-scan-effect {
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(var(--primary-rgb), 0.1), transparent);
          animation: search-scan 2s infinite linear;
          pointer-events: none;
        }
        @keyframes search-scan {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          left: 0;
          width: 380px;
          background: rgba(10, 15, 25, 0.98);
          -webkit-backdrop-filter: blur(24px);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(var(--primary-rgb), 0.3);
          border-top: 3px solid var(--primary);
          border-radius: 12px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(var(--primary-rgb), 0.15);
          z-index: 2000;
          animation: search-drop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }
        @keyframes search-drop {
          from { opacity: 0; transform: translateY(15px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .search-results-list {
          max-height: 450px;
          overflow-y: auto;
          padding: 10px;
        }
        .search-result-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          margin-bottom: 4px;
        }
        .search-result-item.selected {
          background: rgba(var(--primary-rgb), 0.15);
          border-color: rgba(var(--primary-rgb), 0.3);
          transform: translateX(6px);
          box-shadow: -5px 0 15px rgba(var(--primary-rgb), 0.1);
        }
        .result-icon {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .search-result-item.selected .result-icon {
          background: var(--primary);
          color: #000;
          box-shadow: 0 0 20px var(--primary);
          transform: scale(1.1) rotate(5deg);
          border-color: var(--primary);
        }
        .result-label { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .result-desc { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
        .result-arrow {
          opacity: 0; transform: translateX(-10px);
          transition: all 0.3s ease;
          color: var(--primary);
        }
        .search-result-item.selected .result-arrow {
          opacity: 1; transform: translateX(0);
        }
        .search-results-list::-webkit-scrollbar { width: 4px; }
        .search-results-list::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}
