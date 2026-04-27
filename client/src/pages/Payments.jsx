import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API, apiHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getCategoryMeta } from '../utils/helpers';

export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    const { data } = await axios.get(`${API}/payments`, { headers: apiHeaders() });
    setPayments(data);
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

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const thisMonth = payments.filter(p => p.paid_date?.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🧾 Payment History</h1>
        <p className="page-subtitle">All your recorded payments</p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { label: 'Total Paid', value: total, icon: '✅' },
          { label: 'Paid This Month', value: thisMonth, icon: '📅' },
          { label: 'Total Entries', value: payments.length, icon: '📋', isCount: true },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ flex: 1, minWidth: 160, padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {s.isCount ? s.value : formatCurrency(s.value, currency)}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>All Payments</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ Loading...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🧾</div><p>No payments yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Bill</th><th>Category</th><th>Paid On</th><th>Note</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const cat = getCategoryMeta(p.category);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{cat.icon}</span>
                          <span style={{ fontWeight: 600 }}>{p.bill_name}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 12, background: `${cat.color}22`, color: cat.color, padding: '2px 8px', borderRadius: 99 }}>{cat.label}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(p.paid_date)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.note || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#6ee7b7', fontFamily: 'Space Grotesk, sans-serif' }}>{formatCurrency(p.amount, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
