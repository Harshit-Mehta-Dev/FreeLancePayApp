import React, { useState } from 'react';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>{title}</h3>
    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{children}</div>
  </div>
);

export default function Legal() {
  const [tab, setTab] = useState('privacy');

  return (
    <div className="page" style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 60 }}>
      <header style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Legal & Compliance</h1>
        <p style={{ color: 'var(--text-muted)' }}>Updated April 26, 2026</p>
      </header>

      <div style={{ display: 'flex', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
        <button 
          onClick={() => setTab('privacy')}
          className={`btn ${tab === 'privacy' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '10px 24px' }}
        >
          🔒 Privacy Policy
        </button>
        <button 
          onClick={() => setTab('terms')}
          className={`btn ${tab === 'terms' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '10px 24px' }}
        >
          📜 Terms of Service
        </button>
      </div>

      <div className="card" style={{ padding: 40, background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
        {tab === 'privacy' ? (
          <div>
            <Section title="1. Holistic Data Collection">
              We collect and process three primary categories of information:
              <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                <li><strong>Identity Data:</strong> Legal name, verified email address, and encrypted authentication tokens.</li>
                <li><strong>Financial Intelligence:</strong> Detailed records of bills, income sources, payment history, and cashflow parameters.</li>
                <li><strong>Security Telemetry:</strong> IP addresses, browser fingerprinting, and behavioral patterns used exclusively for the Intelligence Vault to detect and neutralize cyber threats.</li>
              </ul>
            </Section>
            <Section title="2. The Intelligence Vault (MongoDB)">
              Security telemetry is stored in an isolated NoSQL "Intelligence Vault." This data is used by our AI-driven security layers to detect malicious patterns, SQL injection attempts, and unauthorized access. This data is NEVER shared with marketing third parties and is purged after 90 days of inactivity.
            </Section>
            <Section title="3. Data Sovereignty & Protection">
              We implement military-grade security protocols, including AES-256 equivalent hashing, HTTP-only Secure Cookies, and a Cyber-Cloud Reverse Proxy. To balance convenience and security, your login session is maintained via an encrypted token that persists for <strong>7 days</strong>. After this period, for your protection, you will be required to re-authenticate.
            </Section>
            <Section title="4. Right to Erasure">
              Under GDPR and global privacy standards, you have the "Right to be Forgotten." Deleting your account from the Settings panel will trigger a recursive wipe of your data from both our primary SQLite database and the Intelligence Vault.
            </Section>
          </div>
        ) : (
          <div>
            <Section title="1. Binding Agreement">
              By accessing the FreelancePay ecosystem, you enter into a legally binding contract. Unauthorized access or use of the API outside of the provided interface is a breach of this contract.
            </Section>
            <Section title="2. Zero-Tolerance Prohibited Activities">
              The following actions are strictly prohibited and monitored by our automated defense systems:
              <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                <li>Attempting SQL/NoSQL Injection or XSS attacks.</li>
                <li>Automated scraping or "botting" of financial data.</li>
                <li>Reverse-engineering the Mavin-AI logic or database schemas.</li>
                <li>Bypassing the Cyber-Cloud Reverse Proxy or Rate Limiters.</li>
              </ul>
            </Section>
            <Section title="3. Repercussions of Non-Compliance">
              Violation of these guidelines will result in immediate and irreversible actions:
              <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                <li><strong>IP Blackhawk Ban:</strong> Your IP address will be permanently blacklisted across our entire network.</li>
                <li><strong>Asset Freeze:</strong> Immediate suspension of account access and deletion of all associated data.</li>
                <li><strong>Legal Referral:</strong> For attempted data breaches or injection attacks, we reserve the right to share telemetry logs with law enforcement and cyber-crime divisions.</li>
              </ul>
            </Section>
            <Section title="4. Limitation of Liability">
              FreelancePay provides financial projections for informational purposes only. We are not a licensed financial institution. You assume all risk for financial decisions made based on the application's output.
            </Section>
            <Section title="5. Session Persistence & Security">
              For security reasons, active sessions are granted a maximum duration of <strong>168 hours (7 days)</strong>. Regardless of activity, you will be automatically logged out and required to re-authenticate once this period expires to ensure the continued protection of your financial data.
            </Section>
          </div>
        )}
      </div>

      <footer style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Questions? Contact us at legal@freelancepay.com
        </p>
      </footer>
    </div>
  );
}
