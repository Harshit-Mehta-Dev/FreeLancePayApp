import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { formatCurrency, formatDate, daysUntil } from '../utils/helpers';
import { ChevronRight, CreditCard, PieChart as PieIcon, Activity, Calendar as CalIcon, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { API, apiHeaders } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const getCategoryMeta = (cat) => {
  const meta = {
    housing: { icon: '🏠', label: 'Housing' },
    utilities: { icon: '⚡', label: 'Utilities' },
    subscriptions: { icon: '📺', label: 'Subs' },
    transport: { icon: '🚗', label: 'Transport' },
    food: { icon: '🍕', label: 'Food' },
    insurance: { icon: '🛡️', label: 'Insurance' },
    business: { icon: '💼', label: 'Business' },
    work: { icon: '🛠️', label: 'Work' },
    personal: { icon: '👤', label: 'Personal' }
  };
  return meta[cat.toLowerCase()] || { icon: '📄', label: cat };
};

// ─── Feature Slider ───────────────────────────────────────────────────────────
const FeatureSlider = () => {
  const [index, setIndex] = useState(0);
  const slides = [
    { title: "Smart Bill Tracking", desc: "Automate your recurring payments with precision.", icon: "💳", bg: "rgba(99, 102, 241, 0.1)" },
    { title: "Cashflow Forecast", desc: "Predict your financial future with AI-driven charts.", icon: "📈", bg: "rgba(16, 185, 129, 0.1)" },
    { title: "Client Management", desc: "Keep track of all your clients in one secure place.", icon: "🤝", bg: "rgba(245, 158, 11, 0.1)" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="glass-card" style={{ 
      position: 'relative', height: 280, borderRadius: 32, overflow: 'hidden', 
      marginBottom: 60, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          style={{ 
            textAlign: 'center', padding: 40, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: slides[index].bg
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 20 }}>{slides[index].icon}</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: 'var(--text-primary)' }}>{slides[index].title}</h2>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 500 }}>{slides[index].desc}</p>
        </motion.div>
      </AnimatePresence>
      <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 8 }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setIndex(i)} style={{ 
            width: index === i ? 24 : 8, height: 8, borderRadius: 4, 
            background: index === i ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease', cursor: 'pointer'
          }} />
        ))}
      </div>
    </div>
  );
};

// ─── Guest Dashboard ──────────────────────────────────────────────────────────
const GuestDashboard = ({ onLogin, onRegister }) => {
  return (
    <div className="page animate-fade" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(var(--primary-rgb),0.1)', color: 'var(--primary)', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 20, border: '1px solid rgba(var(--primary-rgb),0.2)' }}>
          VERSION 3.0 STABLE
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, marginBottom: 20, letterSpacing: -1.5, lineHeight: 1.1, color: 'var(--text-primary)' }}>
          Professional Freelance <br/><span style={{ background: 'linear-gradient(to right, var(--primary), #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Financial Management</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
          The complete platform for tracking bills, logging income, and managing your client portfolio with precision.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onRegister} style={{ padding: '14px 32px', fontSize: 16 }}>🚀 Get Started</button>
          <button className="btn btn-ghost" onClick={onLogin} style={{ padding: '14px 32px', fontSize: 16 }}>🔐 Sign In</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 80 }}>
        {[
          { icon: <CreditCard size={32}/>, title: 'Bill Management', text: 'Never miss a due date. Track recurring bills with automated status updates.' },
          { icon: <TrendingUp size={32}/>, title: 'Cashflow Projection', text: 'Visualize your financial future with smart analytics and projection charts.' },
          { icon: <PieIcon size={32}/>, title: 'Spending Insights', text: 'Understand where your money goes with detailed categorical breakdowns.' }
        ].map((feat, i) => (
          <div key={i} className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ color: 'var(--primary)', marginBottom: 24, display: 'flex', justifyContent: 'center' }}>{feat.icon}</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{feat.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>{feat.text}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 80 }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 900, marginBottom: 48 }}>Simple 3-Step Setup</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
          {[
            { step: '01', icon: <FileText size={40}/>, title: 'Add Invoices & Bills', text: 'Input your upcoming expenses and expected earnings in seconds.' },
            { step: '02', icon: <Clock size={40}/>, title: 'Track Progress', text: 'Mark items as paid and see your dashboard update in real-time.' },
            { step: '03', icon: <Activity size={40}/>, title: 'Analyze Growth', text: 'Use our projections to make informed decisions about your business.' }
          ].map((s, i) => (
            <div key={i} className="how-step" style={{ position: 'relative', padding: '40px 32px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid var(--glass-border)', transition: 'all 0.4s ease' }}>
              <div className="step-badge">{s.step}</div>
              <div className="step-icon-wrap">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <ul className="step-features">
                <li>Instant updates</li>
                <li>Secure encryption</li>
                <li>Mobile ready</li>
              </ul>
            </div>
          ))}
        </div>
        <style>{`
          .how-step:hover { transform: translateY(-12px); background: rgba(var(--primary-rgb), 0.05); border-color: var(--primary); }
          .step-badge {
            position: absolute; top: -15px; left: 30px; background: var(--primary); color: white;
            padding: 4px 14px; border-radius: 8px; font-weight: 900; font-size: 14px;
            box-shadow: 0 8px 16px rgba(var(--primary-rgb), 0.4);
          }
          .step-icon-wrap { color: var(--primary-light); margin-bottom: 24px; opacity: 0.8; }
          .how-step h3 { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
          .how-step p { color: var(--text-secondary); font-size: 14px; line-height: 1.7; margin-bottom: 24px; }
          .step-features { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
          .step-features li {
            font-size: 12px; font-weight: 700; color: var(--text-muted);
            display: flex; align-items: center; gap: 8px;
          }
          .step-features li::before { content: '✓'; color: var(--accent-green); font-weight: 900; }
        `}</style>
      </div>

      {/* Preview chart */}
      <div className="glass-card reveal" style={{ padding: 28, marginBottom: 32, textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(var(--primary-rgb),0.15)', color: 'var(--primary-light)', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 99, border: '1px solid rgba(var(--primary-rgb),0.3)', marginBottom: 12 }}>
          PREVIEW — Sign in to see your real data
        </div>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>📈 Sample Cashflow Projection</h3>
        <PreviewChart />
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '32px 20px 48px' }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>Ready to take control of your finances?</div>
        <button className="btn btn-primary" onClick={onRegister} style={{ fontSize: 16, padding: '14px 36px' }}>
          ✨ Create Free Account
        </button>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>No credit card required · Start fresh with your own data</p>
      </div>
    </div>
  );
};

const SAMPLE = [
  { month: 'Jan', income: 2800, expenses: 1200 },
  { month: 'Feb', income: 3200, expenses: 1400 },
  { month: 'Mar', income: 2600, expenses: 1800 },
  { month: 'Apr', income: 4100, expenses: 1350 },
  { month: 'May', income: 3700, expenses: 1600 },
  { month: 'Jun', income: 4800, expenses: 1200 },
];

const PreviewChart = () => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={SAMPLE} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
      <defs>
        <linearGradient id="pInc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="pExp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
      <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
      <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#pInc)" />
      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#pExp)" />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── Authenticated Dashboard ───────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, gradient, currency }) => (
  <div className="glass-card animate-fade" style={{ flex: 1, minWidth: 180, padding: 22 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>{label}</div>
        <div className="glow-text" style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>
          {typeof value === 'number' ? formatCurrency(value, currency) : value}
        </div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 28, opacity: 0.8, color: 'var(--primary)' }}>{icon}</div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '12px 16px', fontSize: 13, boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(10px)' }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {formatCurrency(p.value, currency)}</p>)}
    </div>
  );
};

const WelcomeOverlay = ({ onDismiss, userName }) => (
  <div className="welcome-overlay" onClick={onDismiss}>
     <div className="welcome-card glass-card" onClick={e => e.stopPropagation()}>
        <div className="welcome-p-wrap">
           {[0,1,2,3,4,5].map(i => (
             <div key={i} className="welcome-p" style={{ 
               left: `${Math.random() * 100}%`, 
               top: `${Math.random() * 100}%`,
               animationDelay: `${i * 0.5}s` 
             }}>💸</div>
           ))}
        </div>
        <div className="welcome-glow" />
        <div className="welcome-icon-box animate-float">✨</div>
        <h2 className="welcome-title">Welcome, {userName}!</h2>
        <p className="welcome-text">
          Your premium financial environment is active. We've synchronized your assets and prepared your dashboard for maximum productivity.
        </p>
        <button className="btn btn-primary welcome-cta" onClick={onDismiss}>
           <span>Explore Your Dashboard</span>
           <ChevronRight size={20} />
        </button>
     </div>
     <style>{`
        .welcome-overlay {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px);
          z-index: 1000000; display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: fadeIn 0.4s ease-out;
        }
        .welcome-card {
          width: 100%; max-width: 520px; padding: 60px 48px; text-align: center; position: relative; overflow: hidden;
          background: var(--bg-secondary); border-radius: 40px; border: 1px solid var(--glass-border);
          box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(var(--primary-rgb), 0.1);
          animation: welcomeIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes welcomeIn { from { opacity: 0; transform: scale(0.8) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .welcome-glow { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(var(--primary-rgb), 0.08), transparent 70%); pointer-events: none; }
        .welcome-icon-box { font-size: 64px; margin-bottom: 24px; color: var(--primary); }
        .welcome-title { font-size: 32px; font-weight: 900; color: var(--text-primary); margin-bottom: 16px; letter-spacing: -1.5px; }
        .welcome-text { color: var(--text-secondary); font-size: 16px; line-height: 1.6; margin-bottom: 40px; }
        .welcome-cta { height: 60px; width: 100%; border-radius: 20px; font-size: 16px; font-weight: 900; }
        .welcome-p-wrap { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .welcome-p { position: absolute; font-size: 24px; opacity: 0; animation: floatUp 3s infinite; color: var(--primary); }
        @keyframes floatUp { 0% { transform: translateY(20px); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: translateY(-80px); opacity: 0; } }
     `}</style>
  </div>
);

const AuthDashboard = ({ currency, setPage, showWelcome, onWelcomeClose }) => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, iRes] = await Promise.all([
          axios.get(`${API}/bills`, { headers: apiHeaders() }),
          axios.get(`${API}/income`, { headers: apiHeaders() })
        ]);
        setBills(bRes.data);
        setIncome(iRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="skeleton-container" style={{ padding: 20 }}>
      <div className="skeleton" style={{ height: 40, width: '30%', marginBottom: 30 }} />
      <div style={{ display: 'flex', gap: 16, marginBottom: 30 }}>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 120 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="skeleton" style={{ height: 300 }} />
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    </div>
  );

  const totalDue = bills.filter(b => b.status !== 'paid').reduce((acc, b) => acc + b.amount, 0);
  const overdueAmt = bills.filter(b => b.status === 'overdue').reduce((acc, b) => acc + b.amount, 0);
  const overdueCount = bills.filter(b => b.status === 'overdue').length;
  const upcomingCount = bills.filter(b => b.status === 'upcoming').length;
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const incomeThisMonth = income
    .filter(i => new Date(i.date) >= monthStart)
    .reduce((acc, i) => acc + i.amount, 0);
  
  const paidThisMonth = bills
    .filter(b => b.status === 'paid' && new Date(b.paid_date || b.due_date) >= monthStart)
    .reduce((acc, b) => acc + b.amount, 0);

  // Prep Chart Data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const cashflow = months.map((m, i) => {
    const inc = income.filter(idx => new Date(idx.date).getMonth() === i).reduce((a, b) => a + b.amount, 0);
    const exp = bills.filter(bdx => new Date(bdx.due_date).getMonth() === i).reduce((a, b) => a + b.amount, 0);
    return { month: m, income: inc, expenses: exp };
  });

  const byCategory = Object.values(bills.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = { category: b.category, total: 0 };
    acc[b.category].total += b.amount;
    return acc;
  }, {}));

  const recentBills = [...bills]
    .filter(b => b.status !== 'paid')
    .sort((a,b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <>
      {showWelcome && <WelcomeOverlay userName={user?.name || 'Freelancer'} onDismiss={onWelcomeClose} />}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, letterSpacing: -0.5 }}>
            Good {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Here's your financial overview for {months[now.getMonth()]} {now.getFullYear()}.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
           <button className="btn btn-ghost btn-sm" onClick={() => setPage('bills')}>View All Bills</button>
           <button className="btn btn-primary btn-sm" onClick={() => setPage('income')}>Log Income</button>
        </div>
      </div>

      {bills.length === 0 && (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', marginBottom: 24, border: '2px dashed var(--glass-border)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ready to start tracking?</h3>
          <div style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>
            Head to <strong style={{ color: 'var(--primary-light)' }}>Bills</strong> to add your first bill or <strong style={{ color: '#6ee7b7' }}>Income</strong> to log earnings.
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard icon="💸" label="Total Due" value={totalDue} sub={`${upcomingCount} upcoming bills`} gradient="linear-gradient(135deg, var(--primary), #06b6d4)" currency={currency} />
        <StatCard icon="🔴" label="Overdue Amount" value={overdueAmt} sub={`${overdueCount} overdue`} gradient="linear-gradient(135deg, #ef4444, #dc2626)" currency={currency} />
        <StatCard icon="✅" label="Paid This Month" value={paidThisMonth} sub="Payments made" gradient="linear-gradient(135deg, #10b981, #059669)" currency={currency} />
        <StatCard icon="📥" label="Income This Month" value={incomeThisMonth} sub="Received" gradient="linear-gradient(135deg, #f59e0b, #d97706)" currency={currency} />
        <StatCard icon="📊" label="Net This Month" value={incomeThisMonth - paidThisMonth}
          sub={incomeThisMonth >= paidThisMonth ? '🟢 Positive cashflow' : '🔴 Negative cashflow'}
          gradient={incomeThisMonth >= paidThisMonth ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)"}
          currency={currency} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: 20, fontSize: 16 }}>📈 Cashflow Projection</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cashflow} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeG)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>🗂 By Category</h3>
          {byCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={72} paddingAngle={3}>
                    {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v, currency)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {byCategory.slice(0, 4).map((c, i) => (
                  <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{getCategoryMeta(c.category).label}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: PIE_COLORS[i % PIE_COLORS.length] }}>{formatCurrency(c.total, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-icon">📊</div><p>Add bills to see categories</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent bills */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: 20, fontSize: 16 }}>🗓 Upcoming Bills</h3>
        {recentBills.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Bill</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Days</th></tr></thead>
              <tbody>
                {recentBills.map(bill => {
                  const days = daysUntil(bill.due_date);
                  const cat = getCategoryMeta(bill.category);
                  return (
                    <tr key={bill.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{cat.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{bill.name}</div>
                            {bill.client && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bill.client}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(bill.due_date)}</td>
                      <td style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{formatCurrency(bill.amount, currency)}</td>
                      <td><span className={`badge badge-${bill.status}`}>{bill.status}</span></td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 600, color: days < 0 ? '#ef4444' : days <= 7 ? '#f59e0b' : 'var(--text-muted)' }}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : `${days}d`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><div className="empty-icon">🎉</div><p>No bills yet — add one from Bills page!</p></div>
        )}
      </div>
    </>
  );
};

// ─── Root Dashboard export ─────────────────────────────────────────────────────
export default function Dashboard({ onLogin, onRegister, setPage, showWelcome, onWelcomeClose }) {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  return (
    <>
      {user
        ? <AuthDashboard currency={currency} setPage={setPage} showWelcome={showWelcome} onWelcomeClose={onWelcomeClose} />
        : <GuestDashboard onLogin={onLogin} onRegister={onRegister} />
      }
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
