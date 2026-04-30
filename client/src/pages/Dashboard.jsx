import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Zap, PlayCircle, Info, ChevronRight, TrendingUp } from 'lucide-react';
import { API, apiHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, daysUntil, getCategoryMeta } from '../utils/helpers';
import AppInfoModal from '../components/AppInfoModal';
import Skeleton from '../components/Skeleton';
// ─── Public / Guest Dashboard ─────────────────────────────────────────────────
const GuestDashboard = ({ onLogin, onRegister }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setShowInfo(true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.05 }); // Lower threshold for better reliability

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    
    // Fallback: force reveal after 500ms in case observer fails on some browsers
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }, 500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <AppInfoModal 
        isOpen={showInfo} 
        onClose={() => setShowInfo(false)} 
        featureData={selectedFeature}
        onStartJourney={onRegister}
      />
      
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '60px 20px 48px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--primary-rgb),0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="animate-float" style={{ fontSize: 64, marginBottom: 16 }}>💸</div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 42, fontWeight: 900, background: 'linear-gradient(135deg, var(--primary-light), #67e8f9, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16, lineHeight: 1.2 }}>
          FreeLancePay App
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Track recurring payments, get overdue alerts, and visualize your cashflow — all in one beautiful dashboard.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onRegister} style={{ fontSize: 16, padding: '14px 32px' }}>
            🚀 Get Started Free
          </button>
          <button className="btn btn-ghost" onClick={onLogin} style={{ fontSize: 16, padding: '14px 32px' }}>
            🔐 Sign In
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 64 }} className="stats-grid">
        {[
          { icon: '🔔', title: 'Overdue Alerts', desc: 'Get instant visual alerts when bills go past their due date with pulsing indicators.' },
          { icon: '🔄', title: 'Recurring Payments', desc: 'Set weekly, monthly, quarterly or yearly bills — next ones auto-generate on payment.' },
          { icon: '📊', title: 'Cashflow Projection', desc: '8-month forward view of your income vs. expenses to plan your finances.' },
          { icon: '💰', title: 'Income Tracking', desc: 'Log freelance earnings by client and category, see monthly trends at a glance.' },
          { icon: '🗂', title: 'Bill Categories', desc: 'Organize by software, invoices, utilities, subscriptions, taxes and more.' },
          { icon: '🧾', title: 'Payment History', desc: 'Full audit trail of every payment made with optional notes per transaction.' },
        ].map(f => (
          <div 
            key={f.title} 
            className="glass-card reveal clickable-card" 
            style={{ padding: 28, cursor: 'pointer', position: 'relative' }}
            onClick={() => handleFeatureClick(f)}
          >
            <div style={{ position: 'absolute', top: 16, right: 16, color: 'var(--primary)', opacity: 0.4 }}>
              <Info size={16} />
            </div>
            <div className="feature-icon-box" style={{ fontSize: 42, marginBottom: 16, transition: 'all 0.4s' }}>{f.icon}</div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 10, transition: 'all 0.3s' }}>{f.title}</h3>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</div>
            <div className="learn-more-link" style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8, transition: 'all 0.3s' }}>
              <span>Learn More</span>
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed "How to Use" Section */}
      <div className="glass-card reveal" style={{ padding: '60px 40px', marginBottom: 64, background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.08), transparent)' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(var(--primary-rgb),0.2)', color: 'var(--primary-light)', fontSize: 13, fontWeight: 900, padding: '6px 20px', borderRadius: 99, marginBottom: 20, letterSpacing: 1 }}>
            <Zap size={16} /> HOW TO USE OUR APPLICATION
          </div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 900, marginBottom: 16 }}>Your Journey to Financial Freedom</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>A simple, 3-step process designed specifically for the freelance workflow.</p>
        </div>
        
        <div className="how-it-works-detailed">
          <div className="how-step">
            <div className="step-badge">01</div>
            <div className="step-body">
              <div className="step-icon-wrap"><PlayCircle size={32} /></div>
              <h3>Registration & Setup</h3>
              <p>Create your secure account and define your operating currency. Our AI-driven setup assistant helps you configure your first tax categories in minutes.</p>
              <ul className="step-features">
                <li>Secure JWT Authentication</li>
                <li>Custom Currency Support</li>
                <li>Initial Category Auto-gen</li>
              </ul>
            </div>
          </div>
          <div className="how-step">
            <div className="step-badge">02</div>
            <div className="step-body">
              <div className="step-icon-wrap"><TrendingUp size={32} /></div>
              <h3>Data Ingestion</h3>
              <p>Log your client invoices and operational expenses. Use our interactive calendar to schedule recurring bills so you never miss a beat.</p>
              <ul className="step-features">
                <li>Recurring Bill Engine</li>
                <li>Granular Income Logging</li>
                <li>Calendar-first Workflow</li>
              </ul>
            </div>
          </div>
          <div className="how-step">
            <div className="step-badge">03</div>
            <div className="step-body">
              <div className="step-icon-wrap"><Zap size={32} /></div>
              <h3>Strategic Analysis</h3>
              <p>Sit back as FreeLancePay generates 8-month cashflow projections. Identify spending leaks and optimize for tax season with one-click reports.</p>
              <ul className="step-features">
                <li>8-Month Cashflow Forecast</li>
                <li>Tax-Deductible Highlights</li>
                <li>Automated Growth Reports</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <button className="btn btn-primary" onClick={onRegister} style={{ padding: '16px 40px', fontSize: 18, borderRadius: 16 }}>
            ✨ Claim Your Dashboard Now
          </button>
        </div>

        <style>{`
          .how-it-works-detailed { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
          @media (max-width: 600px) {
            .how-it-works-detailed { grid-template-columns: 1fr; }
            .how-step { padding: 30px 24px; }
          }
          .how-step {
            position: relative; padding: 40px; background: rgba(255,255,255,0.02);
            border-radius: 28px; border: 1px solid rgba(255,255,255,0.05);
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          }
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
    </>
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
const StatCard = ({ icon, label, value, sub, gradient, currency, isOverdue }) => (
  <div className="glass-card stat-card" style={{ 
    flex: 1, minWidth: 180, padding: 22, position: 'relative',
    animation: isOverdue ? 'pulse-glow-red 2s infinite' : 'none',
    border: isOverdue ? '1px solid rgba(239, 68, 68, 0.5)' : undefined
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {typeof value === 'number' ? formatCurrency(value, currency) : value}
        </div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 28, opacity: 0.8 }}>{icon}</div>
    </div>
    <style>{`
      @keyframes pulse-glow-red { 0%, 100% { box-shadow: 0 0 0px rgba(239, 68, 68, 0); } 50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.3); } }
    `}</style>
  </div>
);

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value, currency)}</p>)}
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
  </div>
);

const PromotionOverlay = ({ onDismiss, userName }) => (
  <div className="welcome-overlay" style={{ background: 'rgba(var(--primary-rgb), 0.15)', backdropFilter: 'blur(30px)' }} onClick={onDismiss}>
     <div className="welcome-card glass-card" style={{ border: '1px solid var(--primary)', boxShadow: '0 0 100px rgba(var(--primary-rgb), 0.4)' }} onClick={e => e.stopPropagation()}>
        <div className="welcome-p-wrap">
           {[0,1,2,3,4,5].map(i => (
             <div key={i} className="welcome-p" style={{ 
               left: `${Math.random() * 100}%`, 
               top: `${Math.random() * 100}%`,
               animationDelay: `${i * 0.5}s`,
               fontSize: 32
             }}>🎖️</div>
           ))}
        </div>
        <div className="welcome-glow" style={{ background: 'radial-gradient(circle at center, rgba(var(--primary-rgb), 0.2), transparent 70%)' }} />
        <div className="welcome-icon-box animate-float" style={{ fontSize: 80 }}>🛡️</div>
        <h2 className="welcome-title" style={{ background: 'linear-gradient(135deg, #fff, var(--primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Clearance Level: ADMIN
        </h2>
        <h3 style={{ color: '#fff', fontSize: 20, marginBottom: 16 }}>Congratulations, {userName}!</h3>
        <p className="welcome-text">
          You have been officially promoted to **Platform Administrator**. Your digital clearance has been elevated, granting you full access to the Security Command Center and advanced telemetry tools.
        </p>
        <button className="btn btn-primary welcome-cta" onClick={onDismiss} style={{ background: 'var(--primary)', border: 'none', boxShadow: '0 10px 30px rgba(var(--primary-rgb), 0.5)' }}>
           <span>Enter Command Center</span>
           <ChevronRight size={20} />
        </button>
     </div>
  </div>
);
const OverlayStyles = () => (
  <style>{`
    .welcome-overlay {
      position: fixed; inset: 0; background: rgba(8, 12, 20, 0.85); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
      z-index: 1000000; display: flex; align-items: center; justify-content: center; padding: 24px;
      animation: fadeIn 0.4s ease-out;
    }
    .welcome-card {
      width: 100%; max-width: 520px; padding: 60px 48px; text-align: center; position: relative; overflow: hidden;
      background: #0B0E14; border-radius: 40px; border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(var(--primary-rgb), 0.1);
      animation: welcomeIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes welcomeIn { from { opacity: 0; transform: scale(0.8) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .welcome-glow { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(var(--primary-rgb), 0.08), transparent 70%); pointer-events: none; }
    .welcome-icon-box { font-size: 64px; margin-bottom: 24px; }
    .welcome-title { font-size: 32px; font-weight: 900; color: white; margin-bottom: 16px; letter-spacing: -1.5px; }
    .welcome-text { color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 40px; }
    .welcome-cta { height: 60px; width: 100%; border-radius: 20px; font-size: 16px; font-weight: 900; }
    .welcome-p-wrap { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .welcome-p { position: absolute; font-size: 24px; opacity: 0.15; filter: blur(1px); animation: welcomeFloat 6s ease-in-out infinite; }
    @keyframes welcomeFloat { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(15deg); } }
  `}</style>
);

const AuthDashboard = ({ currency, setPage, setBillFilter, showWelcome, onWelcomeClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPromo, setShowPromo] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkPromo = async () => {
      try {
        const { data: notes } = await axios.get(`${API}/notifications`, { headers: apiHeaders() });
        const promo = notes.find(n => n.type === 'promotion' && !n.is_read);
        if (promo) {
          setShowPromo(true);
          await axios.patch(`${API}/notifications/${promo.id}/read`, {}, { headers: apiHeaders() });
        }
      } catch (e) {}
    };
    if (user?.role === 'admin') checkPromo();
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data: d } = await axios.get(`${API}/dashboard`, { headers: apiHeaders() });
        if (!isMounted) return;
        setData(d);
        setLoading(false);
      } catch {
        if (isMounted) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { isMounted = false; clearInterval(t); };
  }, []);

  if (loading) return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Skeleton width="300px" height="36px" style={{ marginBottom: 8 }} />
          <Skeleton width="250px" height="20px" />
        </div>
        <Skeleton width="180px" height="36px" style={{ borderRadius: 99 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-card" style={{ padding: 22 }}>
            <Skeleton width="80px" height="16px" style={{ marginBottom: 8 }} />
            <Skeleton width="120px" height="32px" style={{ marginBottom: 8 }} />
            <Skeleton width="60px" height="14px" />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <Skeleton width="150px" height="24px" style={{ marginBottom: 20 }} />
          <Skeleton width="100%" height="240px" />
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <Skeleton width="120px" height="24px" style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Skeleton width="144px" height="144px" shape="circle" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => (
               <Skeleton key={i} width="100%" height="16px" />
            ))}
          </div>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: 24 }}>
        <Skeleton width="150px" height="24px" style={{ marginBottom: 20 }} />
        <Skeleton width="100%" height="120px" />
      </div>
    </>
  );

  if (!data) return (
    <div className="empty-state" style={{ padding: '40px 0' }}>
      <div className="empty-icon">⚠️</div>
      <p>Unable to retrieve dashboard data. Please check your connection.</p>
    </div>
  );
  const { 
    totalDue, 
    overdueAmt: serverOverdueAmt, 
    overdueCount: serverOverdueCount, 
    paidThisMonth, 
    incomeThisMonth, 
    upcomingCount: serverUpcomingCount,
    cashflow, 
    recentBills, 
    byCategory 
  } = data;
  
  // Real-time stat recalculation for accuracy
  const processedBills = (recentBills || []).map(b => {
    const days = daysUntil(b.due_date);
    const isActuallyOverdue = b.status !== 'paid' && days < 0;
    return { ...b, status: isActuallyOverdue ? 'overdue' : b.status };
  });

  // Use server-side stats for cards to ensure all bills are counted, not just the top 5
  const overdueCount = serverOverdueCount || 0;
  const overdueAmt = serverOverdueAmt || 0;
  const upcomingCount = serverUpcomingCount || 0;

  const PIE_COLORS = ['var(--primary)','#06b6d4','#f59e0b','#10b981','#ec4899','#ef4444','#f97316','#64748b'];

  return (
    <>
      {showWelcome && <WelcomeOverlay userName={user?.name?.split(' ')[0]} onDismiss={onWelcomeClose} />}
      {showPromo && <PromotionOverlay userName={user?.name?.split(' ')[0]} onDismiss={() => setShowPromo(false)} />}
      <OverlayStyles />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's your financial snapshot for today</p>
        </div>
        <button 
          onClick={() => setPage && setPage('calendar')}
          title="Open Calendar"
          style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--glass)', padding: '8px 16px', borderRadius: 99, border: '1px solid var(--glass-border)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="alert-banner alert-banner-overdue" style={{ marginBottom: 24, cursor: 'pointer' }} onClick={() => { setBillFilter('overdue'); setPage('bills'); }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <strong>{overdueCount} overdue bill{overdueCount > 1 ? 's' : ''}</strong> totaling{' '}
            <strong>{formatCurrency(overdueAmt, currency)}</strong> — click to review!
          </div>
        </div>
      )}

      {/* No bills empty state */}
      {totalDue === 0 && overdueCount === 0 && upcomingCount === 0 && paidThisMonth === 0 && (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', marginBottom: 24, borderLeft: '3px solid rgba(var(--primary-rgb),0.4)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Your dashboard is empty</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>
            Head to <strong style={{ color: 'var(--primary-light)' }}>Bills</strong> to add your first bill or <strong style={{ color: '#6ee7b7' }}>Income</strong> to log earnings.
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div onClick={() => { setBillFilter('all'); setPage('bills'); }} style={{ cursor: 'pointer' }}>
          <StatCard icon="💸" label="Total Due" value={totalDue} sub={`${upcomingCount} upcoming bills`} gradient="linear-gradient(135deg, var(--primary), #06b6d4)" currency={currency} />
        </div>
        <div onClick={() => { setBillFilter('overdue'); setPage('bills'); }} style={{ cursor: 'pointer' }}>
          <StatCard icon="🔴" label="Overdue Amount" value={overdueAmt} sub={`${overdueCount} overdue`} gradient="linear-gradient(135deg, #ef4444, #dc2626)" currency={currency} isOverdue={overdueCount > 0} />
        </div>
        <StatCard icon="✅" label="Paid This Month" value={paidThisMonth} sub="Payments made" gradient="linear-gradient(135deg, #10b981, #059669)" currency={currency} />
        <StatCard icon="📥" label="Income This Month" value={incomeThisMonth} sub="Received" gradient="linear-gradient(135deg, #f59e0b, #d97706)" currency={currency} />
        <StatCard icon="📊" label="Net This Month" value={incomeThisMonth - paidThisMonth}
          sub={incomeThisMonth >= paidThisMonth ? '🟢 Positive cashflow' : '🔴 Negative cashflow'}
          gradient={incomeThisMonth >= paidThisMonth ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)"}
          currency={currency} />
      </div>

      {/* Charts row */}
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
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
              <thead><tr><th>Bill</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Days</th><th>Action</th></tr></thead>
              <tbody>
                {processedBills.map(bill => {
                  const days = daysUntil(bill.due_date);
                  const cat = getCategoryMeta(bill.category);
                  return (
                    <tr key={bill.id}>
                      <td data-label="Bill">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{cat.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{bill.name}</div>
                            {bill.client && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bill.client}</div>}
                          </div>
                        </div>
                      </td>
                      <td data-label="Due Date" style={{ color: 'var(--text-secondary)' }}>{formatDate(bill.due_date)}</td>
                      <td data-label="Amount" style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{formatCurrency(bill.amount, currency)}</td>
                      <td data-label="Status">
                        <span className={`badge badge-${bill.status === 'upcoming' && daysUntil(bill.due_date) < 0 ? 'overdue' : bill.status}`}>
                          {bill.status === 'upcoming' && daysUntil(bill.due_date) < 0 ? 'OVERDUE' : bill.status.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Days">
                        <span style={{ color: days < 0 ? '#f87171' : days <= 3 ? '#fbbf24' : 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>
                          {days === 0 ? 'Due Today' : days < 0 ? `${Math.abs(days)}d late` : `${days}d left`}
                        </span>
                      </td>
                      <td data-label="Action">
                        {bill.status !== 'paid' && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '4px 8px', fontSize: 11, color: 'var(--primary-light)', minWidth: 'unset', width: 'auto' }}
                            onClick={() => { setBillFilter('all'); setPage('bills'); }}
                          >
                            💳 Pay
                          </button>
                        )}
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
