import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API, apiHeaders } from '../api/config';
import { formatCurrency, getCategoryMeta } from '../utils/helpers';
import Skeleton from '../components/Skeleton';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── helpers ──────────────────────────────────────────────────────────────────
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function toKey(y, m, d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

// ─── Bill dot / chip ──────────────────────────────────────────────────────────
const STATUS_COLOR = { overdue: '#ef4444', upcoming: '#06b6d4', paid: '#10b981' };
const STATUS_BG    = { overdue: 'rgba(239,68,68,0.15)', upcoming: 'rgba(6,182,212,0.15)', paid: 'rgba(16,185,129,0.15)' };

function BillChip({ bill, compact }) {
  const cat = getCategoryMeta(bill.category);
  if (compact) return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
      background: STATUS_COLOR[bill.status] || '#64748b',
      boxShadow: bill.status === 'overdue' ? `0 0 4px ${STATUS_COLOR.overdue}` : 'none',
    }} title={bill.name} />
  );
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 6, marginBottom: 2,
      background: STATUS_BG[bill.status] || 'rgba(100,116,139,0.15)',
      color: STATUS_COLOR[bill.status] || '#64748b',
      border: `1px solid ${STATUS_COLOR[bill.status] || '#64748b'}33`,
      display: 'flex', alignItems: 'center', gap: 4,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%'
    }}>
      <span style={{ flexShrink: 0 }}>{cat.icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{bill.name}</span>
    </div>
  );
}

// ─── Detail panel (right side) ────────────────────────────────────────────────
function DayPanel({ date, bills, currency, onClose, onMarkPaid, onAddBill }) {
  const d = new Date(date + 'T12:00:00');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const total = bills.reduce((s, b) => s + b.amount, 0);
  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className="glass-card" style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.2s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 22 }}>
            {d.getDate()}
            {isToday && <span style={{ marginLeft: 8, fontSize: 12, background: 'rgba(var(--primary-rgb),0.2)', color: 'var(--primary-light)', padding: '2px 8px', borderRadius: 99, fontWeight: 600, verticalAlign: 'middle' }}>Today</span>}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{label}</div>
        </div>
        <button onClick={onClose} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, fontFamily: 'inherit' }}>✕</button>
      </div>

      {bills.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(var(--primary-rgb),0.08)', borderRadius: 10, border: '1px solid rgba(var(--primary-rgb),0.15)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bills.length} bill{bills.length > 1 ? 's' : ''} due</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--primary-light)' }}>
            {formatCurrency(total, currency)}
          </div>
        </div>
      )}

      {/* Bills list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 14 }}>No bills due on this day</div>
            <button className="btn btn-primary btn-sm" onClick={onAddBill} style={{ marginTop: 16 }}>
              + Add Bill for this date
            </button>
          </div>
        ) : (
          bills.map(bill => {
            const cat = getCategoryMeta(bill.category);
            return (
              <div key={bill.id} style={{
                padding: 14, borderRadius: 12,
                background: bill.status === 'overdue' ? 'rgba(239,68,68,0.06)' : 'var(--glass)',
                border: `1px solid ${bill.status === 'overdue' ? 'rgba(239,68,68,0.25)' : 'var(--glass-border)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{bill.name}</div>
                      {bill.client && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bill.client}</div>}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 15, color: STATUS_COLOR[bill.status] || 'var(--text-primary)' }}>
                    {formatCurrency(bill.amount, currency)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: STATUS_BG[bill.status], color: STATUS_COLOR[bill.status], fontWeight: 600 }}>
                    {bill.status}
                  </span>
                  {bill.recurrence !== 'one-time' && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(var(--primary-rgb),0.12)', color: 'var(--primary-light)', fontWeight: 600 }}>
                      🔄 {bill.recurrence}
                    </span>
                  )}
                  {bill.notes && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📝 {bill.notes}</span>}
                </div>
                {bill.status !== 'paid' && (
                  <button className="btn btn-success btn-sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                    onClick={() => onMarkPaid(bill.id)}>
                    ✅ Mark as Paid
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {bills.length > 0 && (
        <button className="btn btn-ghost btn-sm" onClick={onAddBill} style={{ marginTop: 14, justifyContent: 'center', width: '100%' }}>
          + Add Another Bill for this date
        </button>
      )}
    </div>
  );
}

// ─── Mini bill-add modal ───────────────────────────────────────────────────────
function QuickAddModal({ date, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', amount: '', category: 'software', recurrence: 'one-time', notes: '', client: '', due_date: date });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const CATS = ['software','tech','utility','invoice','subscription','tax','insurance','rent','other'];
  const RECS = ['one-time','weekly','monthly','quarterly','yearly'];

  const save = async () => {
    if (!form.name || !form.amount) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`${API}/bills`, { ...form, amount: parseFloat(form.amount) }, { headers: apiHeaders() });
      onAdded(data);
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">📅 Quick Add Bill</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', padding: 4 }}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '8px 12px', background: 'rgba(var(--primary-rgb),0.1)', borderRadius: 8, fontSize: 13, color: 'var(--primary-light)', marginBottom: 4 }}>
            📅 Due: {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="form-group">
            <label className="form-label">Bill Name *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Adobe CC" autoFocus />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input className="input" type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="select" value={form.category} onChange={set('category')}>
                {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Recurrence</label>
              <select className="select" value={form.recurrence} onChange={set('recurrence')}>
                {RECS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Client</label>
              <input className="input" value={form.client} onChange={set('client')} placeholder="Optional" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="input" value={form.notes} onChange={set('notes')} placeholder="Optional notes..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.name || !form.amount}>
            {saving ? '⏳...' : '💾 Add Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Calendar ─────────────────────────────────────────────────────────────
export default function Calendar() {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const today = new Date();
  const [year, setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [bills, setBills] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBills = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/bills`, { headers: apiHeaders() });
      setBills(data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await loadBills();
      if (!isMounted) return;
    };
    init();
    return () => { isMounted = false; };
  }, []);

  // Build a map: "YYYY-MM-DD" → [bills]
  const billMap = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      if (!map[b.due_date]) map[b.due_date] = [];
      map[b.due_date].push(b);
    });
    return map;
  }, [bills]);

  // Stats for this month
  const monthKey = `${year}-${String(month+1).padStart(2,'0')}`;
  const thisMonthBills = bills.filter(b => b.due_date.startsWith(monthKey));
  const overdueCnt  = thisMonthBills.filter(b => b.status === 'overdue').length;
  const upcomingCnt = thisMonthBills.filter(b => b.status === 'upcoming').length;
  const paidCnt     = thisMonthBills.filter(b => b.status === 'paid').length;
  const totalAmt    = thisMonthBills.filter(b => b.status !== 'paid').reduce((s,b) => s + b.amount, 0);

  // Navigation
  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(today.toISOString().split('T')[0]); };

  // Mark paid
  const markPaid = async (billId) => {
    try {
      await axios.post(`${API}/bills/${billId}/pay`, {}, { headers: apiHeaders() });
      await loadBills();
    } catch(e) { console.error(e); }
  };

  // Build calendar grid
  const numDays  = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const todayKey = today.toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null); // empty padding
  for (let d = 1; d <= numDays; d++) cells.push(d);

  // Selected date bills
  const selectedBills = selectedDate ? (billMap[selectedDate] || []) : [];

  return (
    <div className="page" style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">📅 Bill Calendar</h1>
          <p className="page-subtitle">See all your bills plotted on a calendar</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>🎯 Today</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setQuickAddDate(todayKey); setShowQuickAdd(true); }}>
            + Add Bill
          </button>
        </div>
      </div>

      {/* Month stats strip */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'Bills This Month', value: thisMonthBills.length, color: 'var(--primary)' },
          { label: 'Overdue',   value: overdueCnt,  color: '#ef4444' },
          { label: 'Upcoming',  value: upcomingCnt, color: '#06b6d4' },
          { label: 'Paid',      value: paidCnt,     color: '#10b981' },
          { label: 'Total Due', value: formatCurrency(totalAmt, currency), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '12px 18px', display: 'flex', gap: 10, alignItems: 'center', flex: '1 1 140px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar + Detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 320px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* ── Calendar grid ── */}
        <div className="glass-card" style={{ padding: 24, overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 16, fontFamily: 'inherit', transition: 'all 0.2s' }}>‹</button>
            <div>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 22 }}>{MONTHS[month]}</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 400, fontSize: 18, color: 'var(--text-muted)', marginLeft: 8 }}>{year}</span>
            </div>
            <button onClick={nextMonth} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 16, fontFamily: 'inherit', transition: 'all 0.2s' }}>›</button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['overdue','#ef4444'],['upcoming','#06b6d4'],['paid','#10b981']].map(([s,c]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {[...Array(35)].map((_, i) => (
                <div key={i} style={{ minHeight: 80, padding: '6px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
                  <Skeleton width="22px" height="22px" style={{ borderRadius: '50%', marginBottom: 4 }} />
                  {i % 3 === 0 && <Skeleton width="100%" height="18px" style={{ borderRadius: 6, marginBottom: 2 }} />}
                  {i % 5 === 0 && <Skeleton width="100%" height="18px" style={{ borderRadius: 6 }} />}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} />;
                const dateKey = toKey(year, month, day);
                const dayBills = billMap[dateKey] || [];
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;
                const hasBills = dayBills.length > 0;
                const hasOverdue = dayBills.some(b => b.status === 'overdue');

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                    onDoubleClick={() => { setQuickAddDate(dateKey); setShowQuickAdd(true); }}
                    style={{
                      minHeight: 80, padding: '6px 8px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : isToday ? 'rgba(var(--primary-rgb),0.5)' : 'transparent'}`,
                      background: isSelected ? 'rgba(var(--primary-rgb),0.1)' : isToday ? 'rgba(var(--primary-rgb),0.05)' : hasBills ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      boxShadow: hasOverdue ? '0 0 0 1.5px rgba(239,68,68,0.35)' : 'none',
                    }}
                    title={`${MONTHS[month]} ${day}, ${year}${dayBills.length ? ` — ${dayBills.length} bill(s)` : ''} (double-click to add)`}
                  >
                    {/* Day number */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 13, fontWeight: isToday ? 800 : 500,
                        color: isToday ? 'var(--primary-light)' : isWeekend ? '#64748b' : 'var(--text-primary)',
                        background: isToday ? 'rgba(var(--primary-rgb),0.2)' : 'transparent',
                        width: 22, height: 22, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {day}
                      </span>
                      {dayBills.length > 0 && (
                        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {dayBills.slice(0, 3).map(b => <BillChip key={b.id} bill={b} compact />)}
                          {dayBills.length > 3 && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>+{dayBills.length-3}</span>}
                        </div>
                      )}
                    </div>

                    {/* Bill chips (show up to 2 in large view) */}
                    {!selectedDate && dayBills.slice(0, 2).map(b => <BillChip key={b.id} bill={b} compact={false} />)}
                    {!selectedDate && dayBills.length > 2 && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>+{dayBills.length - 2} more</div>
                    )}
                    {selectedDate && dayBills.slice(0, 1).map(b => <BillChip key={b.id} bill={b} compact={false} />)}
                    {selectedDate && dayBills.length > 1 && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>+{dayBills.length - 1}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hint */}
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Click a day to view bills · Double-click to add a bill
          </div>
        </div>

        {/* ── Day detail panel ── */}
        {selectedDate && (
          <DayPanel
            date={selectedDate}
            bills={selectedBills}
            currency={currency}
            onClose={() => setSelectedDate(null)}
            onMarkPaid={async (id) => { await markPaid(id); }}
            onAddBill={() => { setQuickAddDate(selectedDate); setShowQuickAdd(true); }}
          />
        )}
      </div>

      {/* Quick-add modal */}
      {showQuickAdd && (
        <QuickAddModal
          date={quickAddDate}
          currency={currency}
          onClose={() => setShowQuickAdd(false)}
          onAdded={(newBill) => {
            setBills(prev => [...prev, newBill]);
            setSelectedDate(quickAddDate);
            setShowQuickAdd(false);
          }}
        />
      )}
    </div>
  );
}
