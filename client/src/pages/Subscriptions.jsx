import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Check, Sparkles, CreditCard, HelpCircle, Shield, Award, Zap } from 'lucide-react';
import axios from 'axios';
import { API } from '../api/config';

export default function Subscriptions() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [checkoutLoading, setCheckoutLoading] = useState(null); // tier name when loading

  const currency = user?.currency === 'INR' ? 'INR' : 'USD';
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Pricing Tiers Data
  const tiers = [
    {
      name: 'Starter',
      id: 'free',
      description: 'Essential billing tools for side-hustlers and new freelancers.',
      price: {
        monthly: 0,
        yearly: 0
      },
      features: [
        'Up to 3 active client vaults',
        'Basic expense tracking',
        'Manual invoice generator',
        'Standard dashboard metrics',
        'Secure local data backup'
      ],
      cta: 'Current Plan',
      popular: false,
      color: '#94a3b8'
    },
    {
      name: 'Freelancer Pro',
      id: 'pro',
      description: 'Advanced financial suite to automate operations and grow business.',
      price: {
        monthly: currency === 'INR' ? 799 : 9,
        yearly: currency === 'INR' ? 639 : 7
      },
      features: [
        'Unlimited active client vaults',
        'Automated recurring bill alerts',
        '8-Month predictive cashflow charts',
        'Custom invoice branding & PDFs',
        'Stripe payment gateway integration',
        'Priority email support (under 12h)'
      ],
      cta: 'Upgrade to Pro',
      popular: true,
      color: 'var(--primary)'
    },
    {
      name: 'Agency Premium',
      id: 'premium',
      description: 'Fully featured environment for teams, agencies, and high-volume professionals.',
      price: {
        monthly: currency === 'INR' ? 2499 : 29,
        yearly: currency === 'INR' ? 1999 : 23
      },
      features: [
        'Everything in Freelancer Pro',
        'Unlimited automated tax ledgers',
        'Multi-currency balance sheets',
        'Virtual security analyst helpdesk',
        'API access for external accounting tools',
        '24/7 dedicated telephone support'
      ],
      cta: 'Go Premium',
      popular: false,
      color: 'var(--accent-purple)'
    }
  ];

  const handleCheckout = async (tierId) => {
    if (tierId === 'free') return;
    setCheckoutLoading(tierId);
    try {
      const response = await axios.post(`${API}/stripe/create-checkout-session`, {
        tier: tierId,
        billingCycle,
        currency,
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/subscriptions?checkout=cancelled`
      }, { withCredentials: true });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Stripe connection failed. Please try again.', 'error');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="subscriptions-page" style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header telemetry section */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: 900, 
          marginBottom: 12, 
          fontFamily: 'var(--font-display)',
          letterSpacing: '-1px',
          background: 'linear-gradient(to right, #ffffff, var(--primary-light))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Elevate Your Business Security & Automation
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Choose the right operational capability tier. Access state-of-the-art automation ledgers, predictive cashflow, and priority server nodes.
        </p>

        {/* Toggle billing cycle */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          background: 'rgba(255,255,255,0.03)', 
          padding: '4px', 
          borderRadius: '12px', 
          border: '1px solid rgba(255,255,255,0.06)',
          marginTop: 28
        }}>
          <button 
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: billingCycle === 'monthly' ? 'var(--primary)' : 'transparent',
              color: billingCycle === 'monthly' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.3s ease'
            }}
          >
            Monthly Billing
          </button>
          <button 
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: billingCycle === 'yearly' ? 'var(--primary)' : 'transparent',
              color: billingCycle === 'yearly' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            Yearly Billing
            <span style={{
              position: 'absolute', top: '-12px', right: '-12px', background: 'var(--accent-purple)',
              color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: '6px',
              boxShadow: '0 0 10px rgba(var(--primary-rgb), 0.3)'
            }}>
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 50 }}>
        {tiers.map((tier) => {
          const price = billingCycle === 'monthly' ? tier.price.monthly : tier.price.yearly;
          const isUserPlan = tier.id === 'free'; // Mock active plan state for demo

          return (
            <div 
              key={tier.id}
              className={`glass-card reveal ${tier.popular ? 'popular-card' : ''}`}
              style={{
                display: 'flex', flexDirection: 'column', padding: 32, borderRadius: 24,
                position: 'relative', overflow: 'hidden', border: tier.popular ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                background: tier.popular ? 'rgba(var(--primary-rgb), 0.03)' : 'rgba(255,255,255,0.01)',
                boxShadow: tier.popular ? '0 20px 40px -15px rgba(var(--primary-rgb), 0.15)' : 'none',
                transition: 'transform 0.3s ease, border-color 0.3s ease'
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute', top: 20, right: 20, background: 'var(--primary)',
                  color: '#fff', fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  <Sparkles size={12} /> MOST POPULAR
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: tier.color, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {tier.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, minHeight: 40, lineHeight: 1.5 }}>{tier.description}</p>
              </div>

              {/* Price representation */}
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 28 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)' }}>
                  {currencySymbol}{price}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, marginLeft: 6, fontWeight: 500 }}>
                  / month {billingCycle === 'yearly' && '(billed annually)'}
                </span>
              </div>

              {/* Features checklist */}
              <div style={{ flex: 1, marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
                  Includes:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tier.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.04)', padding: 2, borderRadius: '50%',
                        color: tier.color, display: 'inline-flex', marginTop: 2
                      }}>
                        <Check size={14} />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => handleCheckout(tier.id)}
                disabled={isUserPlan || checkoutLoading !== null}
                className={`btn ${tier.popular ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  width: '100%', padding: '14px', borderRadius: '16px', fontWeight: 900,
                  fontSize: 14, cursor: isUserPlan ? 'default' : 'pointer',
                  background: isUserPlan ? 'rgba(255,255,255,0.05)' : undefined,
                  color: isUserPlan ? 'var(--text-muted)' : undefined,
                  borderColor: isUserPlan ? 'transparent' : undefined
                }}
              >
                {checkoutLoading === tier.id ? (
                  'Connecting Securely...'
                ) : isUserPlan ? (
                  'Current Activated Vault'
                ) : (
                  tier.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee highlights */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 20, 
        marginBottom: 50,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: 40
      }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ color: 'var(--primary)', marginTop: 2 }}><Shield size={24} /></div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Secured Checkout via Stripe</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
              All transactions are encrypted and processed by Stripe. We never store your full payment card details.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ color: 'var(--accent-purple)', marginTop: 2 }}><Award size={24} /></div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Flexible Cancellation Policy</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
              Downgrade, cancel, or switch tiers at any time. No hidden setup costs or lock-in periods.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ color: 'var(--accent-cyan)', marginTop: 2 }}><HelpCircle size={24} /></div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Any Questions?</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
              Reach out to our security team or check out documentation. We are here to support your operation.
            </p>
          </div>
        </div>
      </div>

      {/* Mock Billing history table */}
      <div className="glass-card" style={{ padding: 24, borderRadius: 20, marginBottom: 40 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={18} className="text-primary" /> Invoice & Vault Ledger History
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Payment Date</th>
                <th>Billing Tier</th>
                <th>Total Amount</th>
                <th>Transaction Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>FP-89240173</td>
                <td>2026-07-28</td>
                <td>Free Plan Vault initialization</td>
                <td>$0.00</td>
                <td><span className="badge badge-paid">Settled</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
