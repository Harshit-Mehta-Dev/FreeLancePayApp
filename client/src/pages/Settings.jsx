import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API, apiHeaders } from '../api/config';
import { useToast } from '../context/ToastContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import { CURRENCIES } from '../utils/helpers';

const AVATARS = [
  { id: 'fox', icon: '🦊' }, { id: 'panda', icon: '🐼' }, { id: 'lion', icon: '🦁' },
  { id: 'owl', icon: '🦉' }, { id: 'cat', icon: '🐱' }, { id: 'dog', icon: '🐶' },
  { id: 'robot', icon: '🤖' }, { id: 'alien', icon: '👾' }, { id: 'rocket', icon: '🚀' },
  { id: 'laptop', icon: '💻' }, { id: 'brush', icon: '🎨' }, { id: 'money', icon: '💸' },
];

// ─── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, icon, subtitle, children, accent }) => (
  <div className="glass-card reveal" style={{ padding: 28, marginBottom: 20, borderLeft: `3px solid ${accent || 'rgba(var(--primary-rgb),0.5)'}` }}>
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span className="section-icon" data-icon={icon} style={{ fontSize: 22 }}>{icon}</span>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17 }}>{title}</h3>
      </div>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 32 }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 22 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
      }} />
    </button>
  </div>
);

// ─── Info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 14 }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{value}</span>
  </div>
);

// ─── Main Settings ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme, colorThemeId, setColorThemeId } = useTheme();

  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    currency: user?.currency || 'INR',
    avatar: user?.avatar || null
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Email Verification
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Password state
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Notifications state (synced with browser permissions)
  const [notifs, setNotifs] = useState(() => {
    const saved = localStorage.getItem('notification_settings');
    return saved ? JSON.parse(saved) : {
      overdueAlert: true, upcomingReminder: true, weeklyReport: false,
      emailDigest: false, paymentConfirm: true, recurringAlert: true,
    };
  });

  const handleNotifChange = async (key, val) => {
    const newNotifs = { ...notifs, [key]: val };
    setNotifs(newNotifs);
    localStorage.setItem('notification_settings', JSON.stringify(newNotifs));
    
    // Request permission if enabling
    if (val && !['emailDigest', 'weeklyReport'].includes(key)) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          addToast('🚀 System notifications enabled!', 'success');
        } else {
          addToast('⚠️ Notification permission denied by browser', 'warning');
        }
      }
    }
  };

  const [appearance, setAppearance] = useState({
    compactView: false, showAmounts: true, animationsEnabled: true,
  });

  // Data section
  const [clearing, setClearing] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  
  // Feedback state
  const [fbEmail, setFbEmail] = useState('');
  const [fbSubject, setFbSubject] = useState('');
  const [fbMsg, setFbMsg] = useState('');
  const [fbRating, setFbRating] = useState(5);
  const [sendingFb, setSendingFb] = useState(false);

  const setP = k => e => setProfile(f => ({ ...f, [k]: e.target.value }));
  const setPw = k => e => setPwd(f => ({ ...f, [k]: e.target.value }));

  // ── Handlers ──
  const sendFeedback = async () => {
    setSendingFb(true);
    try {
      await axios.post(`${API}/auth/feedback`, { email: fbEmail, subject: fbSubject, message: fbMsg, rating: fbRating }, { headers: apiHeaders() });
      addToast('Feedback sent! Thank you ❤️', 'success');
      setFbEmail('');
      setFbSubject('');
      setFbMsg('');
      setFbRating(5);
    } catch { addToast('Failed to send feedback', 'error'); }
    setSendingFb(false);
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) return addToast('Name cannot be empty', 'error');
    setSavingProfile(true);
    try {
      await axios.patch(`${API}/auth/settings`, profile, { headers: apiHeaders() });
      setUser(u => ({ ...u, ...profile }));
      addToast('Profile updated! ✅', 'success');
    } catch { addToast('Failed to save profile', 'error'); }
    setSavingProfile(false);
  };

  const changePassword = async () => {
    if (!pwd.current || !pwd.newPwd) return addToast('Fill all password fields', 'error');
    if (pwd.newPwd !== pwd.confirm) return addToast('New passwords do not match', 'error');
    if (pwd.newPwd.length < 6) return addToast('Password must be at least 6 characters', 'error');
    setSavingPwd(true);
    try {
      await axios.post(`${API}/auth/change-password`, { currentPassword: pwd.current, newPassword: pwd.newPwd }, { headers: apiHeaders() });
      addToast('Password changed! 🔒', 'success');
      setPwd({ current: '', newPwd: '', confirm: '' });
    } catch (e) {
      addToast(e?.response?.data?.error || 'Failed to change password', 'error');
    }
    setSavingPwd(false);
  };

  const exportData = async (format) => {
    setExportLoading(format);
    try {
      // Step 1: Get a one-time download token (uses auth cookie normally)
      const { data } = await axios.post(
        `${API}/auth/export-token`,
        { format },
        { withCredentials: true }
      );
      // Step 2: Open download directly in browser — no cookie needed
      const downloadUrl = `${API}/download?token=${data.token}`;
      window.open(downloadUrl, '_blank');
      addToast(`✅ ${format === 'excel' ? 'Excel Report' : 'PDF Summary'} downloading!`, 'success');
    } catch (e) {
      console.error('Export Error:', e);
      const msg = e.response?.data?.error || e.message || 'Export failed';
      addToast(`❌ ${msg}`, 'error');
    }
    setExportLoading(null);
  };

  const clearAllData = async () => {
    if (!confirm('⚠️ This will delete ALL your bills, income, and payments. Your account stays. Are you sure?')) return;
    setClearing(true);
    try {
      await axios.delete(`${API}/auth/data`, { headers: apiHeaders() });
      addToast('All data cleared! 🗑', 'info');
    } catch { addToast('Failed to clear data', 'error'); }
    setClearing(false);
  };

  const deleteAccount = async () => {
    if (confirmDelete !== user?.email) return addToast('Email does not match', 'error');
    setDeletingAccount(true);
    try {
      await axios.delete(`${API}/auth/account`, { headers: apiHeaders() });
      addToast('Account deleted. Goodbye! 👋', 'info');
      logout();
    } catch { addToast('Failed to delete account', 'error'); }
    setDeletingAccount(false);
  };

  const sendVerification = async () => {
    setVerifying(true);
    try {
      const { data } = await axios.post(`${API}/auth/send-verification`, {}, { headers: apiHeaders() });
      setOtpSent(true);
      addToast('OTP sent! Opening your inbox...', 'success');
      if (data.previewUrl) {
        window.open(data.previewUrl, '_blank');
      }
    } catch {
      addToast('Failed to send code', 'error');
    }
    setVerifying(false);
  };

  const verifyEmail = async () => {
    if (otp.length !== 6) return addToast('Code must be 6 digits', 'error');
    setVerifying(true);
    try {
      await axios.post(`${API}/auth/verify-email`, { code: otp }, { headers: apiHeaders() });
      setUser(u => ({ ...u, email_verified: 1 }));
      addToast('Email successfully verified! ✅', 'success');
    } catch (e) {
      addToast(e.response?.data?.error || 'Invalid code', 'error');
    }
    setVerifying(false);
  };

  const handleSignOut = () => {
    if (window.confirm("🔒 Are you sure you want to securely sign out?")) {
      logout();
    }
  };

  return (
    <div className="page">
      <div className="page-header reveal">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-subtitle">Manage your account, preferences, and data</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* LEFT COLUMN */}
        <div>
          {/* ── Profile ── */}
          <Section icon="👤" title="Profile" subtitle="Update your personal information" accent="rgba(var(--primary-rgb),0.5)">
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: 'rgba(var(--primary-rgb),0.06)', borderRadius: 12, border: '1px solid rgba(var(--primary-rgb),0.15)' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0, border: '3px solid var(--glass-border)', overflow: 'hidden' }}>
                  {(profile.avatar?.startsWith('http') || profile.avatar?.startsWith('data:image')) ? (
                    <img src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                  ) : (
                    profile.avatar || user?.name?.[0]?.toUpperCase()
                  )}
                </div>
                <label className="avatar-upload-btn" title="Upload Custom Photo">
                  📷
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setProfile(p => ({ ...p, avatar: reader.result }));
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
                <div style={{ fontSize: 11, marginTop: 6, color: user?.email === 'harshitmehta1012@gmail.com' ? '#fff' : 'var(--primary-light)', background: user?.email === 'harshitmehta1012@gmail.com' ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'rgba(var(--primary-rgb),0.1)', display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {user?.email === 'harshitmehta1012@gmail.com' ? 'SENIOR ADMIN' : user?.role === 'admin' ? 'Administrator' : 'Freelancer Account'}
                </div>
              </div>
            </div>

            {/* Avatar Picker */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>Choose an Avatar</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {AVATARS.map(av => (
                  <button 
                    key={av.id} 
                    onClick={() => setProfile(p => ({ ...p, avatar: av.icon }))}
                    className="avatar-choice"
                    style={{
                      width: 42, height: 42, borderRadius: '50%', background: profile.avatar === av.icon ? 'rgba(var(--primary-rgb), 0.2)' : 'var(--glass)',
                      border: `2px solid ${profile.avatar === av.icon ? 'var(--primary)' : 'var(--glass-border)'}`,
                      fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {av.icon}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="input" value={profile.name} onChange={setP('name')} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email cannot be changed</span>
              </div>
              <div className="form-group">
                <label className="form-label">Default Currency</label>
                <select className="select" value={profile.currency} onChange={setP('currency')}>
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile} style={{ alignSelf: 'flex-start' }}>
                {savingProfile ? '⏳ Saving...' : '💾 Save Profile'}
              </button>
            </div>
          </Section>

          {/* ── Security / Password ── */}
          <Section icon="🔒" title="Security" subtitle="Change your login password" accent="rgba(6,182,212,0.5)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPwd ? 'text' : 'password'} value={pwd.current} onChange={setPw('current')} placeholder="••••••••" style={{ paddingRight: 44 }} />
                  <button onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="input" type={showPwd ? 'text' : 'password'} value={pwd.newPwd} onChange={setPw('newPwd')} placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="input" type={showPwd ? 'text' : 'password'} value={pwd.confirm} onChange={setPw('confirm')} placeholder="Repeat new password" />
                {pwd.newPwd && pwd.confirm && pwd.newPwd !== pwd.confirm && (
                  <span style={{ fontSize: 12, color: '#f87171' }}>⚠️ Passwords don't match</span>
                )}
                {pwd.newPwd && pwd.confirm && pwd.newPwd === pwd.confirm && (
                  <span style={{ fontSize: 12, color: '#6ee7b7' }}>✅ Passwords match</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={changePassword} disabled={savingPwd || !pwd.current || !pwd.newPwd || pwd.newPwd !== pwd.confirm}>
                  {savingPwd ? '⏳...' : '🔐 Change Password'}
                </button>
              </div>
            </div>

            {/* Security info */}
            <div style={{ marginTop: 20, padding: 14, background: 'rgba(6,182,212,0.06)', borderRadius: 10, border: '1px solid rgba(6,182,212,0.15)', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#67e8f9', marginBottom: 8 }}>🛡 Security Tips</div>
              <ul style={{ color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 1.8 }}>
                <li>Use at least 8 characters with numbers & symbols</li>
                <li>Never share your password with anyone</li>
                <li>Sessions expire automatically after 7 days</li>
              </ul>
            </div>
          </Section>

          {/* ── Account Info ── */}
          <Section icon="ℹ️" title="Account Info" subtitle="Your account details at a glance" accent="rgba(16,185,129,0.5)">
            <InfoRow label="Member Since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'} />
            <InfoRow label="Account Type" value="Freelancer (Free)" />
            <InfoRow label="Currency" value={profile.currency} />
            <InfoRow label="User ID" value={`#${user?.id}`} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Email Verified</span>
              {user?.email_verified ? (
                <span style={{ fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>✅ Verified</span>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>❌ Not Verified</span>
                  {!otpSent ? (
                    <button className="btn btn-sm" onClick={sendVerification} disabled={verifying} style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(255,255,255,0.1)' }}>
                      {verifying ? '...' : 'Verify Now'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} style={{ width: 85, padding: '4px 8px', fontSize: 12, borderRadius: 6, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: '#fff', textAlign: 'center' }} />
                      <button className="btn btn-primary btn-sm" onClick={verifyEmail} disabled={verifying} style={{ padding: '4px 10px', fontSize: 12 }}>
                        {verifying ? '...' : 'Verify'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut} style={{ color: '#94a3b8' }}>
                🚪 Secure Sign Out
              </button>
            </div>
          </Section>

          {/* ── Danger Zone ── */}
          <Section icon="⚠️" title="Danger Zone" subtitle="Irreversible actions — proceed with caution" accent="rgba(239,68,68,0.5)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Clear Data */}
              <div style={{ padding: 16, background: 'rgba(239,68,68,0.05)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#fca5a5' }}>🗑 Clear All Data</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  Permanently delete all your bills, income, and payment records. Your account will remain active.
                </div>
                <button className="btn btn-danger btn-sm" onClick={clearAllData} disabled={clearing}>
                  {clearing ? '⏳ Clearing...' : '🗑 Clear All My Data'}
                </button>
              </div>

              {/* Delete Account */}
              <div style={{ padding: 16, background: 'rgba(239,68,68,0.08)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#f87171' }}>💀 Delete Account</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  Permanently delete your account and all data. This action <strong style={{ color: '#f87171' }}>cannot be undone</strong>.
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ color: '#f87171' }}>Type your email to confirm:</label>
                  <input className="input" value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder="Type your email address..." style={{ borderColor: confirmDelete && confirmDelete !== user?.email ? 'rgba(239,68,68,0.5)' : undefined }} />
                </div>
                <button className="btn btn-danger btn-sm" onClick={deleteAccount}
                  disabled={deletingAccount || confirmDelete !== user?.email}>
                  {deletingAccount ? '⏳ Deleting...' : '💀 Delete My Account'}
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* ── Notifications ── */}
          <Section icon="🔔" title="Notifications" subtitle="Control which alerts you receive" accent="rgba(245,158,11,0.5)">
            <Toggle checked={notifs.overdueAlert} onChange={v => handleNotifChange('overdueAlert', v)} label="Overdue Bill Alerts" sub="Show red banner when bills are past due" />
            <Toggle checked={notifs.upcomingReminder} onChange={v => handleNotifChange('upcomingReminder', v)} label="Upcoming Reminders" sub="Highlight bills due within 7 days" />
            <Toggle checked={notifs.recurringAlert} onChange={v => handleNotifChange('recurringAlert', v)} label="Recurring Bill Alerts" sub="Notify when next recurring bill is generated" />
            <Toggle checked={notifs.paymentConfirm} onChange={v => handleNotifChange('paymentConfirm', v)} label="Payment Confirmations" sub="Show success message when bill is paid" />
            <Toggle checked={notifs.weeklyReport} onChange={v => handleNotifChange('weeklyReport', v)} label="Weekly Summary" sub="Display weekly cashflow summary (coming soon)" />
            <Toggle checked={notifs.emailDigest} onChange={v => handleNotifChange('emailDigest', v)} label="Email Digest" sub="Weekly email summary of finances (coming soon)" />
          </Section>

          {/* ── Appearance ── */}
          <Section icon="🎨" title="Appearance" subtitle="Customize how the dashboard looks" accent="rgba(236,72,153,0.5)">
            {/* Dark / Light mode toggle card */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>🌗 Theme Mode</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { id: 'dark', label: 'Dark Mode', icon: '🌙', desc: 'Easy on the eyes at night' },
                  { id: 'light', label: 'Light Mode', icon: '☀️', desc: 'Clean & bright interface' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { if (theme !== t.id) toggleTheme(); }}
                    style={{
                      flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                      border: `2px solid ${theme === t.id ? 'var(--accent-purple)' : 'var(--glass-border)'}`,
                      background: theme === t.id ? 'rgba(var(--primary-rgb),0.12)' : 'var(--glass)',
                      transition: 'all 0.25s', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: theme === t.id ? 'var(--primary-light)' : 'var(--text-secondary)' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{t.desc}</div>
                    {theme === t.id && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--primary-light)', fontWeight: 600 }}>✓ Active</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>Color Theme</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setColorThemeId(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                    borderRadius: 99, border: `2px solid ${colorThemeId === t.id ? t.primary : 'rgba(255,255,255,0.1)'}`,
                    background: colorThemeId === t.id ? `${t.primary}22` : 'transparent',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colorThemeId === t.id ? t.primary : 'var(--text-muted)',
                    fontFamily: 'inherit', transition: 'all 0.2s'
                  }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.primary }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Toggle checked={appearance.compactView} onChange={v => setAppearance(a => ({ ...a, compactView: v }))} label="Compact View" sub="Reduce padding and spacing in tables" />
            <Toggle checked={appearance.showAmounts} onChange={v => setAppearance(a => ({ ...a, showAmounts: v }))} label="Show Amounts" sub="Display financial amounts (disable for privacy)" />
            <Toggle checked={appearance.animationsEnabled} onChange={v => setAppearance(a => ({ ...a, animationsEnabled: v }))} label="Animations" sub="Enable fade-in and hover animations" />
          </Section>

          {/* ── Feedback ── */}
          <Section icon="💬" title="Feedback" subtitle="Help us improve FreelancePay" accent="rgba(139,92,246,0.5)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Your Email (Optional)</label>
                <input className="input" placeholder="How can we reach you back?" value={fbEmail} onChange={e => setFbEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="input" placeholder="What's on your mind?" value={fbSubject} onChange={e => setFbSubject(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="textarea" placeholder="Detailed feedback, bug reports, or feature requests..." value={fbMsg} onChange={e => setFbMsg(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Rating (Optional)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setFbRating(star)} style={{
                      fontSize: 24, background: 'none', border: 'none', cursor: 'pointer',
                      filter: fbRating >= star ? 'none' : 'grayscale(1) opacity(0.3)',
                      transition: 'transform 0.2s'
                    }} onMouseEnter={e => e.target.style.transform = 'scale(1.2)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={sendFeedback} disabled={sendingFb || !fbSubject || !fbMsg}>
                {sendingFb ? '⏳ Sending...' : '🚀 Send Feedback'}
              </button>
            </div>
          </Section>

          {/* ── Data Management ── */}
          <Section icon="📦" title="Data Management" subtitle="Download professional financial reports" accent="rgba(99,102,241,0.5)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Excel Card */}
              <div style={{
                padding: '18px 20px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.05) 100%)',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
                }}>📊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Excel Report (.xlsx)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    4 sheets: Profile · Bills · Payments · Income
                  </div>
                </div>
                <button
                  id="btn-download-excel"
                  onClick={() => exportData('excel')}
                  disabled={!!exportLoading}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: exportLoading ? 'not-allowed' : 'pointer',
                    background: exportLoading === 'excel' ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                    boxShadow: '0 2px 10px rgba(16,185,129,0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {exportLoading === 'excel' ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Generating...</> : <>⬇️ Download</>}
                </button>
              </div>

              {/* PDF Card */}
              <div style={{
                padding: '18px 20px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(251,113,133,0.05) 100%)',
                border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, boxShadow: '0 4px 16px rgba(239,68,68,0.3)'
                }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>PDF Summary (.pdf)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Formatted report: Summary · Bills · Payments · Income
                  </div>
                </div>
                <button
                  id="btn-download-pdf"
                  onClick={() => exportData('pdf')}
                  disabled={!!exportLoading}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: exportLoading ? 'not-allowed' : 'pointer',
                    background: exportLoading === 'pdf' ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                    boxShadow: '0 2px 10px rgba(239,68,68,0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {exportLoading === 'pdf' ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Generating...</> : <>⬇️ Download</>}
                </button>
              </div>

              {/* Info */}
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>🔐</span>
                <span>Reports open in a new tab and download automatically. Links expire in 60 seconds for your security.</span>
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* Responsive collapse to single column */}
      <style>{`@media (max-width: 900px) { .settings-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
