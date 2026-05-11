import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar } from 'recharts';
import { API, apiHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import Skeleton from '../components/Skeleton';
export default function Cashflow() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    const { data: d } = await axios.get(`${API}/dashboard`, { headers: apiHeaders() });
    setData(d);
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

  if (loading) return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 28 }}>
        <Skeleton width="280px" height="36px" style={{ marginBottom: 8 }} />
        <Skeleton width="220px" height="20px" />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card" style={{ flex: 1, minWidth: 200, padding: 22 }}>
            <Skeleton width="32px" height="32px" style={{ marginBottom: 8 }} />
            <Skeleton width="140px" height="14px" style={{ marginBottom: 8 }} />
            <Skeleton width="100px" height="28px" />
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <Skeleton width="200px" height="20px" style={{ marginBottom: 24 }} />
        <Skeleton width="100%" height="280px" />
      </div>

      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <Skeleton width="200px" height="20px" style={{ marginBottom: 24 }} />
        <Skeleton width="100%" height="220px" />
      </div>
    </div>
  );

  const { cashflow } = data;
  const currentIdx = 2; // Index 2 is current month (we start -2 months back)

  const totalIncome = cashflow.slice(currentIdx).reduce((s, c) => s + c.income, 0);
  const totalExpenses = cashflow.slice(currentIdx).reduce((s, c) => s + c.expenses, 0);
  const netForecast = totalIncome - totalExpenses;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Cashflow Projection</h1>
        <p className="page-subtitle">6-month income vs. expenses forecast</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        {[
          { label: 'Projected Income (6mo)', value: totalIncome, icon: '📥', grad: 'linear-gradient(135deg, #10b981, #059669)' },
          { label: 'Projected Expenses (6mo)', value: totalExpenses, icon: '📤', grad: 'linear-gradient(135deg, #ef4444, #dc2626)' },
          { label: 'Net Forecast (6mo)', value: netForecast, icon: netForecast >= 0 ? '🟢' : '🔴', grad: netForecast >= 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ flex: 1, minWidth: 200, padding: 22 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', background: s.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {formatCurrency(s.value, currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Income vs. Expenses Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={cashflow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="cInc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10 }} formatter={v => formatCurrency(v, currency)} />
            <ReferenceLine x={cashflow[currentIdx]?.month} stroke="rgba(var(--primary-rgb),0.5)" strokeDasharray="4 4" label={{ value: 'NOW', fill: 'var(--primary-light)', fontSize: 11 }} />
            <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#cInc)" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#cExp)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Net Cashflow bar chart */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Net Cashflow by Month</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={cashflow} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10 }} formatter={v => formatCurrency(v, currency)} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Bar dataKey="net" name="Net" radius={[6,6,0,0]}
              fill="var(--primary)"
              label={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Monthly Breakdown</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th><th>Status</th></tr>
            </thead>
            <tbody>
              {cashflow.map((row, i) => {
                const net = row.income - row.expenses;
                const isCurrent = i === currentIdx;
                return (
                  <tr key={row.month} style={isCurrent ? { background: 'rgba(var(--primary-rgb),0.06)' } : {}}>
                    <td style={{ fontWeight: isCurrent ? 700 : 400, color: isCurrent ? 'var(--primary-light)' : undefined }}>
                      {row.month} {isCurrent && <span style={{ fontSize: 11, background: 'rgba(var(--primary-rgb),0.2)', padding: '2px 6px', borderRadius: 99, marginLeft: 6, color: 'var(--primary-light)' }}>Current</span>}
                    </td>
                    <td style={{ color: '#6ee7b7', fontWeight: 600 }}>{formatCurrency(row.income, currency)}</td>
                    <td style={{ color: '#f87171', fontWeight: 600 }}>{formatCurrency(row.expenses, currency)}</td>
                    <td style={{ fontWeight: 700, color: net >= 0 ? '#6ee7b7' : '#f87171', fontFamily: 'Space Grotesk, sans-serif' }}>
                      {net >= 0 ? '+' : ''}{formatCurrency(net, currency)}
                    </td>
                    <td>
                      <span className={`badge ${net >= 0 ? 'badge-paid' : 'badge-overdue'}`}>
                        {net >= 0 ? '🟢 Positive' : '🔴 Deficit'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
