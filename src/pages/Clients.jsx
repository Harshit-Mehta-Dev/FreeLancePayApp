import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API, apiHeaders } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Plus, Mail, Building2, Briefcase, FileText, User } from 'lucide-react';
import Skeleton from '../components/Skeleton';

export default function Clients({ setPage, setPageData }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newClient, setNewClient] = useState({ name: '', email: '', company: '', notes: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await axios.get(`${API}/clients`, { headers: apiHeaders() });
      setClients(data);
    } catch (err) {
      addToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/clients`, newClient, { headers: apiHeaders() });
      addToast('Client added successfully!', 'success');
      setShowAdd(false);
      setNewClient({ name: '', email: '', company: '', notes: '' });
      fetchClients();
    } catch (err) {
      addToast('Failed to add client', 'error');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this client? All associated projects and invoices may be affected.')) return;
    try {
      await axios.delete(`${API}/clients/${id}`, { headers: apiHeaders() });
      addToast('Client removed from portfolio', 'success');
      fetchClients();
      if (selectedClient?.id === id) setSelectedClient(null);
    } catch (err) {
      addToast('Failed to delete client', 'error');
    }
  };

  const handleViewProjects = (client, e) => {
    e.stopPropagation();
    setPageData({ clientId: client.id });
    setPage('projects');
  };

  const handleCreateInvoice = (client, e) => {
    e.stopPropagation();
    setPageData({ clientId: client.id });
    setPage('invoices');
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div className="animate-fade">
          <h1 className="page-title">Client Portfolio</h1>
          <p className="page-subtitle">Manage your relationships and strategic partnerships</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} style={{ marginRight: 8 }} /> ADD PARTNER
        </button>
      </div>

      {loading ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card" style={{ padding: 24, height: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <Skeleton width="48px" height="48px" style={{ borderRadius: 12 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="70%" height="20px" style={{ marginBottom: 6 }} />
                  <Skeleton width="40%" height="14px" opacity={0.6} />
                </div>
              </div>
              <Skeleton width="100%" height="40px" style={{ borderRadius: 8, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Skeleton width="100%" height="32px" />
                <Skeleton width="100%" height="32px" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          <AnimatePresence>
            {clients.map((client) => (
              <motion.div 
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card"
                style={{ padding: 24, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setSelectedClient(client)}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'var(--primary)' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb), 0.2)' }}>
                    <User size={24} />
                  </div>
                  <button 
                    onClick={(e) => handleDelete(client.id, e)}
                    style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>{client.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600 }}>{client.company || 'INDEPENDENT'}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    <Mail size={14} style={{ color: 'var(--primary)' }} /> {client.email || 'NO_CONTACT_DATA'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11, fontWeight: 900 }} onClick={(e) => handleViewProjects(client, e)}>PROJECTS</button>
                  <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11, fontWeight: 900 }} onClick={(e) => handleCreateInvoice(client, e)}>INVOICE</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="modal" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 800, width: '90%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb), 0.2)' }}>
                  <User size={22} />
                </div>
                <div>
                  <h2 className="modal-title">{selectedClient.name}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 700 }}>{selectedClient.company?.toUpperCase() || 'PRIVATE INDIVIDUAL'}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedClient(null)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 30px', background: 'rgba(255,255,255,0.02)' }}>
              {['overview', 'projects', 'invoices'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    padding: '18px 24px', background: 'none', border: 'none', 
                    color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5,
                    cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
                  }}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="clientTab" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)' }} />
                  )}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ minHeight: 350 }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 30 }}>
                  <div className="animate-fade">
                    <label className="form-label">Contact Intelligence</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Mail size={16} /></div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>EMAIL ADDRESS</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedClient.email || 'NOT_SPECIFIED'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Building2 size={16} /></div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>ORGANIZATION</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedClient.company || 'INDEPENDENT'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="animate-fade">
                    <label className="form-label">Partner Profile & Notes</label>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', minHeight: 120 }}>
                      {selectedClient.notes || 'No historical intelligence data recorded for this partnership.'}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }} className="animate-fade">
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Briefcase size={32} style={{ opacity: 0.3 }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Project Pipeline</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px', fontSize: 14, lineHeight: 1.5 }}>
                    Access all active and archived projects associated with this strategic partner.
                  </p>
                  <button className="btn btn-primary" onClick={(e) => handleViewProjects(selectedClient, e)}>OPEN WORKSPACE</button>
                </div>
              )}

              {activeTab === 'invoices' && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }} className="animate-fade">
                   <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
                    <FileText size={32} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Financial Intelligence</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px', fontSize: 14, lineHeight: 1.5 }}>
                    Review fiscal history, outstanding balances, and generate new financial documentation.
                  </p>
                  <button className="btn btn-primary" onClick={(e) => handleCreateInvoice(selectedClient, e)}>GENERATE INVOICE</button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedClient(null)}>CLOSE PROFILE</button>
              <button className="btn btn-primary" onClick={(e) => handleCreateInvoice(selectedClient, e)}>GENERATE INVOICE</button>
            </div>
          </motion.div>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="modal" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 550 }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Onboard New Partner</h2>
              <button className="modal-close-btn" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Partner Identity</label>
                  <input className="input" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="e.g. John Wick" />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Contact Vector (Email)</label>
                    <input className="input" type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} placeholder="partner@enterprise.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organization</label>
                    <input className="input" value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})} placeholder="e.g. Continental Corp" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Engagement Intelligence</label>
                  <textarea className="textarea" rows="4" value={newClient.notes} onChange={e => setNewClient({...newClient, notes: e.target.value})} placeholder="Strategic preferences, terms, and context..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>ABORT</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: 180 }}>REGISTER PARTNER</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
