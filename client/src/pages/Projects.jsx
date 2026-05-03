import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API, apiHeaders } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Plus, Rocket, Clock, ClipboardList, ReceiptText } from 'lucide-react';
import Skeleton from '../components/Skeleton';

export default function Projects({ clientId = null }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newProject, setNewProject] = useState({ 
    client_id: clientId || '', 
    name: '', 
    budget: '', 
    deadline: '', 
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const [projRes, clientRes] = await Promise.all([
        axios.get(`${API}/projects`, { headers: apiHeaders() }),
        axios.get(`${API}/clients`, { headers: apiHeaders() })
      ]);
      setProjects(projRes.data);
      setClients(clientRes.data);
    } catch (err) {
      addToast('Failed to load project data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/projects`, newProject, { headers: apiHeaders() });
      addToast('Project initialized!', 'success');
      setShowAdd(false);
      setNewProject({ client_id: '', name: '', budget: '', deadline: '', description: '', status: 'active' });
      fetchData();
    } catch (err) {
      addToast('Failed to create project', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to archive and delete this project?')) return;
    try {
      await axios.delete(`${API}/projects/${id}`, { headers: apiHeaders() });
      addToast('Project deleted', 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to delete project', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'on-hold': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 className="page-title">Project Workspace</h1>
          <p className="page-subtitle">Track deliverables, deadlines, and project health</p>
          {clientId && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: 20, border: '1px solid rgba(var(--primary-rgb), 0.2)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Filtered View</span>
              <button 
                onClick={() => window.location.reload()} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} style={{ marginRight: 8 }} /> Launch Project
        </button>
      </div>

      {loading ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card" style={{ padding: 24, height: 220 }}>
              <Skeleton width="60%" height="24px" style={{ marginBottom: 12 }} />
              <Skeleton width="40%" height="14px" style={{ marginBottom: 24 }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <Skeleton width="100%" height="40px" />
                <Skeleton width="100%" height="40px" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          <AnimatePresence>
            {projects.filter(p => !clientId || p.client_id == clientId).map((project) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card"
                style={{ padding: 24, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setSelectedProject(project)}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: getStatusColor(project.status) }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ 
                    padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, 
                    textTransform: 'uppercase', letterSpacing: 1,
                    background: `${getStatusColor(project.status)}22`,
                    color: getStatusColor(project.status)
                  }}>
                    {project.status}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px 0' }}>{project.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>{project.client_name}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Budget</div>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>₹{project.budget?.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Days Left</div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)))}d</div>
                  </div>
                </div>

                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: project.status === 'completed' ? '100%' : '35%' }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${getStatusColor(project.status)}, #60a5fa)` }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
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
                  <Rocket size={22} />
                </div>
                <div>
                  <h2 className="modal-title">{selectedProject.name}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 700 }}>PARTNER: {selectedProject.client_name?.toUpperCase()}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedProject(null)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 30px', background: 'rgba(255,255,255,0.02)' }}>
              {['overview', 'tasks', 'finance'].map(tab => (
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
                    <motion.div layoutId="projTab" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)' }} />
                  )}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ minHeight: 350 }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 30 }}>
                  <div className="animate-fade">
                    <label className="form-label">Strategic Overview</label>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                      {selectedProject.description || 'No detailed scope of work defined for this operation.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade">
                    <div style={{ padding: 18, borderRadius: 16, background: 'rgba(var(--primary-rgb), 0.08)', border: '1px solid rgba(var(--primary-rgb), 0.2)' }}>
                      <label className="form-label" style={{ color: 'var(--primary)' }}>Timeline Matrix</label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{new Date(selectedProject.deadline).toLocaleDateString()}</span>
                        <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                          {Math.max(0, Math.ceil((new Date(selectedProject.deadline) - new Date()) / (1000 * 60 * 60 * 24)))}D REMAINING
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label className="form-label">Active Status</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(selectedProject.status), boxShadow: `0 0 10px ${getStatusColor(selectedProject.status)}` }}></div>
                        <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{selectedProject.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }} className="animate-fade">
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <ClipboardList size={32} style={{ opacity: 0.3 }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Quantum Task Core</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', fontSize: 14, lineHeight: 1.5 }}>
                    The task tracking module is currently in synchronization. Soon you'll be able to manage granular milestones and real-time deliverables within this interface.
                  </p>
                </div>
              )}

              {activeTab === 'finance' && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }} className="animate-fade">
                   <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
                    <ReceiptText size={32} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-1px' }}>
                    ₹{selectedProject.budget?.toLocaleString()}
                  </div>
                  <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 32 }}>CONTRACTED CAPITAL</p>
                  <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
                    <button className="btn btn-primary" style={{ padding: '12px 30px' }}>GENERATE INVOICE</button>
                    <button className="btn btn-ghost" style={{ padding: '12px 30px' }}>LOG EXPENSE</button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedProject(null)}>DISMISS VIEW</button>
              {selectedProject.status !== 'completed' && (
                <button className="btn btn-primary" style={{ background: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>COMPLETE MISSION</button>
              )}
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
            style={{ maxWidth: 600 }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Initialize New Project</h2>
              <button className="modal-close-btn" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Mission Designation</label>
                  <input className="input" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Next-Gen Web Platform" />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Strategic Partner</label>
                    <select className="select" required value={newProject.client_id} onChange={e => setNewProject({...newProject, client_id: e.target.value})}>
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capital Allocation (₹)</label>
                    <input className="input" type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Deadline Matrix</label>
                    <input className="input" type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Status</label>
                    <select 
                      className="select" 
                      value={newProject.status} 
                      onChange={e => setNewProject({...newProject, status: e.target.value})}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Strategic Notes</label>
                  <textarea className="textarea" rows="4" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} placeholder="Outline the core objectives and deliverables..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>ABORT</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: 180 }}>LAUNCH PROJECT</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
