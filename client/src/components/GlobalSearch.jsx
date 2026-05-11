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

const CATEGORIES = ['All', 'Management', 'Finance', 'Analytics', 'Support', 'Admin'];

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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#020617]/95 backdrop-blur-2xl z-[9999] flex items-start justify-center pt-[10vh] px-4 overflow-y-auto pb-20"
          onClick={closeSearch}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0f172a]/80 backdrop-blur-3xl w-full max-w-5xl rounded-[40px] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Header Area */}
            <div className="shrink-0 p-8 sm:p-12 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-6 sm:gap-10">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-16 h-16 rounded-[22px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] shrink-0"
                >
                  <Search size={32} className="text-primary" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search systems, modules, or users..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none outline-none text-2xl sm:text-4xl font-black text-white placeholder:text-neutral-800 tracking-tight"
                  />
                  <div className="flex items-center gap-3 mt-3 text-neutral-500 font-bold text-[10px] uppercase tracking-[0.2em] opacity-50">
                    <Zap size={12} />
                    <span>Neural Search Engine Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <button onClick={closeSearch} className="group p-4 hover:bg-white/10 rounded-2xl transition-all">
                    <X size={32} className="text-neutral-500 group-hover:text-white group-hover:rotate-90 transition-all" />
                  </button>
                </div>
              </div>

              {/* Categories / Tabs */}
              <div className="flex gap-3 mt-12 overflow-x-auto pb-2 no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-8 py-3.5 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap border uppercase tracking-[0.15em]",
                      activeCategory === cat 
                        ? "bg-primary border-primary text-black shadow-[0_12px_24px_rgba(var(--primary-rgb),0.3)] scale-105" 
                        : "bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Area - High-Fidelity Grid */}
            <div className="flex-1 p-8 sm:p-12 bg-black/40 overflow-y-auto max-h-[75vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {filteredResults.length > 0 ? (
                  filteredResults.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={cn(
                        "group relative p-6 rounded-[32px] cursor-pointer transition-all duration-300 border flex flex-col",
                        i === selectedIndex 
                          ? "bg-white/[0.06] border-white/20 shadow-2xl -translate-y-1" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div 
                          className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                          style={{ 
                            background: `linear-gradient(135deg, ${r.color}20, ${r.color}40)`,
                            color: r.color,
                            border: `1px solid ${r.color}40`
                          }}
                        >
                          {React.cloneElement(r.icon, { size: 28 })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white text-xl tracking-tight truncate pr-4">{r.label}</span>
                            <span className={cn(
                              "text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border transition-colors",
                              i === selectedIndex ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 border-white/5 text-neutral-500"
                            )}>{r.status}</span>
                          </div>
                          <div className="text-sm text-neutral-500 font-medium leading-snug line-clamp-1 group-hover:text-neutral-400 transition-colors">{r.desc}</div>
                        </div>
                      </div>
                      
                      {/* Interactive Trigger */}
                      <div className={cn(
                        "absolute bottom-6 right-8 transition-all duration-300",
                        i === selectedIndex ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                      )}>
                        <ArrowRight size={20} className="text-primary" />
                      </div>

                      {/* Hover Gradient Glow */}
                      <AnimatePresence>
                        {i === selectedIndex && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 rounded-[32px] pointer-events-none overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
                            <div className="absolute -inset-[100%] bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05)_0%,transparent_50%)] animate-pulse" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center">
                    <div className="inline-flex w-20 h-20 rounded-full bg-white/5 items-center justify-center mb-6">
                      <Search size={32} className="text-neutral-700" />
                    </div>
                    <div className="text-neutral-500 font-bold text-lg tracking-widest uppercase">No Modules Found</div>
                    <div className="text-neutral-600 text-sm mt-3 font-medium">Try searching for keywords like "money", "timer", or "admin"</div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center text-[10px] text-neutral-500 font-bold uppercase tracking-widest shrink-0">
              <div className="flex gap-6">
                <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-0.5 rounded border border-white/10">TAB</kbd> CATEGORY</span>
                <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-0.5 rounded border border-white/10">↑↓</kbd> NAVIGATE</span>
                <span className="flex items-center gap-2"><kbd className="bg-white/10 px-2 py-0.5 rounded border border-white/10">ENTER</kbd> SELECT</span>
              </div>
              <div className="font-mono opacity-30">FREELANCE_PAY // SYSTEM_SEARCH_V3</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {/* Header Trigger with Glass Effect */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative group w-full max-w-[480px]"
      >
        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 rounded-xl blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <button 
          type="button"
          className="relative flex items-center gap-3 bg-neutral-900/60 backdrop-blur-2xl px-5 py-2.5 w-full rounded-xl transition-all border border-white/5 group-hover:border-white/10 cursor-pointer outline-none overflow-hidden"
          onClick={() => setIsOpen(true)}
        >
          {/* Subtle Scanline Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
          
          <Search size={18} className="text-primary group-hover:scale-110 transition-transform duration-300" />
          <span className="text-[14px] text-neutral-400 font-medium flex-1 text-left tracking-tight">
            Search anything...
          </span>
          
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/10 text-[10px] font-black text-neutral-500 tracking-tighter">
            <Command size={11} />
            <span>K</span>
          </div>
        </button>
      </motion.div>

      {/* Portal the modal to the end of the body */}
      {mounted && createPortal(modalContent, document.body)}

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
