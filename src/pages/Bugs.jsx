import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API, apiHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

export default function Bugs() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [bugs, setBugs] = useState([]);
  const [loadingBugs, setLoadingBugs] = useState(true);
  const [selectedBug, setSelectedBug] = useState(null);
  
  // New Bug Form State
  const [showNewBugForm, setShowNewBugForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  const fetchBugs = async () => {
    setLoadingBugs(true);
    try {
      const { data } = await axios.get(`${API}/bugs`, { headers: apiHeaders() });
      setBugs(data);
    } catch (err) {
      addToast('Failed to load bugs', 'error');
    }
    setLoadingBugs(false);
  };

  useEffect(() => {
    fetchBugs();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image must be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitBug = async (e) => {
    e.preventDefault();
    if (!subject || !description) return addToast('Please fill all required fields', 'error');
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/bugs`, { subject, description, image_data: image }, { headers: apiHeaders() });
      addToast('Bug reported successfully!', 'success');
      setShowNewBugForm(false);
      setSubject('');
      setDescription('');
      setImage('');
      fetchBugs();
    } catch (err) {
      addToast('Failed to report bug', 'error');
    }
    setSubmitting(false);
  };

  const openBug = async (bug) => {
    setSelectedBug(bug);
    setLoadingMessages(true);
    try {
      const { data } = await axios.get(`${API}/bugs/${bug.id}/messages`, { headers: apiHeaders() });
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      addToast('Failed to load messages', 'error');
    }
    setLoadingMessages(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedBug) return;
    setSendingMsg(true);
    try {
      await axios.post(`${API}/bugs/${selectedBug.id}/messages`, { message: newMessage }, { headers: apiHeaders() });
      const { data } = await axios.get(`${API}/bugs/${selectedBug.id}/messages`, { headers: apiHeaders() });
      setMessages(data);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      addToast('Failed to send message', 'error');
    }
    setSendingMsg(false);
  };

  const resolveBug = async (id) => {
    try {
      await axios.patch(`${API}/bugs/${id}/status`, { status: 'resolved' }, { headers: apiHeaders() });
      addToast('Bug marked as resolved', 'success');
      fetchBugs();
      if (selectedBug && selectedBug.id === id) {
        setSelectedBug({ ...selectedBug, status: 'resolved' });
      }
    } catch (err) {
      addToast('Failed to resolve bug', 'error');
    }
  };

  // View: Selected Bug Chat Interface
  if (selectedBug) {
    return (
      <div className="page reveal active">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button className="btn btn-ghost" onClick={() => setSelectedBug(null)} style={{ padding: '8px 16px' }}>
            ← Back
          </button>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>{selectedBug.subject}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Reported on {new Date(selectedBug.created_at).toLocaleString()}
              {isAdmin && ` by ${selectedBug.user_name || 'User'} (${selectedBug.user_email})`}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ 
              padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: selectedBug.status === 'open' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              color: selectedBug.status === 'open' ? '#f59e0b' : '#10b981',
              border: `1px solid ${selectedBug.status === 'open' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`
            }}>
              {selectedBug.status === 'open' ? '🟢 Open' : '✅ Resolved'}
            </span>
            {isAdmin && selectedBug.status === 'open' && (
              <button className="btn btn-primary btn-sm" onClick={() => resolveBug(selectedBug.id)}>
                Mark Resolved
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          {/* Chat Section */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '65vh', overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--glass-border)', background: 'rgba(var(--primary-rgb),0.05)' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Communication Log</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Encryption Notice */}
              <div style={{ 
                textAlign: 'center', margin: '0 0 10px', padding: '8px 16px', 
                background: 'rgba(16, 185, 129, 0.1)', borderRadius: 20, 
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: 11, color: '#10b981', fontWeight: 800, letterSpacing: '1.5px',
                fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase'
              }}>
                🛡️ End-to-End Encryption Active // Secure Channel Established
              </div>

              {/* Initial Bug Description as the first message */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ 
                  background: 'var(--glass)', border: '1px solid var(--glass-border)', 
                  padding: 16, borderRadius: '0 16px 16px 16px', maxWidth: '85%' 
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                    {isAdmin ? selectedBug.user_name : 'You'} (Original Report)
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedBug.description}</div>
                  {selectedBug.image_data && (
                    <div style={{ marginTop: 12 }}>
                      <a href={selectedBug.image_data} target="_blank" rel="noreferrer">
                        <img src={selectedBug.image_data} alt="Bug screenshot" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {loadingMessages ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Skeleton width="60%" height="60px" style={{ borderRadius: '0 16px 16px 16px' }} />
                  <Skeleton width="50%" height="60px" style={{ borderRadius: '16px 0 16px 16px', alignSelf: 'flex-end' }} />
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender_id === user.id;
                  const isAdminMsg = msg.sender_role === 'admin';
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        background: isMe ? 'var(--accent-purple)' : (isAdminMsg ? 'rgba(16,185,129,0.15)' : 'var(--glass)'), 
                        border: `1px solid ${isAdminMsg && !isMe ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}`,
                        padding: '12px 16px', 
                        borderRadius: isMe ? '16px 0 16px 16px' : '0 16px 16px 16px', 
                        maxWidth: '85%',
                        color: isMe ? '#fff' : 'inherit'
                      }}>
                        <div style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,0.7)' : (isAdminMsg ? '#10b981' : 'var(--text-muted)'), marginBottom: 4, fontWeight: 700 }}>
                          {isMe ? 'You' : (isAdminMsg ? `🛡️ ${msg.sender_name} (Admin)` : msg.sender_name)}
                          <span style={{ fontWeight: 400, marginLeft: 8 }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedBug.status === 'open' && (
              <form onSubmit={sendMessage} style={{ padding: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 12, background: 'rgba(0,0,0,0.2)' }}>
                <input 
                  className="input" 
                  style={{ flex: 1, margin: 0 }} 
                  placeholder="Type your message..." 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)} 
                />
                <button type="submit" className="btn btn-primary" disabled={sendingMsg || !newMessage.trim()}>
                  {sendingMsg ? '⏳' : 'Send 🚀'}
                </button>
              </form>
            )}
            {selectedBug.status === 'resolved' && (
              <div style={{ padding: 16, borderTop: '1px solid var(--glass-border)', background: 'rgba(16,185,129,0.05)', color: '#10b981', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                This issue has been resolved and closed.
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="glass-card" style={{ padding: 20, height: 'fit-content' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Bug Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedBug.subject}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: selectedBug.status === 'open' ? '#f59e0b' : '#10b981' }}>
                  {selectedBug.status.toUpperCase()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Created</div>
                <div style={{ fontSize: 14 }}>{new Date(selectedBug.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View: Bug List / Create Form
  return (
    <div className="page reveal active">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">🐛 {isAdmin ? 'Bug Reports Center' : 'Bug Reporting'}</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Manage and resolve user issues securely.' : 'Encountered a glitch? Let us know and we will squish it!'}
          </p>
        </div>
        {!isAdmin && !showNewBugForm && (
          <button className="btn btn-primary" onClick={() => setShowNewBugForm(true)}>
            + Report New Bug
          </button>
        )}
      </div>

      {showNewBugForm && !isAdmin ? (
        <div className="glass-card animate-in-up" style={{ padding: 24, marginBottom: 30, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>New Bug Report</h2>
            <button className="modal-close-btn" onClick={() => setShowNewBugForm(false)} title="Close">✕</button>
          </div>
          <form onSubmit={submitBug} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Subject / Title</label>
              <input className="input" placeholder="e.g. Dashboard isn't loading stats" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea className="textarea" placeholder="Please describe exactly what happened and how to reproduce it..." value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
            </div>
            <div className="form-group">
              <label className="form-label">Screenshot (Optional, Max 5MB)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="input" style={{ padding: '8px 12px' }} />
              {image && (
                <div style={{ marginTop: 12 }}>
                  <img src={image} alt="Preview" style={{ maxWidth: 200, borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
              {submitting ? '⏳ Submitting...' : '🚀 Submit Report'}
            </button>
          </form>
        </div>
      ) : null}

      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
          {isAdmin ? 'All Active & Past Reports' : 'Your Previous Reports'}
        </h2>

        {loadingBugs ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} width="100%" height="80px" />
            ))}
          </div>
        ) : bugs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No bugs found!</div>
            <div style={{ fontSize: 14 }}>Everything is running smoothly.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bugs.map(bug => (
              <div 
                key={bug.id} 
                className="bug-item"
                onClick={() => openBug(bug)}
                style={{ 
                  padding: '16px 20px', 
                  background: 'var(--glass)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: 12,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ 
                      width: 8, height: 8, borderRadius: '50%', 
                      background: bug.status === 'open' ? '#f59e0b' : '#10b981',
                      boxShadow: `0 0 8px ${bug.status === 'open' ? '#f59e0b' : '#10b981'}`
                    }} />
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{bug.subject}</h4>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                    <span>📅 {new Date(bug.created_at).toLocaleDateString()}</span>
                    {isAdmin && <span>👤 {bug.user_name}</span>}
                  </div>
                </div>
                <div style={{ paddingLeft: 16 }}>
                  <button className="btn btn-ghost btn-sm" style={{ pointerEvents: 'none' }}>
                    View Chat →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
