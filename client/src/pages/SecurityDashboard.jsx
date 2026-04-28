import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, apiHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';
const StatCard = ({ title, value, icon, color, subtext, onClick }) => (
  <div 
    className="glass-card stat-card" 
    onClick={onClick}
    style={{ 
        padding: '24px', flex: 1, minWidth: '240px', cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative', overflow: 'hidden'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative', zIndex: 1 }}>
      <span style={{ fontSize: 24, filter: `drop-shadow(0 0 8px ${color || 'var(--primary)'})` }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>{title}</span>
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color: color || 'var(--text-primary)', marginBottom: 4, position: 'relative', zIndex: 1 }}>
        {value}
    </div>
    {subtext && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, position: 'relative', zIndex: 1 }}>{subtext}</div>}
    
    <div className="card-glow" style={{ background: color || 'var(--primary)' }}></div>
  </div>
);

export default function SecurityDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [users, setUsers] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const [maintenance, setMaintenance] = useState(false);
  const [regEnabled, setRegEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const [statsRes, logsRes, feedbackRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/security-stats`),
        axios.get(`${API}/admin/security-logs`),
        axios.get(`${API}/admin/feedback`),
        axios.get(`${API}/admin/users`)
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
      setFeedback(feedbackRes.data);
      setUsers(usersRes.data);
      setMaintenance(statsRes.data.settings?.maintenance_mode || false);
      setRegEnabled(statsRes.data.settings?.registration_enabled || false);

      if (activeTab === 'explorer') {
          const [infoRes, envRes, tablesRes] = await Promise.all([
              axios.get(`${API}/admin/system-info`),
              axios.get(`${API}/admin/env-safe`),
              axios.get(`${API}/admin/db/tables`)
          ]);
          setSystemInfo(infoRes.data);
          setEnvData(envRes.data);
          setTables(tablesRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin data');
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const toggleMaintenance = async () => {
    try {
      const res = await axios.post(`${API}/admin/toggle-maintenance`);
      setMaintenance(res.data.maintenance_mode);
      fetchData(true);
    } catch (err) { console.error('Toggle failed'); }
  };

  const toggleRegistration = async () => {
    try {
      const res = await axios.post(`${API}/admin/toggle-registration`);
      setRegEnabled(res.data.registration_enabled);
      fetchData(true);
    } catch (err) { console.error('Toggle failed'); }
  };

  const clearCache = async () => {
    if (!window.confirm('Clear all server-side response cache?')) return;
    try {
      await axios.post(`${API}/admin/clear-cache`);
      alert('Application cache cleared successfully!');
    } catch (err) { alert('Failed to clear cache'); }
  };

  const purgeLogs = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete ALL security logs. Proceed?')) return;
    try {
      await axios.post(`${API}/admin/purge-logs`);
      fetchData(true);
      alert('Logs purged successfully.');
    } catch (err) { alert('Failed to purge logs'); }
  };

  const systemRestart = async () => {
    if (!window.confirm('Request a graceful system restart? This will log all users out.')) return;
    try {
      await axios.post(`${API}/admin/system-restart`);
      alert('Restart command sent. The application will recycle shortly.');
    } catch (err) { alert('Failed to send restart command'); }
  };

  const fetchTableData = async (tableName) => {
    setSelectedTable(tableName);
    try {
      const res = await axios.get(`${API}/admin/db/table/${tableName}`);
      setTableData(res.data);
    } catch (err) { console.error('Failed to fetch table data'); }
  };

  const updateUserRole = async (userId, newRole) => {
    const verb = newRole === 'admin' ? 'PROMOTE' : 'DEMOTE';
    if (!window.confirm(`⚠️ ${verb} USER: Are you sure you want to change this user's clearance level to ${newRole.toUpperCase()}?`)) return;
    try {
      await axios.post(`${API}/admin/users/${userId}/role`, { role: newRole }, { headers: apiHeaders() });
      addToast(`Access clearance updated: User ${newRole === 'admin' ? 'Promoted' : 'Demoted'}`, 'success');
      fetchData(true);
    } catch (err) { 
      addToast(err.response?.data?.error || 'Authorization update failed', 'error');
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (!window.confirm(`⚠️ CRITICAL ACTION: Are you sure you want to COMPLETELY DELETE user ${userEmail} and all their data? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { headers: apiHeaders() });
      addToast('User identity purged from system', 'success');
      fetchData(true);
    } catch (err) { addToast(err.response?.data?.error || 'Purge failed', 'error'); }
  };

  const banUser = async (userId, userEmail) => {
    if (userEmail === 'harshitmehta1012@gmail.com') return addToast('Cannot ban root admin', 'error');
    if (!window.confirm(`⚠️ PERMANENT BAN: Are you sure you want to ban ${userEmail}? This will permanently revoke all access and wipe their verification status.`)) return;
    
    try {
      await axios.post(`${API}/admin/ban-user`, { userId }, { headers: apiHeaders() });
      addToast(`Target ${userEmail} permanently blacklisted`, 'success');
      // Immediately remove from list locally
      setUsers(prev => prev.filter(u => u.id !== userId));
      fetchData(true);
    } catch (e) {
      addToast(e.response?.data?.error || 'Failed to ban user', 'error');
    }
  };

  const sendAdminMessage = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUserForMessage || !msgTitle || !msgBody) {
      return addToast('Please fill in all required fields', 'error');
    }

    setSendingMsg(true);
    try {
      await axios.post(`${API}/admin/notifications`, {
        user_id: selectedUserForMessage.id,
        title: msgTitle,
        message: msgBody,
        type: 'admin_message'
      });
      addToast(`Message transmitted to ${selectedUserForMessage.name}`, 'success');
      setMsgTitle('');
      setMsgBody('');
      setSelectedUserForMessage(null);
      setActiveTab('users');
      fetchData(true);
    } catch (err) {
      addToast(err.response?.data?.error || 'Transmission failed', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading && !stats) return (
    <div className="page reveal active" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
      {/* Header Skeleton */}
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Skeleton width="16px" height="16px" shape="circle" />
            <Skeleton width="350px" height="40px" />
          </div>
          <Skeleton width="280px" height="20px" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Skeleton width="140px" height="40px" style={{ borderRadius: 8 }} />
          <Skeleton width="140px" height="40px" style={{ borderRadius: 8 }} />
        </div>
      </header>

      {/* Stats Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Skeleton width="100px" height="16px" />
              <Skeleton width="32px" height="32px" style={{ borderRadius: 8 }} />
            </div>
            <Skeleton width="140px" height="36px" style={{ marginBottom: 12 }} />
            <Skeleton width="180px" height="14px" />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Main Panel Skeleton */}
        <div className="glass-card" style={{ padding: 24 }}>
          <Skeleton width="200px" height="24px" style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                <Skeleton width="40px" height="40px" style={{ borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="160px" height="16px" style={{ marginBottom: 8 }} />
                  <Skeleton width="120px" height="12px" />
                </div>
                <Skeleton width="80px" height="24px" style={{ borderRadius: 12 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel Skeleton */}
        <div className="glass-card" style={{ padding: 24 }}>
          <Skeleton width="150px" height="24px" style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Skeleton width="120px" height="14px" />
                  <Skeleton width="40px" height="14px" />
                </div>
                <Skeleton width="100%" height="8px" style={{ borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page reveal active" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
        <div className="animate-in-down" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className={`status-orb ${refreshing ? 'pulse' : ''}`} style={{ background: '#10b981', boxShadow: '0 0 15px #10b981' }}></div>
            <h1 style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Space Grotesk', letterSpacing: '-1px', background: 'linear-gradient(90deg, #fff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Cyber-Cloud Control Center
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
            <span style={{ color: 'var(--primary)' }}>ROOT_ACCESS:</span> {user?.email} | <span style={{ color: '#ef4444' }}>SEC_LEVEL:</span> HIGH
          </p>
        </div>
        
        <div className="animate-in-down" style={{ display: 'flex', gap: 12, animationDelay: '0.2s' }}>
          <button 
            onClick={toggleMaintenance}
            className={`btn-premium ${maintenance ? 'active' : ''}`}
            style={{ '--btn-color': '#ef4444' }}
          >
            <span className="btn-icon">{maintenance ? '🛑' : '⚙️'}</span>
            <span className="btn-text">{maintenance ? 'MAINTENANCE: ON' : 'LOCK SYSTEM'}</span>
          </button>
          <button 
            onClick={toggleRegistration}
            className={`btn-premium ${!regEnabled ? 'active' : ''}`}
            style={{ '--btn-color': 'var(--primary)' }}
          >
            <span className="btn-icon">{regEnabled ? '👥' : '🚫'}</span>
            <span className="btn-text">{regEnabled ? 'REGISTRATION: OPEN' : 'REGISTRATION: CLOSED'}</span>
          </button>
        </div>
      </header>

      {/* Global Intelligence Row */}
      <div className="animate-in-up" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 40, animationDelay: '0.3s' }}>
        <StatCard 
            title="Platform Revenue" 
            value={`$${(stats?.platform_revenue || 0).toLocaleString()}`} 
            icon="💰" 
            color="#8b5cf6" 
            subtext="Lifetime volume" 
            onClick={() => fetchData(true)}
        />
        <StatCard 
            title="Total Users" 
            value={stats?.total_users || 0} 
            icon="👥" 
            color="#3b82f6" 
            subtext="Registered accounts" 
            onClick={() => setActiveTab('users')}
        />
        <StatCard 
            title="Threats Neutralized" 
            value={stats?.threats_neutralized || 0} 
            icon="🛡️" 
            color="#ef4444" 
            subtext="Automated blocks" 
            onClick={() => setActiveTab('logs')}
        />
        <StatCard 
            title="Memory Usage" 
            value={stats?.system_health?.memory_usage || '0%'} 
            icon="⚡" 
            color="#10b981" 
            subtext={`Uptime: ${stats?.system_health?.uptime || 'Calculating...'}`} 
            onClick={() => setActiveTab('explorer')}
        />
      </div>

      <div className="card main-dashboard-card animate-in-up" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)', animationDelay: '0.4s' }}>
        <div className="tab-header" style={{ padding: '0 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: 32, background: 'rgba(255,255,255,0.02)', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab('logs')} className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}>SECURITY AUDIT</button>
          <button onClick={() => setActiveTab('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>USER MANAGEMENT</button>
          <button onClick={() => setActiveTab('feedback')} className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}>USER FEEDBACK</button>
          <button onClick={() => setActiveTab('messaging')} className={`tab-btn ${activeTab === 'messaging' ? 'active' : ''}`} style={{ color: 'var(--primary-light)', fontWeight: 800 }}>DIRECT MESSAGING</button>
          <button onClick={() => setActiveTab('explorer')} className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''}`}>DEV & SYSTEM TOOLS</button>
        </div>

        <div className="tab-content" style={{ minHeight: '500px', transition: 'all 0.3s ease' }}>
            {activeTab === 'logs' && (
              <div className="tab-pane fade-in">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>TIMESTAMP</th>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>EVENT</th>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>IP ADDRESS</th>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>TELEMETRY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, i) => (
                        <tr key={log.id} className="row-hover" style={{ borderBottom: '1px solid var(--glass-border)', animation: `slideInLeft 0.3s ease forwards ${i * 0.05}s`, opacity: 0 }}>
                            <td style={{ padding: '18px 24px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{new Date(log.created_at).toLocaleString()}</td>
                            <td style={{ padding: '18px 24px' }}>
                            <span className={`badge ${log.event_type.includes('MALICIOUS') || log.event_type.includes('BAN') ? 'danger' : 'primary'}`}>
                                {log.event_type}
                            </span>
                            </td>
                            <td style={{ padding: '18px 24px', fontFamily: 'monospace', fontWeight: 600 }}>{log.ip_address}</td>
                            <td style={{ padding: '18px 24px', color: 'var(--text-secondary)' }}>{log.details}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="tab-pane fade-in">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>USER</th>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>EMAIL</th>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>ROLE</th>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>JOINED</th>
                        <th style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(u => u.is_banned !== 1).map((u, i) => (
                        <tr key={u.id} className="row-hover" style={{ borderBottom: '1px solid var(--glass-border)', animation: `slideInLeft 0.3s ease forwards ${i * 0.05}s`, opacity: 0 }}>
                            <td style={{ padding: '18px 24px', fontWeight: 700 }}>{u.name}</td>
                            <td style={{ padding: '18px 24px', color: 'var(--text-secondary)' }}>{u.email}</td>
                            <td style={{ padding: '18px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className={`badge ${u.email === 'harshitmehta1012@gmail.com' ? 'senior-admin' : u.role === 'admin' ? 'warning' : 'ghost'}`}>
                                  {u.email === 'harshitmehta1012@gmail.com' ? 'SENIOR ADMIN' : u.role.toUpperCase()}
                              </span>
                              {u.is_banned === 1 && (
                                <span className="badge danger" style={{ animation: 'blink 1s infinite' }}>BANNED</span>
                              )}
                            </div>
                            </td>
                            <td style={{ padding: '18px 24px', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '18px 24px', display: 'flex', gap: 12 }}>
                             <button 
                                 onClick={() => {
                                   setSelectedUserForMessage(u);
                                   setActiveTab('messaging');
                                 }}
                                 className="action-btn"
                                 style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary-light)', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                             >
                                 MESSAGE
                             </button>
                             <button 
                                 onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                 className="action-btn"
                                 disabled={u.is_banned === 1}
                                 style={{ opacity: u.is_banned === 1 ? 0.3 : 1 }}
                             >
                                 {u.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}
                             </button>
                             <button 
                                 onClick={() => banUser(u.id, u.email)}
                                 className={`action-btn ${u.is_banned === 1 ? 'ghost' : 'danger'}`}
                                 disabled={u.is_banned === 1}
                                 style={{ 
                                   opacity: u.is_banned === 1 ? 0.5 : 1,
                                   background: u.is_banned === 1 ? 'rgba(239, 68, 68, 0.1)' : undefined 
                                 }}
                             >
                                 {u.is_banned === 1 ? 'LOCKED' : 'BAN'}
                             </button>
                             </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
              </div>
            )}

            {activeTab === 'messaging' && (
              <div className="tab-pane fade-in" style={{ padding: '40px', maxWidth: 800, margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: 40, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📨</div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Secure Communications Node</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Send an encrypted, one-way administrative message to any user.</p>
                  </div>

                  <form onSubmit={sendAdminMessage} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Target Recipient</label>
                      <select 
                        className="cyber-input"
                        value={selectedUserForMessage?.id || ''}
                        onChange={(e) => {
                          const u = users.find(u => u.id === parseInt(e.target.value));
                          setSelectedUserForMessage(u);
                        }}
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#fff' }}
                      >
                        <option value="">Select a user...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Message Title / Subject</label>
                      <input 
                        type="text"
                        className="cyber-input"
                        placeholder="e.g. Account Security Update"
                        value={msgTitle}
                        onChange={(e) => setMsgTitle(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#fff' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Message Payload</label>
                      <textarea 
                        rows="6"
                        className="cyber-input"
                        placeholder="Enter the message content here..."
                        value={msgBody}
                        onChange={(e) => setMsgBody(e.target.value)}
                        style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#fff', resize: 'vertical' }}
                      ></textarea>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                      <button 
                        type="button" 
                        className="btn btn-ghost" 
                        style={{ flex: 1 }}
                        onClick={() => {
                          setMsgTitle('');
                          setMsgBody('');
                          setSelectedUserForMessage(null);
                          setActiveTab('users');
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ flex: 2, gap: 10 }}
                        disabled={sendingMsg}
                      >
                        {sendingMsg ? 'TRANSMITTING...' : 'SEND SECURE MESSAGE'}
                        <span style={{ fontSize: 18 }}>🚀</span>
                      </button>
                    </div>
                  </form>

                  <div style={{ marginTop: 32, padding: 20, background: 'rgba(245, 158, 11, 0.05)', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontSize: 24 }}>⚠️</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Protocol Note:</strong> Messages are one-way. Users will receive a notification and can read the full message, but cannot reply through this channel. All administrative communications are logged for audit purposes.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="tab-pane fade-in" style={{ padding: '32px', display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
                {feedback.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1', padding: 60 }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                        <p>No user feedback received yet.</p>
                    </div>
                ) : feedback.map((item, i) => (
                  <div 
                    key={item.id} 
                    className="glass-card feedback-card interactive" 
                    onClick={() => setSelectedFeedback(item)}
                    style={{ padding: 28, animation: `scaleIn 0.4s ease forwards ${i * 0.1}s`, opacity: 0, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>{item.subject}</h3>
                      <div className="rating-stars">{'⭐'.repeat(item.rating)}</div>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.message}</p>
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{item.email}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

      {/* Feedback Modal Reader */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)} style={{ zIndex: 10000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, animation: 'modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>💬</span>
                <h2 className="modal-title">Feedback Details</h2>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedFeedback(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '30px 40px' }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{selectedFeedback.subject}</h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ fontSize: 18, filter: i < selectedFeedback.rating ? 'none' : 'grayscale(1)', opacity: i < selectedFeedback.rating ? 1 : 0.3 }}>⭐</span>
                  ))}
                </div>
              </div>
              
              <div style={{ 
                lineHeight: 1.8, fontSize: 15, color: 'var(--text-secondary)', 
                background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 16, border: '1px solid var(--glass-border)',
                whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto'
              }}>
                {selectedFeedback.message}
              </div>
              
              <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 1 }}>SENDER</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', wordBreak: 'break-all' }}>{selectedFeedback.email}</div>
                </div>
                <div style={{ background: 'var(--glass)', padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 1 }}>TIMESTAMP</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(selectedFeedback.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedFeedback(null)}>Close Reader</button>
              <button className="btn btn-primary" onClick={() => {
                window.location.href = `mailto:${selectedFeedback.email}?subject=Re: ${selectedFeedback.subject}`;
              }}>Reply via Email</button>
            </div>
          </div>
        </div>
      )}

            {activeTab === 'explorer' && (
              <div className="tab-pane fade-in" style={{ padding: 40 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 32, marginBottom: 40 }}>
                  <div className="glass-card tool-card" style={{ padding: 28 }}>
                    <h4 className="tool-title" style={{ color: 'var(--primary)' }}>SYSTEM DIAGNOSTICS</h4>
                    <div style={{ display: 'grid', gap: 16, fontSize: 13 }}>
                      <div className="diag-item"><span>Node Version:</span> <code>{systemInfo?.node_version || 'Loading...'}</code></div>
                      <div className="diag-item"><span>Platform:</span> <span>{systemInfo?.platform || '---'} ({systemInfo?.arch || '---'})</span></div>
                      <div className="diag-item"><span>Process Uptime:</span> <span>{systemInfo ? Math.floor(systemInfo.process_uptime / 60) : 0} minutes</span></div>
                      <div className="diag-item"><span>Heap Used:</span> <span>{systemInfo ? Math.round(systemInfo.memory?.heapUsed / 1024 / 1024) : 0} MB</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <button onClick={clearCache} className="btn-glow">
                            <span className="glow-icon">🔥</span> CACHE
                        </button>
                        <button onClick={purgeLogs} className="btn-glow danger">
                            <span className="glow-icon">🗑️</span> LOGS
                        </button>
                      </div>
                      <button onClick={systemRestart} className="btn-glow warning" style={{ marginTop: 4 }}>
                        <span className="glow-icon">🔄</span> SYSTEM RESTART
                      </button>
                    </div>
                  </div>

                  <div className="glass-card tool-card" style={{ padding: 28 }}>
                    <h4 className="tool-title" style={{ color: '#f59e0b' }}>DATABASE ACCESS</h4>
                    <div className="table-selector">
                        {tables.map(t => (
                            <button 
                                key={t} 
                                onClick={() => fetchTableData(t)}
                                className={`table-chip ${selectedTable === t ? 'active' : ''}`}
                            >
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    {selectedTable && (
                        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                            Showing last 100 entries from <b>{selectedTable}</b>
                        </div>
                    )}
                  </div>
                </div>

                {selectedTable && tableData.length > 0 && (
                    <div className="table-explorer-container animate-in-up">
                        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>RAW DATA EXPLORER</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tableData.length} records found</span>
                        </div>
                        <div style={{ overflowX: 'auto', padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                        {Object.keys(tableData[0]).map(key => (
                                            <th key={key} style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{key.toUpperCase()}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, i) => (
                                        <tr key={i} className="row-hover-dark">
                                            {Object.values(row).map((val, j) => (
                                                <td key={j} style={{ padding: '10px 20px', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {String(val)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="terminal-container">
                  <div className="terminal-header">
                    <div className="dots"><span style={{background:'#ff5f56'}}></span><span style={{background:'#ffbd2e'}}></span><span style={{background:'#27c93f'}}></span></div>
                    <div className="title">CYBER_SHELL_SECURE_SESSION</div>
                  </div>
                  <div className="terminal-body">
                    <div className="terminal-line system">[SYSTEM] Cyber-Cloud shell v4.2.0 initialized...</div>
                    <div className="terminal-line user">root@freelancepay:~# system --status --verbose</div>
                    <div className="terminal-output">
                        <span className="bullet">{'>'}</span> Platform Volume: <span className="highlight">${(stats?.platform_revenue || 0).toLocaleString()}</span><br/>
                        <span className="bullet">{'>'}</span> Database Stack: <span className="success">SQLite (Primary) + MongoDB (Audit)</span><br/>
                        <span className="bullet">{'>'}</span> AI Neural Shield: <span className="success">ACTIVE_THREAT_SCANNING</span><br/>
                        <span className="bullet">{'>'}</span> Last Integrity Check: {new Date().toLocaleTimeString()}<br/>
                        <span className="bullet">{'>'}</span> Platform Latency: 12.4ms<br/>
                        <span className="warn">[SECURITY] Registration is {regEnabled ? 'OPEN' : 'CLOSED'} to new users.</span><br/>
                        <span className="info">[MODE] Cluster is {maintenance ? 'UNDER_MAINTENANCE' : 'LIVE_AND_PRODUCTION'}.</span>
                    </div>
                    <div className="terminal-cursor-line">
                        <span className="prompt">root@freelancepay:~#</span> <span className="cursor-blink">_</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
      
      <style>{`
        /* --- Animations --- */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes glow { 0% { opacity: 0.3; } 50% { opacity: 0.6; } 100% { opacity: 0.3; } }

        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .animate-in-up { animation: slideInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .animate-in-down { animation: slideInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .pulse { animation: pulse 2s infinite ease-in-out; }

        /* --- Global Elements --- */
        .status-orb { width: 12px; height: 12px; borderRadius: 50%; }
        
        /* --- Stat Cards --- */
        .stat-card:hover {
            transform: translateY(-8px);
            border-color: rgba(139, 92, 246, 0.4);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(139, 92, 246, 0.1);
        }
        .stat-card:active { transform: translateY(-4px) scale(0.98); }
        .card-glow {
            position: absolute; top: -50%; right: -50%; width: 150px; height: 150px;
            filter: blur(60px); opacity: 0.05; transition: opacity 0.3s; pointer-events: none;
        }
        .stat-card:hover .card-glow { opacity: 0.15; animation: glow 2s infinite; }

        /* --- Buttons --- */
        .btn-premium {
            padding: 10px 20px; border-radius: 12px; border: 1px solid var(--glass-border);
            background: rgba(255, 255, 255, 0.03); color: #fff; font-size: 13px; font-weight: 700;
            display: flex; align-items: center; gap: 10px; cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-premium:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: var(--btn-color);
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
            transform: translateY(-2px);
        }
        .btn-premium.active {
            background: var(--btn-color);
            border-color: transparent;
            box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
        }
        .btn-premium:active { transform: translateY(0) scale(0.95); }

        /* --- Tabs --- */
        .tab-btn {
            padding: 24px 0; background: none; border: none; white-space: nowrap;
            color: var(--text-muted); border-bottom: 2px solid transparent;
            font-weight: 800; cursor: pointer; font-size: 12px; text-transform: uppercase;
            letter-spacing: 1.5px; transition: all 0.3s;
        }
        .tab-btn:hover { color: #fff; }
        .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }

        /* --- Badges --- */
        .badge {
            padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800;
            letter-spacing: 0.5px;
        }
        .badge.primary { background: rgba(139, 92, 246, 0.15); color: var(--primary-light); }
        .badge.danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .badge.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .badge.senior-admin { 
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3)); 
            color: #fff; 
            border: 1px solid rgba(139, 92, 246, 0.5);
            text-shadow: 0 0 5px rgba(255,255,255,0.5);
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
        }
        .badge.ghost { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }

        /* --- Rows --- */
        .row-hover:hover { background: rgba(255, 255, 255, 0.025); }
        .action-btn {
            background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border);
            color: var(--text-secondary); padding: 5px 12px; border-radius: 6px;
            font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .action-btn:hover { background: var(--primary); color: #fff; border-color: transparent; transform: translateY(-1px); }
        .action-btn.danger:hover { background: #ef4444; }

        /* --- Tools --- */
        .diag-item { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 8px; }
        .diag-item code { color: var(--primary-light); font-family: monospace; font-size: 11px; }
        .btn-glow {
            width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(139, 92, 246, 0.3);
            background: rgba(139, 92, 246, 0.05); color: var(--primary-light); font-weight: 700;
            cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;
            font-size: 11px;
        }
        .btn-glow:hover { background: var(--primary); color: #fff; box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
        .btn-glow.danger { border-color: rgba(239, 68, 68, 0.3); color: #f87171; background: rgba(239, 68, 68, 0.05); }
        .btn-glow.danger:hover { background: #ef4444; color: #fff; box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
        .btn-glow.warning { border-color: rgba(245, 158, 11, 0.3); color: #fbbf24; background: rgba(245, 158, 11, 0.05); }
        .btn-glow.warning:hover { background: #f59e0b; color: #fff; box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }

        .table-selector { display: flex; flex-wrap: wrap; gap: 10px; }
        .table-chip {
            padding: 8px 16px; border-radius: 8px; border: 1px solid var(--glass-border);
            background: rgba(255, 255, 255, 0.03); color: var(--text-muted); cursor: pointer;
            font-size: 11px; font-weight: 700; transition: all 0.3s;
        }
        .table-chip:hover { border-color: var(--primary); color: #fff; transform: scale(1.05); }
        .table-chip.active { background: var(--primary); color: #fff; border-color: transparent; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3); }

        .table-explorer-container {
            background: #000; border-radius: 16px; border: 1px solid var(--glass-border);
            overflow: hidden; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .row-hover-dark:hover { background: rgba(255,255,255,0.05); }

        /* --- Terminal --- */
        .terminal-container {
            background: #0d0d1a; border-radius: 12px; overflow: hidden;
            border: 1px solid rgba(139, 92, 246, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        .terminal-header {
            background: rgba(255, 255, 255, 0.05); padding: 12px 20px;
            display: flex; align-items: center; justify-content: space-between;
        }
        .terminal-header .dots { display: flex; gap: 8px; }
        .terminal-header .dots span { width: 10px; height: 10px; border-radius: 50%; }
        .terminal-header .title { font-size: 10px; color: var(--text-muted); font-family: monospace; letter-spacing: 1px; }
        .terminal-body { padding: 24px; font-family: 'JetBrains Mono', monospace; font-size: 13px; min-height: 250px; }
        .terminal-line { margin-bottom: 8px; }
        .terminal-line.system { color: rgba(139, 92, 246, 0.7); }
        .terminal-line.user { color: #fff; font-weight: 700; }
        .terminal-output { margin-left: 12px; line-height: 1.8; color: var(--text-secondary); }
        .terminal-output .bullet { color: #444; margin-right: 10px; }
        .terminal-output .highlight { color: var(--primary-light); font-weight: 700; }
        .terminal-output .success { color: #10b981; }
        .terminal-output .warn { color: #f59e0b; }
        .terminal-output .info { color: #3b82f6; }
        .terminal-cursor-line { margin-top: 12px; }
        .terminal-cursor-line .prompt { color: var(--primary-light); margin-right: 10px; }
        .cursor-blink { animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .loader-ring {
            width: 48px; height: 48px; border: 4px solid rgba(139, 92, 246, 0.1);
            border-top-color: var(--primary); border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
