import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API, apiHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, daysUntil, getCategoryMeta, CATEGORIES, RECURRENCES } from '../utils/helpers';
import { notificationEngine } from '../utils/NotificationManager';
import Skeleton from '../components/Skeleton';

const STATUS_FILTERS = ['all', 'upcoming', 'overdue', 'paid'];

const BillModal = ({ bill, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: bill?.name || '', category: bill?.category || 'software',
    amount: bill?.amount || '', due_date: bill?.due_date || new Date().toISOString().split('T')[0],
    recurrence: bill?.recurrence || 'one-time', notes: bill?.notes || '', client: bill?.client || '',
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.due_date) return;
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ ...form, amount: parseFloat(form.amount) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="modal"
      >
        <div className="modal-header">
          <h2 className="modal-title">{bill ? 'Edit Financial Entry' : 'New Strategic Bill'}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Mission / Bill Name</label>
            <input className="input" placeholder="e.g. Cloud Infrastructure" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Classification</label>
              <select className="select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Allocated Capital (₹)</label>
              <input className="input" type="number" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Target Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={set('due_date')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Recurrence Cycle</label>
              <select className="select" value={form.recurrence} onChange={set('recurrence')}>
                {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Strategic Partner / Vendor</label>
            <input className="input" placeholder="Entity name..." value={form.client} onChange={set('client')} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Operational Notes</label>
            <textarea className="textarea" rows="3" placeholder="Engagement details..." value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ABORT</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.amount} style={{ minWidth: 160 }}>
            {saving ? 'SYNCING...' : bill ? 'UPDATE ENTRY' : 'COMMENCE BILL'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PayModal = ({ bill, onClose, onPay, currency }) => {
  const [amount, setAmount] = useState(bill.amount);
  const [note, setNote] = useState('');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      await onPay(bill.id, amount, note);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="modal"
        style={{ maxWidth: 500 }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Authorize Payment</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '20px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: 16, border: '1px solid rgba(var(--primary-rgb), 0.1)', marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Active Bill</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>{bill.name}</div>
            {bill.recurrence !== 'one-time' && (
              <div style={{ fontSize: 12, color: '#10b981', marginTop: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>🔄</span> RECURRING: Next period will be auto-indexed.
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Capital Transferred (₹)</label>
            <input className="input" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Audit Note (Optional)</label>
            <input className="input" placeholder="e.g. Settled via Global Wire" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>CANCEL</button>
          <button className="btn btn-primary" onClick={handlePay} disabled={paying} style={{ flex: 1, background: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
            {paying ? 'PROCESSING...' : `CONFIRM ₹${amount?.toLocaleString()}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function Bills({ initialFilter = 'all' }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [search, setSearch] = useState('');
  const [modalBill, setModalBill] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [payBill, setPayBill] = useState(null);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Cache-buster ensures Cloudflare Edge doesn't return stale results after a POST/PATCH
      const { data } = await axios.get(`${API}/bills?_t=${Date.now()}`, { headers: apiHeaders() });
      setBills(data);
    } catch (err) {
      addToast('Failed to load bills', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Sync internal filter with props (from Dashboard/App)
  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      // Fetch latest data
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/bills?_t=${Date.now()}`, { headers: apiHeaders() });
        if (!isMounted) return;
        setBills(data);
        
        // Handle direct-pay links
        const params = new URLSearchParams(window.location.search);
        const payId = params.get('pay');
        if (payId) {
          const b = data.find(item => String(item.id) === payId);
          if (b && b.status !== 'paid') {
            setPayBill(b);
          }
        }
      } catch (err) {
        if (isMounted) addToast('Failed to initialize bills', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [addToast]); // Only run on mount

  const saveBill = async (form) => {
    try {
      if (modalBill) {
        await axios.patch(`${API}/bills/${modalBill.id}`, form, { headers: apiHeaders() });
        addToast('Bill updated! ✏️', 'success');
      } else {
        await axios.post(`${API}/bills`, form, { headers: apiHeaders() });
        addToast('Bill added! ➕', 'success');
        notificationEngine.notify('✨ New Bill Created', { body: `"${form.name}" has been added to your schedule.`, type: 'upcomingReminder' });
        
        const days = daysUntil(form.due_date);
        const autoFilter = days < 0 ? 'overdue' : 'upcoming';
        if (filter !== 'all' && filter !== autoFilter) {
          setFilter('all');
        }
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
      const today = new Date().toISOString().split('T')[0];
      await axios.post(`${API}/bills/${id}/pay`, { 
        amount, 
        paid_date: today,
        note 
      }, { headers: apiHeaders() });
      
      const bill = bills.find(b => b.id === id);
      const isRecurring = bill?.recurrence && bill.recurrence !== 'one-time';
      
      addToast(isRecurring ? 'Payment recorded! Next bill auto-generated. 🔄' : 'Marked as paid! 🎉', 'success');
      notificationEngine.alertSuccess('Payment Confirmed', `Successfully paid ${formatCurrency(amount, currency)} for "${bill?.name || 'Bill'}"`);
      
      // Mandatory hard reload of data
      await load();
    } catch (err) { 
      let msg = err.response?.data?.error || err.response?.data?.details || err.message || 'Unknown Error';
      
      if (err.message === 'Network Error') {
        msg = 'Connectivity issue! The API server at ' + API + ' might be unreachable.';
      }

      addToast(`Error: ${msg}`, 'error'); 
      console.error('PAYMENT_FAILURE_REPORT:', {
        status: err.response?.status,
        url: API + '/bills/' + id + '/pay',
        message: err.message,
        data: err.response?.data
      });
      throw err;
    }
  };

  const processedBills = bills.map(b => {
    const days = daysUntil(b.due_date);
    const isActuallyOverdue = b.status === 'upcoming' && days < 0;
    return { ...b, status: isActuallyOverdue ? 'overdue' : b.status };
  });

  const filtered = processedBills.filter(b => {
    const s = search.trim().toLowerCase();
    if (filter !== 'all' && b.status !== filter) return false;
    if (s && !b.name.toLowerCase().includes(s) && !b.client?.toLowerCase().includes(s)) return false;
    return true;
  });

  const overdueCnt = processedBills.filter(b => b.status === 'overdue').length;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">💳 Bills Manager</h1>
            <p className="page-subtitle">{bills.length} total bills — {overdueCnt > 0 && <span style={{ color: '#f87171', fontWeight: 800 }}>{overdueCnt} OVERDUE!</span>}</p>
          </div>
          {bills.length > 0 && (
            <button className="btn btn-primary" onClick={() => setModalBill(null)}>➕ Add Bill</button>
          )}
        </div>
      </div>

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

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: 24, height: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <Skeleton width="44px" height="44px" style={{ borderRadius: 12 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="70%" height="20px" style={{ marginBottom: 6 }} />
                    <Skeleton width="40%" height="14px" />
                  </div>
                </div>
                <Skeleton width="60px" height="20px" shape="pill" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Skeleton width="120px" height="32px" style={{ marginBottom: 8 }} />
                <Skeleton width="140px" height="14px" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Skeleton width="80px" height="22px" style={{ borderRadius: 6 }} />
                <Skeleton width="80px" height="22px" style={{ borderRadius: 6 }} />
              </div>
              <Skeleton width="100%" height="4px" style={{ borderRadius: 99, marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Skeleton width="100%" height="38px" />
                <div style={{ display: 'flex', gap: 6 }}>
                   <Skeleton width="38px" height="38px" />
                   <Skeleton width="38px" height="38px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 80, border: '2px dashed rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.6 }}>🧾</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>No bills scheduled yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>Keep track of your recurring and one-time expenses in one place.</p>
          <button className="btn btn-primary" onClick={() => setModalBill(null)} style={{ padding: '12px 32px' }}>➕ Create Your First Bill</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No results found</h3>
          <p style={{ color: 'var(--text-muted)' }}>We couldn't find any bills matching your search or filter.</p>
          <button className="btn btn-ghost" onClick={() => { setFilter('all'); setSearch(''); }} style={{ marginTop: 16 }}>Clear all filters</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((bill, index) => {
            const cat = getCategoryMeta(bill.category);
            const days = daysUntil(bill.due_date);
            const isActuallyOverdue = bill.status === 'upcoming' && days < 0;
            const currentStatus = isActuallyOverdue ? 'overdue' : bill.status;
            const isOverdue = currentStatus === 'overdue';
            const isPaid = currentStatus === 'paid';
            
            return (
              <div key={bill.id} className="glass-card" style={{
                padding: 24, 
                borderLeft: `4px solid ${isOverdue ? '#ef4444' : isPaid ? '#10b981' : cat.color}`,
                animation: `slideInUp 0.5s ease forwards ${index * 0.05}s, ${isOverdue ? 'pulse-glow-red 2s infinite' : ''}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isOverdue && <div className="overdue-tag">OVERDUE</div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 12, 
                      background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}44)`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 22, flexShrink: 0,
                      border: `1px solid ${cat.color}33`
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{bill.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {cat.label} {bill.client && ` • ${bill.client}`}
                      </div>
                    </div>
                  </div>
                  <span className={`badge badge-${currentStatus}`} style={{ flexShrink: 0, padding: '4px 10px', fontSize: 10 }}>{currentStatus.toUpperCase()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif', color: isOverdue ? '#f87171' : '#fff' }}>
                      {formatCurrency(bill.amount, currency)}
                    </div>
                    <div style={{ fontSize: 12, color: isOverdue ? '#fca5a5' : 'var(--text-muted)', marginTop: 2 }}>
                      {isOverdue ? `Action required: ${Math.abs(days)}d past due` : isPaid ? 'Payment finalized' : days === 0 ? '⚡ Due today' : `Payment due in ${days}d`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
                    📅 {formatDate(bill.due_date)}
                  </div>
                  {bill.recurrence !== 'one-time' && (
                    <div style={{ fontSize: 11, color: 'var(--primary-light)', background: 'rgba(var(--primary-rgb),0.1)', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(var(--primary-rgb),0.2)' }}>
                      🔄 {bill.recurrence.toUpperCase()}
                    </div>
                  )}
                </div>

                {!isPaid && (
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', borderRadius: 99, 
                      width: isOverdue ? '100%' : `${Math.max(5, 100 - (days / 30 * 100))}%`, 
                      background: isOverdue ? '#ef4444' : days <= 3 ? '#f59e0b' : 'var(--primary)', 
                      transition: 'width 1s ease',
                      boxShadow: isOverdue ? '0 0 10px #ef4444' : 'none'
                    }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  {!isPaid && (
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, background: isOverdue ? '#ef4444' : undefined, borderColor: isOverdue ? 'transparent' : undefined }} 
                      onClick={() => setPayBill(bill)}
                    >
                      💳 {isOverdue ? 'Pay Overdue' : 'Pay Now'}
                    </button>
                  )}
                  {isPaid && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: '#10b981', fontSize: 13, fontWeight: 700, gap: 6 }}>
                      <span style={{ fontSize: 18 }}>✅</span> PAID IN FULL
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModalBill(bill)} title="Edit" style={{ background: 'rgba(255,255,255,0.03)' }}>✏️</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteBill(bill.id)} title="Delete" style={{ color: '#f87171', background: 'rgba(239,68,68,0.05)' }}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalBill !== undefined && (
        <BillModal 
          bill={modalBill} 
          onClose={() => setModalBill(undefined)} 
          onSave={saveBill} 
        />
      )}
      {payBill && (
        <PayModal 
          bill={payBill} 
          onClose={() => setPayBill(null)} 
          onPay={payBillFn} 
          currency={currency} 
        />
      )}
    </div>
  );
}
