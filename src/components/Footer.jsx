import React from 'react';

export default function Footer() {
  const currentYear = 2026;
  
  return (
    <footer className="footer-container" style={{
      marginTop: 'auto',
      padding: '40px 20px',
      borderTop: '1px solid var(--glass-border)',
      background: 'var(--glass)',
      backdropFilter: 'blur(10px)',
      webkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      textAlign: 'center'
    }}>
      {/* Unique Line */}
      <div className="footer-motto" style={{
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        letterSpacing: '0.5px',
        maxWidth: 600,
        lineHeight: 1.6
      }}>
        "Empowering freelancers to turn every <span style={{ color: 'var(--primary-light)' }}>vision</span> into <span style={{ color: 'var(--primary-light)' }}>value</span>, one payment at a time."
      </div>

      {/* Social Icons */}
      <div className="footer-socials" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <a href="https://github.com/harshit-mehta-lab" target="_blank" rel="noopener noreferrer" className="footer-icon-link" title="GitHub">
          <span className="footer-social-icon" data-icon="🐙" style={{ fontSize: 24 }}>🐙</span>
        </a>
        <a href="https://www.linkedin.com/in/-harshit-mehta/" target="_blank" rel="noopener noreferrer" className="footer-icon-link" title="LinkedIn">
          <span className="footer-social-icon" data-icon="🔗" style={{ fontSize: 24 }}>🔗</span>
        </a>
        <a href="mailto:harshitmehta1012@gmail.com" className="footer-icon-link" title="Email Me">
          <span className="footer-social-icon" data-icon="✉️" style={{ fontSize: 24 }}>✉️</span>
        </a>
      </div>

      {/* Compliance Seal */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 20,
        fontSize: 11,
        color: '#10b981',
        fontWeight: 600,
        letterSpacing: '0.5px'
      }}>
        <span style={{ fontSize: 14 }}>🛡️</span> CYBER-SHIELD COMPLIANT
      </div>

      {/* Rights Reserved */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
          © {currentYear} <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>FreeLancePay App</span>. All rights reserved.
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.7 }}>
          Built with ❤️ for the Freelance Community
        </div>
      </div>

      <style>{`
        .footer-icon-link {
          text-decoration: none;
          background: var(--glass);
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          border: 1px solid var(--glass-border);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .footer-icon-link:hover {
          background: rgba(var(--primary-rgb), 0.15);
          border-color: var(--primary-light);
          transform: translateY(-5px);
          box-shadow: 0 10px 20px -5px rgba(var(--primary-rgb), 0.3);
        }
        .footer-social-icon {
          transition: transform 0.3s ease;
        }
        .footer-icon-link:hover .footer-social-icon {
          transform: scale(1.2);
        }
        
        @media (max-width: 600px) {
          .footer-container { padding: 30px 15px; }
          .footer-motto { fontSize: 14px; }
        }
      `}</style>
    </footer>
  );
}
