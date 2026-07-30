import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';

const GithubIcon = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
    <path d="M9 18c-4.51 2-5-2-7-2"></path>
  </svg>
);

const LinkedinIcon = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-container" style={{
      marginTop: 'auto',
      padding: '50px 20px 40px',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      background: 'rgba(5, 10, 30, 0.6)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 30,
      textAlign: 'center',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Unique Line */}
      <div className="footer-motto" style={{
        fontSize: 16,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        letterSpacing: '0.3px',
        maxWidth: 600,
        lineHeight: 1.6,
        fontFamily: 'var(--font-display)'
      }}>
        "Empowering freelancers to turn every <span style={{ color: 'var(--primary)' }}>vision</span> into <span style={{ color: 'var(--primary)' }}>value</span>, one payment at a time."
      </div>

      {/* Social Icons */}
      <div className="footer-socials" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <a href="https://github.com/Harshit-Mehta-Dev" target="_blank" rel="noopener noreferrer" className="footer-icon-link" title="GitHub">
          <GithubIcon className="footer-social-icon" size={22} />
        </a>
        <a href="https://www.linkedin.com/in/harshit-mehta-107425279/" target="_blank" rel="noopener noreferrer" className="footer-icon-link" title="LinkedIn">
          <LinkedinIcon className="footer-social-icon" size={22} />
        </a>
        <a href="mailto:harshitmehta1012@gmail.com" className="footer-icon-link" title="Email Me">
          <Mail className="footer-social-icon" size={22} />
        </a>
      </div>

      {/* Compliance Seal */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 24,
        fontSize: 11,
        color: '#10b981',
        fontWeight: 700,
        letterSpacing: '0.5px'
      }}>
        <ShieldCheck size={16} /> CYBER-SHIELD COMPLIANT
      </div>

      {/* Rights Reserved */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', marginTop: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
          © {currentYear} <span style={{ color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '0.5px' }}>FreeLancePay App</span>. All rights reserved.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>
          Built with <span style={{ color: '#ef4444' }}>❤️</span> for the Freelance Community
        </div>
      </div>

      <style>{`
        .footer-icon-link {
          text-decoration: none;
          background: rgba(255, 255, 255, 0.03);
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .footer-icon-link:hover {
          background: rgba(var(--primary-rgb), 0.12);
          border-color: rgba(var(--primary-rgb), 0.4);
          color: var(--primary);
          transform: translateY(-4px);
          box-shadow: 0 8px 20px -6px rgba(var(--primary-rgb), 0.4);
        }
        
        .footer-social-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .footer-icon-link:hover .footer-social-icon {
          transform: scale(1.15);
        }
        
        @media (max-width: 600px) {
          .footer-container { padding: 40px 15px 30px; }
          .footer-motto { font-size: 14px !important; }
        }
      `}</style>
    </footer>
  );
}
