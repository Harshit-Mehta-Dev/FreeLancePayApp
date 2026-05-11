import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../api/config';
import { useToast } from '../context/ToastContext';

export default function Feedback() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) return addToast('Please fill all fields', 'error');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/feedback`, { email, subject, message, rating });
      addToast('Feedback sent! Thank you ❤️', 'success');
      setEmail('');
      setSubject('');
      setMessage('');
      setRating(5);
    } catch {
      addToast('Failed to send feedback', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="page" style={{ maxWidth: 700, margin: '0 auto' }}>
      <header className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">💬 Share Your Feedback</h1>
        <p className="page-subtitle">Your thoughts help us make FreelancePay better for everyone.</p>
      </header>

      <div className="glass-card animate-fade" style={{ padding: 40, marginTop: 20 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="form-group">
            <label className="form-label">Your Email (Optional)</label>
            <input 
              className="input" 
              type="email"
              placeholder="How can we reach you back?"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <input 
              className="input" 
              placeholder="E.g. Feature Suggestion, Bug Report, Love the design!"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea 
              className="textarea" 
              placeholder="Tell us more about your experience..."
              style={{ minHeight: 180 }}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">How would you rate your experience?</label>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '10px 0' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  type="button"
                  key={star} 
                  onClick={() => setRating(star)} 
                  style={{
                    fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
                    filter: rating >= star ? 'none' : 'grayscale(1) opacity(0.3)',
                    transition: 'all 0.2s',
                    transform: rating === star ? 'scale(1.2)' : 'none'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: '16px', fontSize: 16, width: '100%', justifyContent: 'center' }}
            disabled={loading || !subject || !message}
          >
            {loading ? '🚀 Sending Feedback...' : '📩 Send Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
