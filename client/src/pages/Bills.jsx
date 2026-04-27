import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API, apiHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, daysUntil, getCategoryMeta, CATEGORIES, RECURRENCES } from '../utils/helpers';
import { notificationEngine } from '../utils/NotificationManager';

const STATUS_FILTERS = ['all', 'upcoming', 'overdue', 'paid'];

const BillModal = ({ bill, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: bill?.name || '', category: bill?.category || 'software',
    amount: bill?.amount || '', due_date: bill?.due_date || new Date().toISOString().split('T')[0],
    recurrence: bill?.recurrence || 'monthly', notes: bill?.notes || '', client: bill?.client || '',
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.due_date) return;
    setSaving(true);
    await onSave({ ...form, amount: parseFloat(form.amount) });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{bill ? '✏️ Edit Bill' : '➕ Add New Bill'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Bill Name *</label>
            <input className="input" placeholder="e.g. AWS Hosting" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input className="input" type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={set('amount')} required />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input className="input" type="date" value={form.due_date} onChange={set('due_date')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Recurrence</label>
              <select className="select" value={form.recurrence} onChange={set('recurrence')}>
                {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Client / Vendor</label>
            <input className="input" placeholder="Who is this bill for/from?" value={form.client} onChange={set('client')} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="textarea" placeholder="Any extra details..." value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.amount}>
            {saving ? '⏳ Saving...' : bill ? '💾 Update' : '➕ Add Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PayModal = ({ bill, onClose, onPay, currency }) => {
  const [amount, setAmount] = useState(bill.amount);
  const [note, setNote] = useState('');
  const [paying, setPaying] = useState(false);
  const handlePay = async () => {
    setPaying(true);
    await onPay(bill.id, amount, note);
    setPaying(false);
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">💳 Mark as Paid</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '16px 20px', background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', marginBottom: 8 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Bill</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{bill.name}</div>
            {bill.recurrence !== 'one-time' && (
              <div style={{ fontSize: 13, color: '#6ee7b7', marginTop: 4 }}>🔄 Recurring ({bill.recurrence}) — next bill auto-created</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Amount Paid</label>
            <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Note (optional)</label>
            <input className="input" placeholder="e.g. Paid via wire transfer" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handlePay} disabled={paying}>
            {paying ? '⏳...' : `✅ Confirm Payment ${formatCurrency(amount, currency)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Bills() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalBill, setModalBill] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [payBill, setPayBill] = useState(null);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    const { data } = await axios.get(`${API}/bills`, { headers: apiHeaders() });
    setBills(data);
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

  const saveBill = async (form) => {
    try {
      if (modalBill) {
        await axios.patch(`${API}/bills/${modalBill.id}`, form, { headers: apiHeaders() });
        addToast('Bill updated! ✏️', 'success');
      } else {
        await axios.post(`${API}/bills`, form, { headers: apiHeaders() });
        addToast('Bill added! ➕', 'success');
        notificationEngine.notify('✨ New Bill Created', { body: `"${form.name}" has been added to your schedule.`, type: 'upcomingReminder' });
      }
      setModalBill(undefined);
      load();
    } catch { addToast('Failed to save bill', 'error'); }
  };

  const deleteBill = async (id) => {
    if (!confirm('Delete this bill?')) return;
    try {
      await axios.delete(`${API}/bills/${id}`, { headers: apiHeaders() });
      addToast('Bill deleted', 'info');
      load();
    } catch { addToast('Failed to delete', 'error'); }
  };

  const payBillFn = async (id, amount, note) => {
    try {
      await axios.post(`${API}/bills/${id}/pay`, { amount, note }, { headers: apiHeaders() });
      addToast('Marked as paid! 🎉', 'success');
      const bill = bills.find(b => b.id === id);
      notificationEngine.alertSuccess('Payment Confirmed', `Successfully paid ${formatCurrency(amount, currency)} for "${bill?.name || 'Bill'}"`);
      load();
    } catch { addToast('Failed to mark paid', 'error'); }
  };

  const filtered = bills.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.client?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const overdueCnt = bills.filter(b => b.status === 'overdue').length;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">💳 Bills Manager</h1>
            <p className="page-subtitle">{bills.length} total bills — {overdueCnt > 0 && <span style={{ color: '#f87171' }}>{overdueCnt} overdue!</span>}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalBill(null)}>➕ Add Bill</button>
        </div>
      </div>

      {/* Filter & Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, gap: 2 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 14px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: filter === f ? 'rgba(var(--primary-rgb),0.25)' : 'transparent',
              color: filter === f ? 'var(--primary-light)' : 'var(--text-muted)',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s',
              textTransform: 'capitalize'
            }}>
              {f === 'overdue' ? `🔴 ${f} (${overdueCnt})` : f === 'all' ? `All (${bills.length})` : f}
            </button>
          ))}
        </div>
        <input className="input" placeholder="🔍 Search bills..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260, flex: 1 }} />
      </div>

      {/* Bills Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>⏳ Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 60 }}>
          <div className="empty-icon">📭</div>
          <p style={{ fontWeight: 600 }}>No bills found</p>
          <p style={{ fontSize: 14 }}>Add a bill to get started</p>
          <button className="btn btn-primary" onClick={() => setModalBill(null)} style={{ marginTop: 8 }}>➕ Add Bill</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(bill => {
            const cat = getCategoryMeta(bill.category);
            const days = daysUntil(bill.due_date);
            const isOverdue = bill.status === 'overdue';
            const isPaid = bill.status === 'paid';
            return (
              <div key={bill.id} className="glass-card animate-fade" style={{
                padding: 20, borderLeft: `3px solid ${isOverdue ? '#ef4444' : isPaid ? '#10b981' : cat.color}`,
                animation: isOverdue ? 'pulse-glow 3s ease infinite' : undefined
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.name}</div>
                      {bill.client && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bill.client}</div>}
                    </div>
                  </div>
                  <span className={`badge badge-${bill.status}`} style={{ flexShrink: 0 }}>{bill.status}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: isOverdue ? '#f87171' : 'var(--text-primary)' }}>
                    {formatCurrency(bill.amount, currency)}
                  </div>
                  <div style={{ fontSize: 13, color: isOverdue ? '#f87171' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                    {isOverdue ? `${Math.abs(days)}d overdue` : isPaid ? '✓ Paid' : days === 0 ? '⚡ Due today' : `Due in ${days}d`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 99 }}>
                    📅 {formatDate(bill.due_date)}
                  </div>
                  {bill.recurrence !== 'one-time' && (
                    <div style={{ fontSize: 12, color: 'var(--primary-light)', background: 'rgba(var(--primary-rgb),0.1)', padding: '3px 10px', borderRadius: 99 }}>
                      🔄 {bill.recurrence}
                    </div>
                  )}
                </div>

                {!isPaid && (
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: isOverdue ? '100%' : `${Math.max(5, 100 - (days / 30 * 100))}%`, background: isOverdue ? '#ef4444' : days <= 3 ? '#f59e0b' : '#10b981', transition: 'width 1s ease' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  {!isPaid && (
                    <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => setPayBill(bill)}>
                      ✅ Mark Paid
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModalBill(bill)} title="Edit">✏️</button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteBill(bill.id)} title="Delete" style={{ color: '#f87171' }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalBill !== undefined && (
        <BillModal bill={modalBill} onClose={() => setModalBill(undefined)} onSave={saveBill} />
      )}
      {payBill && (
        <PayModal bill={payBill} onClose={() => setPayBill(null)} onPay={payBillFn} currency={currency} />
      )}
    </div>
  );
}
