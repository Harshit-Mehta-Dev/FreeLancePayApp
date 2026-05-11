import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, DollarSign, Info } from 'lucide-react';
import AppInfoModal from '../components/AppInfoModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass animate-fade-in">
        <div className="auth-header">
          <div className="logo-icon glass">
            <DollarSign size={32} className="text-primary" />
          </div>
          <h1>Welcome Back</h1>
          <p>Login to manage your freelance finances</p>
          
          <button 
            type="button" 
            className="info-trigger-btn glass"
            onClick={() => setShowInfo(true)}
          >
            <Info size={14} />
            <span>All Categories & Guide</span>
          </button>
        </div>

        <AppInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 1rem;
          background: linear-gradient(135deg, var(--bg-main) 0%, #e0e7ff 100%);
        }
        [data-theme='dark'] .auth-container {
          background: linear-gradient(135deg, var(--bg-main) 0%, #1e1b4b 100%);
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          border-radius: var(--radius-lg);
          text-align: center;
        }
        .auth-header h1 {
          margin-top: 1rem;
          font-size: 1.875rem;
          color: var(--text-main);
        }
        .auth-header p {
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        .info-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 99px;
          border: 1px solid var(--glass-border);
          color: var(--primary-light);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: all 0.2s;
        }
        .info-trigger-btn:hover {
          background: var(--bg-card-hover);
          transform: translateY(-2px);
        }
        .logo-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          border-radius: var(--radius);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }
        input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-card);
          color: var(--text-main);
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: var(--primary);
        }
        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        .w-full { width: 100%; }
        .auth-footer {
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .auth-footer a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
