import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API, apiHeaders } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Plus, FileText, Download, Send, Receipt } from 'lucide-react';

export default function Invoices({ clientId = null, projectId = null }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  const [newInvoice, setNewInvoice] = useState({
    client_id: clientId || '',
    project_id: projectId || '',
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    due_date: '',
    items: [{ description: '', quantity: 1, rate: 0 }]
  });

  useEffect(() => {
    fetchData();
    if (clientId || projectId) {
      setShowCreate(true);
    }
  }, [clientId, projectId]);

  const fetchData = async () => {
    try {
      const [invRes, clientRes, projRes] = await Promise.all([
        axios.get(`${API}/invoices`, { headers: apiHeaders() }),
        axios.get(`${API}/clients`, { headers: apiHeaders() }),
        axios.get(`${API}/projects`, { headers: apiHeaders() })
      ]);
      setInvoices(invRes.data);
      setClients(clientRes.data);
      setProjects(projRes.data);
    } catch (err) {
      addToast('Failed to load invoice ecosystem', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setNewInvoice({...newInvoice, items: [...newInvoice.items, { description: '', quantity: 1, rate: 0 }]});
  };

  const calculateTotal = (items) => items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    const amount = calculateTotal(newInvoice.items);
    try {
      await axios.post(`${API}/invoices`, { ...newInvoice, amount }, { headers: apiHeaders() });
      addToast('Invoice issued!', 'success');
      setShowCreate(false);
      setNewInvoice({
        client_id: '',
        project_id: '',
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        due_date: '',
        items: [{ description: '', quantity: 1, rate: 0 }]
      });
      fetchData();
    } catch (err) {
      addToast('Failed to create invoice', 'error');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Permanently delete this invoice record?')) return;
    try {
      await axios.delete(`${API}/invoices/${id}`, { headers: apiHeaders() });
      addToast('Invoice record removed', 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to delete invoice', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 className="page-title">Invoice Manager</h1>
          <p className="page-subtitle">Professional billing and receivables tracking</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} style={{ marginRight: 8 }} /> Create Invoice
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Number</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Client / Project</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Due Date</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {invoices.map((inv) => (
                <motion.tr 
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ borderBottom: '1px solid var(--glass-border)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600 }}>{inv.client_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inv.project_name || 'Direct Billing'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 14 }}>{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                        fontSize: 10, fontWeight: 900, textTransform: 'uppercase', 
                        padding: '4px 10px', borderRadius: 20,
                        background: inv.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: inv.status === 'paid' ? '#10b981' : '#f59e0b',
                        border: `1px solid ${inv.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                      }}>
                        {inv.status}
                      </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, fontSize: 16 }}>
                    ₹{inv.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleDeleteInvoice(inv.id)}
                        title="Delete Invoice"
                        style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.4)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Receipt size={40} style={{ opacity: 0.1 }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>No invoices issued yet. Click "Create Invoice" to start billing.</div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="modal" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 800, width: '90%' }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Issue New Invoice</h2>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)} title="Close">✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: 30 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
                   <div className="form-group">
                    <label className="form-label">Client Entity</label>
                    <select className="select" required value={newInvoice.client_id} onChange={e => setNewInvoice({...newInvoice, client_id: e.target.value})}>
                      <option value="">Select a Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Associated Project</label>
                    <select className="select" value={newInvoice.project_id} onChange={e => setNewInvoice({...newInvoice, project_id: e.target.value})}>
                      <option value="">No Project Link</option>
                      {projects.filter(p => p.client_id == newInvoice.client_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial ID</label>
                    <input className="input" value={newInvoice.invoice_number} readOnly style={{ fontFamily: 'JetBrains Mono', background: 'rgba(255,255,255,0.02)' }} />
                  </div>
                   <div className="form-group">
                    <label className="form-label">Payment Deadline</label>
                    <input className="input" type="date" required value={newInvoice.due_date} onChange={e => setNewInvoice({...newInvoice, due_date: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Line Items</h3>
                  <button type="button" className="btn btn-ghost" onClick={addItem} style={{ fontSize: 12 }}>
                    <Plus size={14} style={{ marginRight: 4 }} /> Add Line
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
                  {newInvoice.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px 40px', gap: 12, alignItems: 'flex-end' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>Description</label>
                        <input className="input" value={item.description} onChange={e => {
                          const newItems = [...newInvoice.items];
                          newItems[idx].description = e.target.value;
                          setNewInvoice({...newInvoice, items: newItems});
                        }} placeholder="e.g. UX Design Phase 1" />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>Qty</label>
                        <input className="input" type="number" value={item.quantity} onChange={e => {
                          const newItems = [...newInvoice.items];
                          newItems[idx].quantity = parseFloat(e.target.value);
                          setNewInvoice({...newInvoice, items: newItems});
                        }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>Rate (₹)</label>
                        <input className="input" type="number" value={item.rate} onChange={e => {
                          const newItems = [...newInvoice.items];
                          newItems[idx].rate = parseFloat(e.target.value);
                          setNewInvoice({...newInvoice, items: newItems});
                        }} />
                      </div>
                      <div style={{ textAlign: 'right', paddingBottom: 10, fontWeight: 700, fontSize: 14 }}>
                        ₹{(item.quantity * item.rate).toLocaleString()}
                      </div>
                      <div style={{ paddingBottom: 6 }}>
                        {newInvoice.items.length > 1 && (
                          <button type="button" onClick={() => {
                            const newItems = newInvoice.items.filter((_, i) => i !== idx);
                            setNewInvoice({...newInvoice, items: newItems});
                          }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5 }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 24, textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1 }}>GRAND TOTAL</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--primary)', textShadow: '0 0 20px rgba(var(--primary-rgb), 0.2)' }}>
                    ₹{calculateTotal(newInvoice.items).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Discard</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 40px', fontWeight: 800 }}>
                  <Send size={18} style={{ marginRight: 8 }} /> Issue & Authenticate
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
