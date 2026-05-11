import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API, apiHeaders } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Plus, Wallet, PieChart, ArrowUpRight, CreditCard } from 'lucide-react';

export default function Expenses() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const categories = ['Software/SaaS', 'Hardware', 'Marketing', 'Education', 'Office/Rent', 'Taxes', 'Other'];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await axios.get(`${API}/expenses`, { headers: apiHeaders() });
      setExpenses(data);
    } catch (err) {
      addToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, newExpense, { headers: apiHeaders() });
      addToast('Expense recorded', 'success');
      setShowAdd(false);
      setNewExpense({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (err) {
      addToast('Failed to log expense', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Remove this expense entry?')) return;
    try {
      await axios.delete(`${API}/expenses/${id}`, { headers: apiHeaders() });
      addToast('Entry deleted', 'success');
      fetchExpenses();
    } catch (err) {
      addToast('Failed to delete entry', 'error');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 className="page-title">Business Expenses</h1>
          <p className="page-subtitle">Track your spending to calculate true net profit</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} style={{ marginRight: 8 }} /> Log Expense
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div className="glass-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 50, height: 50, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={24} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Total Outflow</label>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>₹{totalExpenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', width: 50, height: 50, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart size={24} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Primary Category</label>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{expenses.length > 0 ? expenses[0].category : 'None'}</div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Category</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Description</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Date</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {expenses.map((exp) => (
                <motion.tr 
                  key={exp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ borderBottom: '1px solid var(--glass-border)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 14 }}>{exp.description}</td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(exp.date).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#ef4444', fontSize: 15 }}>
                    ₹{exp.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="btn-icon-danger"
                      style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.4)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CreditCard size={40} style={{ opacity: 0.1 }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>No expenses logged yet.</div>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="modal" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 450 }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Record Expense</h2>
              <button className="modal-close-btn" onClick={() => setShowAdd(false)} title="Close">✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 30 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="select" required value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transaction Amount (₹)</label>
                  <input className="input" type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Purchase</label>
                  <input className="input" type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Memo / Description</label>
                  <input className="input" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="e.g. Adobe Creative Cloud" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Discard</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 30px', fontWeight: 800 }}>
                  <ArrowUpRight size={18} style={{ marginRight: 8 }} /> Record Outflow
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
