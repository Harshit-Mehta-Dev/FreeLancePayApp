import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API, apiHeaders } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Play, Square, Timer, History, Briefcase } from 'lucide-react';

export default function TimeTracker() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [note, setNote] = useState('');
  
  const timerRef = useRef(null);

  useEffect(() => {
    fetchData();
    return () => clearInterval(timerRef.current);
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, projectsRes] = await Promise.all([
        axios.get(`${API}/time-entries`, { headers: apiHeaders() }),
        axios.get(`${API}/projects`, { headers: apiHeaders() })
      ]);
      const allEntries = entriesRes.data;
      setEntries(allEntries);
      setProjects(projectsRes.data);
      
      const running = allEntries.find(e => e.is_running);
      if (running) {
        setActiveEntry(running);
        const start = new Date(running.start_time).getTime();
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
        startTimer();
      } else {
        setActiveEntry(null);
        clearInterval(timerRef.current);
      }
    } catch (err) {
      addToast('Failed to load time data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const handleStart = async () => {
    if (!selectedProject) return addToast('Please select a project', 'warning');
    try {
      const { data } = await axios.post(`${API}/time-entries/start`, { project_id: selectedProject, note }, { headers: apiHeaders() });
      setActiveEntry({ ...data, project_id: selectedProject, note, is_running: 1 });
      setElapsedTime(0);
      startTimer();
      fetchData();
      addToast('Timer started!', 'success');
    } catch (err) {
      addToast('Failed to start timer', 'error');
    }
  };

  const handleStop = async () => {
    if (!activeEntry) return;
    try {
      await axios.post(`${API}/time-entries/${activeEntry.id}/stop`, {}, { headers: apiHeaders() });
      clearInterval(timerRef.current);
      setActiveEntry(null);
      setElapsedTime(0);
      setNote('');
      fetchData();
      addToast('Time entry saved!', 'success');
    } catch (err) {
      addToast('Failed to stop timer', 'error');
    }
  };

  const handleDeleteTime = async (id) => {
    if (!window.confirm('Delete this time entry?')) return;
    try {
      await axios.delete(`${API}/time-entries/${id}`, { headers: apiHeaders() });
      addToast('Entry removed', 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to delete entry', 'error');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 30 }}>
        <h1 className="page-title">Time Tracker</h1>
        <p className="page-subtitle">Precision billing for every focused minute</p>
      </div>

      {/* --- ACTIVE TIMER SECTION --- */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ 
          marginBottom: 40, padding: '40px 20px', textAlign: 'center', 
          background: activeEntry ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--glass)',
          border: activeEntry ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
          boxShadow: activeEntry ? '0 0 40px rgba(var(--primary-rgb), 0.1)' : 'var(--shadow-card)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        {activeEntry && (
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'var(--primary)' }}
          />
        )}

        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 'clamp(48px, 10vw, 84px)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: activeEntry ? 'var(--primary)' : 'rgba(255,255,255,0.1)', marginBottom: 20, letterSpacing: 4, textShadow: activeEntry ? '0 0 30px rgba(var(--primary-rgb), 0.3)' : 'none' }}>
            {formatTime(elapsedTime)}
          </div>

          {!activeEntry ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
                <Briefcase size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <select 
                  className="select" 
                  style={{ width: '100%', paddingLeft: 40 }} 
                  value={selectedProject} 
                  onChange={e => setSelectedProject(e.target.value)}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <input 
                className="input" 
                style={{ flex: '1 1 300px', maxWidth: 400 }} 
                placeholder="What are you focusing on?" 
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleStart} style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Play size={18} fill="currentColor" /> Start Timer
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                Currently working on: <span style={{ color: 'var(--primary)' }}>{projects.find(p => p.id == activeEntry.project_id)?.name}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>"{activeEntry.note || 'No description'}"</p>
              <button className="btn" onClick={handleStop} style={{ background: '#ef4444', color: '#fff', padding: '14px 48px', borderRadius: 12, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)' }}>
                <Square size={20} fill="currentColor" /> Stop & Record
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* --- RECENT LOGS SECTION --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <History size={20} color="var(--primary)" />
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Recent Activity Log</h2>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Project</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Activity Details</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Start Timestamp</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Duration</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Est. Value</th>
              <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {entries.filter(e => !e.is_running).map((entry) => (
                <motion.tr 
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary-light)' }}>{entry.project_name || 'General'}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: 14 }}>{entry.note || '-'}</td>
                  <td style={{ padding: '16px 24px', fontSize: 13, opacity: 0.8 }}>{new Date(entry.start_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td style={{ padding: '16px 24px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{formatTime(entry.duration_seconds)}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--accent-green)', fontWeight: 700 }}>
                    ₹{((entry.duration_seconds / 3600) * 1500).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDeleteTime(entry.id)}
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
        {entries.filter(e => !e.is_running).length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Timer size={40} style={{ opacity: 0.1 }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>No time entries recorded yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}
