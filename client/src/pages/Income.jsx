import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { API, apiHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Skeleton from '../components/Skeleton';
const IncomeModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ description: '', amount: '', received_date: new Date().toISOString().split('T')[0], client: '', category: 'freelance' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const CATS = ['freelance', 'retainer', 'design', 'development', 'consulting', 'writing', 'other'];
  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, amount: parseFloat(form.amount) });
    setSaving(false);
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">💰 Add Income</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input className="input" placeholder="e.g. Website redesign for TechCorp" value={form.description} onChange={set('description')} required />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input className="input" type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={set('amount')} />
            </div>
            <div className="form-group">
              <label className="form-label">Received Date</label>
              <input className="input" type="date" value={form.received_date} onChange={set('received_date')} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Client</label>
              <input className="input" placeholder="Client name" value={form.client} onChange={set('client')} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="select" value={form.category} onChange={set('category')}>
                {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.description || !form.amount}>
            {saving ? '⏳...' : '💰 Add Income'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Income() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    const { data } = await axios.get(`${API}/income`, { headers: apiHeaders() });
    setIncome(data);
    setLoading(false);
  }, []);
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await load();
      if (!isMounted) return;
    };
    init();
    return () => { isMounted = false; };
  }, [load]);

  const addIncome = async (form) => {
    try {
      await axios.post(`${API}/income`, form, { headers: apiHeaders() });
      addToast('Income added! 💰', 'success');
      setShowModal(false);
      load();
    } catch { addToast('Failed to add income', 'error'); }
  };

  const deleteIncome = async (id) => {
    if (!confirm('Delete this income entry?')) return;
    await axios.delete(`${API}/income/${id}`, { headers: apiHeaders() });
    addToast('Entry deleted', 'info');
    load();
  };

  // Monthly stats
  const monthly = {};
  income.forEach(i => {
    const m = i.received_date.slice(0, 7);
    monthly[m] = (monthly[m] || 0) + i.amount;
  });
  const chartData = Object.entries(monthly).sort().slice(-6).map(([m, v]) => ({
    month: new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
    income: v
  }));

  const total = income.reduce((s, i) => s + i.amount, 0);
  const thisMonth = income.filter(i => i.received_date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, i) => s + i.amount, 0);
  const clientTotals = {};
  income.forEach(i => { if (i.client) clientTotals[i.client] = (clientTotals[i.client] || 0) + i.amount; });
  const topClient = Object.entries(clientTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div>
            <h1 className="page-title">💰 Income Tracker</h1>
            <p className="page-subtitle">Track your freelance earnings</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Log Income</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { label: 'Total Earned', value: total, icon: '🏆', grad: 'linear-gradient(135deg, #f59e0b, #d97706)' },
          { label: 'This Month', value: thisMonth, icon: '📅', grad: 'linear-gradient(135deg, #10b981, #059669)' },
          { label: 'Top Client', value: topClient?.[0] || '—', icon: '⭐', isText: true },
          { label: 'Entries', value: income.length, icon: '📋', isCount: true },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ flex: 1, minWidth: 160, padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: s.isText ? 18 : 22, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', background: s.grad, WebkitBackgroundClip: s.grad ? 'text' : undefined, WebkitTextFillColor: s.grad ? 'transparent' : undefined }}>
              {s.isText ? s.value : s.isCount ? s.value : formatCurrency(s.value, currency)}
            </div>
            {topClient && s.label === 'Top Client' && <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 2 }}>{formatCurrency(topClient[1], currency)}</div>}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>📈 Monthly Income Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="incG2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} formatter={v => formatCurrency(v, currency)} />
            <Area type="monotone" dataKey="income" stroke="#f59e0b" strokeWidth={2} fill="url(#incG2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income list */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📋 All Income</h3>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Skeleton width="25%" height="20px" />
                <Skeleton width="15%" height="20px" />
                <Skeleton width="15%" height="20px" style={{ borderRadius: 99 }} />
                <Skeleton width="15%" height="20px" />
                <Skeleton width="15%" height="20px" />
                <Skeleton width="10%" height="20px" />
              </div>
            ))}
          </div>
        ) : income.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">💸</div><p>No income logged yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Description</th><th>Client</th><th>Category</th><th>Date</th><th>Amount</th><th></th></tr>
              </thead>
              <tbody>
                {income.map(i => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.description}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{i.client || '—'}</td>
                    <td><span style={{ fontSize: 12, background: 'rgba(245,158,11,0.1)', color: '#fcd34d', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(245,158,11,0.2)' }}>{i.category}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(i.received_date)}</td>
                    <td style={{ fontWeight: 700, color: '#6ee7b7', fontFamily: 'Space Grotesk, sans-serif' }}>{formatCurrency(i.amount, currency)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteIncome(i.id)} style={{ color: '#f87171' }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && <IncomeModal onClose={() => setShowModal(false)} onSave={addIncome} />}
    </div>
  );
}
