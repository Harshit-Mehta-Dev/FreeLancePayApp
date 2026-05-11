import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Calendar, 
  ArrowRight,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="landing-page">
      <nav className="landing-nav glass">
        <div className="container nav-content">
          <div className="logo">
            <div className="logo-icon glass">
              <BookOpen size={24} className="text-primary" />
            </div>
            <span>SmartStudy</span>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/register" className="btn btn-primary">Join Now</Link>
          </div>
        </div>
      </nav>

      <header className="hero-section">
        <div className="container">
          <div className="hero-content animate-fade-up">
            <div className="badge glass">Platform for Students</div>
            <h1>Study Smarter, <span className="text-gradient">Not Harder</span></h1>
            <p className="hero-desc">
              Organize your academic life with our all-in-one study planner. 
              Track tasks, manage subjects, and master your time with integrated 
              Pomodoro techniques.
            </p>
            <div className="hero-btns">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started for Free <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
      </header>

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Everything You Need to Succeed</h2>
            <p>Powerful tools designed to boost your productivity</p>
          </div>
          <div className="features-grid">
            <div className="feature-card glass">
              <div className="feature-icon bg-primary-soft">
                <Clock className="text-primary" />
              </div>
              <h3>Pomodoro Timer</h3>
              <p>Stay focused with customizable deep work sessions and timed breaks.</p>
            </div>
            <div className="feature-card glass">
              <div className="feature-icon bg-secondary-soft">
                <CheckCircle className="text-secondary" />
              </div>
              <h3>Task Management</h3>
              <p>Break down complex assignments into manageable daily to-dos.</p>
            </div>
            <div className="feature-card glass">
              <div className="feature-icon bg-accent-soft">
                <Calendar className="text-accent" />
              </div>
              <h3>Exam Reminders</h3>
              <p>Never miss a deadline with our integrated exam and assignment tracker.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2026 SmartStudy Planner. Made for excellence.</p>
        </div>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background-color: var(--bg-main);
          color: var(--text-main);
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 1rem 0;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border);
        }

        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.5rem;
          font-family: 'Outfit', sans-serif;
        }

        .nav-actions {
          display: flex;
          gap: 1rem;
        }

        .hero-section {
          position: relative;
          padding: 10rem 0 6rem;
          text-align: center;
          min-height: 80vh;
          display: flex;
          align-items: center;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
        }

        .badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 1.5rem;
        }

        .hero-section h1 {
          font-size: 4rem;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          font-weight: 800;
        }

        .text-gradient {
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 1.25rem;
          color: var(--text-muted);
          margin-bottom: 2.5rem;
          line-height: 1.6;
        }

        .hero-btns {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.125rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hero-bg-shapes {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
        }

        .shape-1 {
          width: 400px;
          height: 400px;
          background: var(--primary);
          top: -100px;
          right: -100px;
        }

        .shape-2 {
          width: 500px;
          height: 500px;
          background: var(--secondary);
          bottom: -200px;
          left: -200px;
        }

        .features-section {
          padding: 6rem 0;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .section-header p {
          color: var(--text-muted);
          font-size: 1.125rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          padding: 2.5rem;
          text-align: left;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .feature-card:hover {
          transform: translateY(-10px);
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .feature-card p {
          color: var(--text-muted);
          line-height: 1.6;
        }

        .bg-primary-soft { background: rgba(99, 102, 241, 0.1); }
        .bg-secondary-soft { background: rgba(236, 72, 153, 0.1); }
        .bg-accent-soft { background: rgba(245, 158, 11, 0.1); }

        .landing-footer {
          padding: 4rem 0;
          text-align: center;
          border-top: 1px solid var(--border);
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .hero-section h1 {
            font-size: 2.5rem;
          }
          .hero-btns {
            flex-direction: column;
          }
          .nav-actions {
            display: none;
          }
        }

        .animate-fade-up {
          animation: fade-up 0.8s ease-out forwards;
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
