import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CURRENCIES } from '../utils/helpers';
import axios from 'axios';
import { API, GOOGLE_CLIENT_ID } from '../api/config';
import { ArrowLeft, CheckCircle2, Shield, Zap, TrendingUp, Sparkles, X, Loader2, Database, ShieldCheck, UserCheck, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { SecureVault } from '../lib/crypto/SecureVault';


export default function AuthPage({ defaultMode = 'login', onSuccess, onCancel, showCancel = false }) {
  const [mode, setMode] = useState(defaultMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', currency: 'USD' });
  const [loading, setLoading] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(null); // null | 'booting' | 'analyzing' | 'finalizing'
  const { login, register, setUser } = useAuth();
  const { addToast } = useToast();
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const startAnalysis = (initialMsg) => {
    setAnalysisPhase('booting');
    
    // Phase 1: Booting (0.8s) - Initialize Cryptographic Vault
    const initVault = async () => {
      try {
        const vault = new SecureVault();
        await vault.init();
        console.log('E2EE Vault initialized for session');
      } catch (err) {
        console.error('Vault initialization failed:', err);
      }
    };
    initVault();

    setTimeout(() => {
      setAnalysisPhase('analyzing');
      // Phase 2: Analyzing (1.5s)
      setTimeout(() => {
        setAnalysisPhase('finalizing');
        // Phase 3: Finalizing (1s)
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      }, 1500);
    }, 800);
  };

  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.data?.type === 'AUTH_SUCCESS') {
        const { user } = event.data;
        setUser(user);
        startAnalysis(`Welcome, ${user.name}! Activating your Google-linked vault...`);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [setUser, startAnalysis]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && form.password !== form.confirmPassword) {
      return addToast('Passwords do not match', 'error');
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        startAnalysis('Welcome back! Synchronizing your assets...');
      } else {
        await register(form.name, form.email, form.password, form.currency);
        startAnalysis('Account created! Building your premium dashboard...');
      }
    } catch (err) {
      addToast(err?.response?.data?.error || 'Something went wrong', 'error');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email: resetEmail });
      addToast(data.message || 'Reset code sent!', 'success');
      setShowResetForm(true);
      if (data.previewUrl) window.open(data.previewUrl, '_blank');
    } catch (err) {
      addToast(err?.response?.data?.error || 'Failed to send reset code', 'error');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { email: resetEmail, code: resetCode, newPassword });
      addToast('Password reset successful! Sign in now.', 'success');
      setMode('login');
      setShowResetForm(false);
    } catch (err) {
      addToast(err?.response?.data?.error || 'Failed to reset password', 'error');
    }
    setLoading(false);
  };

  if (analysisPhase) {
    return (
      <div className="analysis-overlay">
        <div className="analysis-content">
          <div className="analysis-orb-container">
             <div className={`analysis-orb ${analysisPhase}`}>
                {analysisPhase === 'booting' && <Database size={40} className="orb-icon" />}
                {analysisPhase === 'analyzing' && <Loader2 size={40} className="orb-icon spinning" />}
                {analysisPhase === 'finalizing' && <ShieldCheck size={40} className="orb-icon" />}
             </div>
             <div className="analysis-rings">
                <div className="ring r1"></div>
                <div className="ring r2"></div>
                <div className="ring r3"></div>
             </div>
          </div>
          
          <div className="analysis-text-group">
            <h2 className="analysis-title">
              {analysisPhase === 'booting' && 'Initializing Secure Session...'}
              {analysisPhase === 'analyzing' && 'Analyzing Financial Information...'}
              {analysisPhase === 'finalizing' && 'Optimizing Your Dashboard...'}
            </h2>
            <div className="analysis-progress-bar">
               <div className={`progress-fill ${analysisPhase}`} />
            </div>
            <p className="analysis-subtext">
              {analysisPhase === 'booting' && 'Connecting to encrypted vaults...'}
              {analysisPhase === 'analyzing' && 'Calculating projections and trends...'}
              {analysisPhase === 'finalizing' && 'Deploying premium interface assets...'}
            </p>
          </div>
        </div>

        <style>{`
          .analysis-overlay {
            position: fixed; inset: 0; background: #050d0a; z-index: 2000000;
            display: flex; align-items: center; justify-content: center;
          }
          .analysis-content { display: flex; flex-direction: column; align-items: center; gap: 40px; text-align: center; }
          
          .analysis-orb-container { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
          .analysis-orb { 
            width: 80px; height: 80px; background: rgba(242, 183, 89, 0.1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: #f2b759;
            border: 2px solid #f2b759; box-shadow: 0 0 30px rgba(242, 183, 89, 0.3);
            z-index: 10; transition: all 0.5s ease;
          }
          .analysis-orb.analyzing { background: rgba(10, 74, 60, 0.1); border-color: #0a4a3c; color: #0a4a3c; transform: scale(1.1); box-shadow: 0 0 50px rgba(10, 74, 60, 0.4); }
          .analysis-orb.finalizing { background: rgba(52, 211, 153, 0.1); border-color: #34d399; color: #34d399; transform: scale(1); box-shadow: 0 0 40px rgba(52, 211, 153, 0.3); }
          
          .orb-icon.spinning { animation: spin 2s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

          .analysis-rings .ring { position: absolute; inset: -10px; border: 1px solid rgba(242, 183, 89, 0.2); border-radius: 50%; animation: ringPulse 2s ease-out infinite; }
          .ring.r2 { inset: -25px; animation-delay: 0.5s; opacity: 0.6; }
          .ring.r3 { inset: -40px; animation-delay: 1s; opacity: 0.3; }
          
          @keyframes ringPulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 0; }
          }

          .analysis-text-group { width: 100%; max-width: 400px; }
          .analysis-title { font-size: 24px; font-weight: 900; color: white; margin-bottom: 20px; letter-spacing: -0.5px; }
          .analysis-progress-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #f2b759, #0a4a3c); transition: width 1s linear; width: 0; }
          .progress-fill.booting { width: 30%; }
          .progress-fill.analyzing { width: 70%; }
          .progress-fill.finalizing { width: 100%; }
          
          .analysis-subtext { font-size: 14px; color: #64748b; font-weight: 600; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Background Data Streams */}
      <div className="auth-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="auth-particle" style={{ 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${12 + Math.random() * 12}s`,
            fontSize: `${12 + Math.random() * 10}px`
          }}>{['💸', '💰', '✨', '💎'][i % 4]}</div>
        ))}
      </div>

      <div className="auth-wrapper horizontal">
        {/* Left: Branding & Value Proposition */}
        <div className="auth-hero">
          <div className="auth-logo-large animate-float">💸</div>
          <h1 className="auth-hero-title">Elevate Your Freelance Finances</h1>
          <p className="auth-hero-desc">
            Join the premium environment designed for high-performing freelancers.
            Track every dollar, anticipate every expense with our state-of-the-art dashboard.
          </p>
          
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="feature-dot" />
              <span>Immutable Financial Ledger</span>
            </div>
            <div className="auth-feature-item">
              <div className="feature-dot" />
              <span>Real-time Overdue Alerts</span>
            </div>
            <div className="auth-feature-item">
              <div className="feature-dot" />
              <span>8-Month Cashflow Forecasting</span>
            </div>
          </div>
          
          {showCancel && (
            <button onClick={onCancel} className="auth-back-btn">
              <ArrowLeft size={16} />
              <span>Return to Dashboard</span>
            </button>
          )}
        </div>

        {/* Right: The Form Card */}
        <div className="auth-card-panel">
          <div className="auth-card glass-card">
            {showCancel && (
              <button className="modal-close-btn auth-close-fixed" onClick={onCancel}>
                <X size={20} />
              </button>
            )}

            <div className="auth-form-header">
              <h2>{mode === 'login' ? 'Welcome Back' : mode === 'forgot' ? 'Reset Password' : 'Create Account'}</h2>
              <p>{mode === 'login' ? 'Continue your financial journey' : 'Start your clean-slate dashboard'}</p>
            </div>

            {mode !== 'forgot' && (
              <div className="auth-mode-toggle">
                <button 
                  className={mode === 'login' ? 'active' : ''} 
                  onClick={() => setMode('login')}
                >Sign In</button>
                <button 
                  className={mode === 'register' ? 'active' : ''} 
                  onClick={() => setMode('register')}
                >Get Started</button>
              </div>
            )}

            <div className="auth-scroll-area">
              {mode === 'forgot' ? (
                <form onSubmit={showResetForm ? handleResetPassword : handleForgotPassword} className="auth-form">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="input" type="email" placeholder="you@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required disabled={showResetForm} />
                  </div>
                  {showResetForm && (
                    <>
                      <div className="form-group">
                        <label className="form-label">6-Digit Code</label>
                        <input className="input" placeholder="123456" value={resetCode} onChange={e => setResetCode(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">New Password</label>
                        <div style={{ position: 'relative' }}>
                          <input className="input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                          <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  <button className="btn btn-primary btn-hero" type="submit" disabled={loading}>
                    {loading ? '⏳ Processing...' : showResetForm ? 'Reset Password' : 'Send Reset Code'}
                  </button>
                  <button type="button" onClick={() => { setMode('login'); setShowResetForm(false); }} className="btn-link">
                    ← Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="auth-form">
                  {mode === 'register' && (
                    <div className="form-group animate-slide-up">
                      <label className="form-label">Full Name</label>
                      <input className="input" placeholder="Alex Freelancer" value={form.name} onChange={set('name')} required />
                    </div>
                  )}
                  <div className="form-group animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <label className="form-label">Email Address</label>
                    <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                  </div>
                    <div className="form-group animate-slide-up" style={{ animationDelay: '0.2s' }}>
                      <div className="label-row">
                        <label className="form-label">Password</label>
                        {mode === 'login' && (
                          <button type="button" onClick={() => setMode('forgot')} className="forgot-link">Forgot Password?</button>
                        )}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input className="input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} />
                        <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  {mode === 'register' && (
                    <>
                      <div className="form-group animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <label className="form-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                          <input className="input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                          <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div className="form-group animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <label className="form-label">Primary Currency</label>
                        <select className="select" value={form.currency} onChange={set('currency')}>
                          {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  <button className="btn btn-primary btn-hero" type="submit" disabled={loading} style={{ marginTop: 10 }}>
                    <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In Now' : 'Create My Account'}</span>
                    <Sparkles size={18} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}></div>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}></div>
                  </div>

                  <div style={{ marginTop: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        try {
                          setLoading(true);
                          const { data } = await axios.post(`${API}/auth/google/verify`, { token: credentialResponse.credential });
                          startAnalysis(`Welcome, ${data.user.name}! Activating your Google-linked vault...`);
                          setUser(data.user);
                        } catch (err) {
                          addToast('Google login failed', 'error');
                          setLoading(false);
                        }
                      }}
                      onError={() => {
                        addToast('Google login failed', 'error');
                      }}
                      useOneTap
                      shape="pill"
                      theme="outline"
                      size="large"
                      width="350"
                      text="continue_with"
                    />
                  </div>
                </form>
              )}
            </div>
            
            {mode === 'register' && (
              <div className="auth-clean-slate-badge">
                <CheckCircle2 size={14} />
                <span>Clean-slate environment ready</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh; background: radial-gradient(circle at center, #0a1f1a 0%, #050d0a 100%); 
          display: flex; align-items: center; justify-content: center;
          padding: 40px; position: relative; overflow: hidden;
        }
        .auth-container::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%);
          pointer-events: none; z-index: 2;
        }
        .auth-wrapper.horizontal {
          display: grid; grid-template-columns: 1.1fr 0.9fr;
          width: 100%; max-width: 1200px; gap: 60px; align-items: center;
          z-index: 10;
        }

        .auth-hero { text-align: left; animation: authHeroIn 1s ease-out; position: relative; padding-right: 40px; }
        .auth-hero::after {
          content: ''; position: absolute; right: 0; top: 20%; bottom: 20%; width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.05), transparent);
        }

        .auth-logo-large { font-size: 64px; margin-bottom: 24px; display: inline-block; filter: drop-shadow(0 0 20px rgba(242, 183, 89, 0.3)); }
        .auth-hero-title { font-size: 52px; font-weight: 900; line-height: 1.05; margin-bottom: 24px; color: white; letter-spacing: -2.5px; }
        .auth-hero-desc { font-size: 18px; color: #64748b; line-height: 1.6; margin-bottom: 40px; max-width: 480px; font-weight: 500; }
        
        .auth-features { display: flex; flex-direction: column; gap: 18px; margin-bottom: 48px; }
        .auth-feature-item { display: flex; align-items: center; gap: 16px; font-size: 15px; font-weight: 700; color: #94a3b8; transition: all 0.3s; }
        .auth-feature-item:hover { color: #fff; transform: translateX(10px); }
        .feature-dot { width: 8px; height: 8px; border-radius: 50%; background: #f2b759; box-shadow: 0 0 15px #f2b759; }

        .auth-back-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #f2b759; display: flex; align-items: center; gap: 10px; font-weight: 800; cursor: pointer; transition: all 0.3s; padding: 12px 24px; border-radius: 14px; width: fit-content; }
        .auth-back-btn:hover { background: rgba(242, 183, 89, 0.1); transform: scale(1.05); }

        .auth-card-panel { display: flex; justify-content: center; perspective: 2000px; width: 100%; }
        .auth-card {
          width: 100%; max-width: 480px; background: rgba(6, 14, 12, 0.7); border-radius: 40px;
          padding: 48px; border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 0 80px rgba(242, 183, 89, 0.05), 0 50px 100px rgba(0,0,0,0.8);
          animation: authCardIn 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          position: relative;
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
        }

        .auth-close-fixed {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #64748b;
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 100;
        }

        .auth-close-fixed:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          transform: rotate(90deg) scale(1.1);
        }

        @keyframes authHeroIn { from { opacity: 0; transform: translateX(-60px); } }
        @keyframes authCardIn { 
          from { opacity: 0; transform: scale(0.85) translateZ(-400px) rotateY(20deg); } 
          to { opacity: 1; transform: scale(1) translateZ(0) rotateY(0deg); } 
        }

        .close-btn-auth { position: absolute; top: 28px; right: 28px; background: none; border: none; color: #475569; cursor: pointer; transition: color 0.2s; }
        .close-btn-auth:hover { color: #f87171; }

        .auth-form-header h2 { font-size: 32px; font-weight: 900; margin: 0; color: white; letter-spacing: -1.5px; }
        .auth-form-header p { font-size: 15px; color: #64748b; margin-top: 6px; margin-bottom: 32px; }

        .auth-mode-toggle { display: flex; background: rgba(255,255,255,0.03); padding: 6px; border-radius: 16px; margin-bottom: 32px; border: 1px solid rgba(255,255,255,0.05); }
        .auth-mode-toggle button { flex: 1; padding: 12px; border: none; border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 14px; transition: all 0.2s; background: transparent; color: #64748b; }
        .auth-mode-toggle button.active { background: rgba(242, 183, 89, 0.15); color: #f2b759; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }

        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; width: 100%; }
        .form-label { font-size: 13px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .label-row { display: flex; justify-content: space-between; align-items: center; }
        .forgot-link { background: none; border: none; color: #f2b759; font-size: 12px; font-weight: 800; cursor: pointer; }
        
        .btn-hero { height: 64px; border-radius: 20px; font-size: 17px; font-weight: 900; display: flex; gap: 12px; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(242, 183, 89, 0.2); }
        .btn-link { background: none; border: none; color: #64748b; font-size: 14px; font-weight: 800; cursor: pointer; margin-top: 16px; align-self: center; }

        .auth-clean-slate-badge { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 32px; font-size: 13px; color: #34d399; font-weight: 800; opacity: 0.9; }

        .pwd-toggle {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #64748b; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.2s; padding: 4px;
        }
        .pwd-toggle:hover { color: var(--primary); }

        .auth-particles { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .auth-particle { position: absolute; animation: floatParticle linear infinite; opacity: 0.2; filter: blur(1px); }
        @keyframes floatParticle { from { transform: translateY(0) rotate(0deg); } to { transform: translateY(-100vh) rotate(360deg); } }

        @media (max-width: 1000px) {
          .auth-wrapper.horizontal { grid-template-columns: 1fr; gap: 40px; }
          .auth-hero { text-align: center; }
          .auth-hero-desc { margin: 0 auto 40px; }
          .auth-features { align-items: center; }
          .auth-logo-large { font-size: 48px; }
          .auth-hero-title { font-size: 36px; }
          .auth-container { padding: 24px; }
        }

        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
