import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, CreditCard, PieChart, Bell, Zap, TrendingUp, History, Shield, MousePointer2, ArrowRight, DollarSign, Calendar, Clock, CheckCircle2 } from 'lucide-react';

const AppInfoModal = ({ isOpen, onClose, featureData, onStartJourney }) => {
  const [step, setStep] = useState(0);
  const modalRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [isOpen, featureData]);

  const FEATURES = {
    'Overdue Alerts': {
      id: 'overdue',
      title: "Real-time Overdue Monitoring",
      icon: <Bell size={48} className="text-red" />,
      content: "Never pay a late fee again. Our intelligent monitoring system tracks every due date. If a payment window closes, we trigger high-visibility pulsing alerts.",
      details: ["Pulsing indicators", "Grace period settings", "Automated reminders", "Direct shortcuts"],
      animation: "shake-animation",
      color: "#f87171"
    },
    'Recurring Payments': {
      id: 'recurring',
      title: "Automated Lifecycle Management",
      icon: <CreditCard size={48} className="text-primary" />,
      content: "FreeLancePay handles the repetitive work by managing the entire lifecycle of your recurring bills automatically.",
      details: ["Weekly/Monthly cycles", "Predictive estimation", "One-click roll-over", "ROI tracking"],
      animation: "pulse-animation",
      color: "#22d3ee"
    },
    'Cashflow Projection': {
      id: 'cashflow',
      title: "Strategic Financial Forecasting",
      icon: <PieChart size={48} className="text-secondary" />,
      content: "See into your financial future. Our projection engine analyzes trends to provide a highly accurate 8-month cashflow forecast.",
      details: ["Trend-line visualization", "Lean month detection", "Expense gap analysis", "What-if modeling"],
      animation: "float-animation",
      color: "#a855f7"
    },
    'Income Tracking': {
      id: 'income',
      title: "Revenue Maximization Suite",
      icon: <TrendingUp size={48} className="text-green" />,
      content: "Track every payment with granular detail. Categorize by client or industry to identify your most profitable revenue streams.",
      details: ["Profitability dashboards", "Tax-threshold monitoring", "Invoice reconciliation", "Growth tools"],
      animation: "pulse-animation",
      color: "#34d399"
    },
    'Bill Categories': {
      id: 'categories',
      title: "Intelligent Tax Segmentation",
      icon: <Zap size={48} className="text-accent" />,
      content: "Accounting made easy. We provide a pre-configured taxonomy of tax-deductible categories specifically designed for freelancers.",
      details: ["Freelancer taxonomy", "Custom tag creation", "Tax suggestions", "Spending heatmaps"],
      animation: "float-animation",
      color: "#fbbf24"
    },
    'Payment History': {
      id: 'history',
      title: "Immutable Financial Ledger",
      icon: <History size={48} className="text-muted" />,
      content: "Total transparency. Maintain a permanent, searchable record of every transaction for a complete audit trail.",
      details: ["Global search", "Metadata tracking", "CSV/PDF Export", "Trend comparison"],
      animation: "pulse-animation",
      color: "#94a3b8"
    }
  };

  const activeFeature = featureData && FEATURES[featureData.title] ? FEATURES[featureData.title] : null;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderVisual = () => {
    if (!activeFeature) return null;

    switch (activeFeature.id) {
      case 'overdue':
        return (
          <div className="viz-container overdue-viz">
            <div className="viz-header">Active Alerts</div>
            {[
              { name: 'Cloud Hosting', val: '2d Late', status: 'critical' },
              { name: 'Coworking Space', val: 'Today', status: 'warning' }
            ].map((item, i) => (
              <div key={i} className="viz-row">
                <div className={`viz-dot ${item.status}`} />
                <div className="viz-name">{item.name}</div>
                <div className="viz-value">{item.val}</div>
              </div>
            ))}
            <div className="viz-pulse-ring" />
          </div>
        );
      case 'recurring':
        return (
          <div className="viz-container recurring-viz">
            <div className="viz-header">Lifecycle status</div>
            {[
              { name: 'AWS Cloud', val: 'Cycle: Weekly', progress: 75 },
              { name: 'Adobe CC', val: 'Cycle: Monthly', progress: 40 }
            ].map((item, i) => (
              <div key={i} className="viz-mini-card">
                <div className="viz-name">{item.name}</div>
                <div className="viz-value">{item.val}</div>
                <div className="viz-progress-bg"><div className="viz-progress-fill" style={{ width: `${item.progress}%` }} /></div>
              </div>
            ))}
          </div>
        );
      case 'cashflow':
        return (
          <div className="viz-container cashflow-viz">
            <div className="viz-header">8-Month Forecast</div>
            <div className="viz-chart">
              {[40, 70, 35, 90, 60, 100, 80, 110].map((h, i) => (
                <div 
                  key={i} 
                  className="viz-bar" 
                  style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {hoverIndex === i && <div className="viz-tooltip">${h * 150}</div>}
                </div>
              ))}
            </div>
            <div className="viz-labels">J F M A M J J A</div>
          </div>
        );
      case 'income':
        return (
          <div className="viz-container income-viz">
            <div className="viz-header">Top Clients</div>
            <div className="viz-donut-row">
              <div className="viz-donut-mini" />
              <div className="viz-legend">
                <div className="viz-legend-item"><span className="dot s1" /> TechCorp (65%)</div>
                <div className="viz-legend-item"><span className="dot s2" /> StartupX (35%)</div>
              </div>
            </div>
          </div>
        );
      case 'categories':
        return (
          <div className="viz-container categories-viz">
            <div className="viz-header">Auto-Segmentation</div>
            <div className="viz-tag-grid">
              {['#Software', '#Ads', '#Hardware', '#Tax'].map((t, i) => (
                <div key={t} className="viz-tag-pill" style={{ animationDelay: `${i * 0.1}s` }}>{t}</div>
              ))}
            </div>
            <div className="viz-savings">Estimated Deductions: <b>$3.2k</b></div>
          </div>
        );
      case 'history':
        return (
          <div className="viz-container history-viz">
            <div className="viz-header">Recent Activity</div>
            {[
              { label: 'Stripe Payout', val: '+$2,400', type: 'in' },
              { label: 'Cloud Hosting', val: '-$45', type: 'out' }
            ].map((item, i) => (
              <div key={i} className="viz-flat-item">
                <div className="viz-desc">{item.label}</div>
                <div className={`viz-val ${item.type === 'in' ? 'text-green' : 'text-red'}`}>{item.val}</div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const modalContent = (
    <div className="info-modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="info-modal-content horizontal-layout" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {activeFeature ? (
          <>
            {/* Left Section: Info & Details */}
            <div className="modal-left-panel">
              <div className="feature-header-row">
                <div className={`feature-icon-box ${activeFeature.animation}`}>
                  {activeFeature.icon}
                </div>
                <div className="feature-titles">
                  <div className="badge-row">
                    <span className="badge premium">PREMIUM</span>
                    <span className="badge beta">BETA</span>
                  </div>
                  <h2 className="feature-main-title">{activeFeature.title}</h2>
                </div>
              </div>
              
              <p className="feature-description">
                {activeFeature.content}
              </p>

              <div className="capabilities-section">
                <h3 className="section-label">Core Capabilities</h3>
                <div className="capabilities-grid">
                  {activeFeature.details.map((detail, idx) => (
                    <div key={idx} className="capability-item">
                      <CheckCircle2 size={16} className="check-icon" style={{ color: activeFeature.color }} />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer-horizontal">
                <button className="btn-configure" onClick={onStartJourney}>
                  <span>Get Started with {featureData.title}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Right Section: Interactive Visualization */}
            <div className="modal-right-panel">
               <div className="interactive-preview-box">
                  <div className="preview-glare" />
                  {renderVisual()}
               </div>
               <div className="interaction-hint">
                 <MousePointer2 size={12} />
                 <span>Interactive Preview Mode</span>
               </div>
            </div>
          </>
        ) : (
          <div className="fallback-message">
            <h2>Select a category to explore</h2>
            <button className="btn-configure" onClick={onClose}>Back to Dashboard</button>
          </div>
        )}

        <style>{`
          .info-modal-overlay {
            position: fixed; inset: 0; 
            background: rgba(1, 4, 18, 0.94);
            backdrop-filter: blur(24px);
            z-index: 1000000;
            display: flex; align-items: center; justify-content: center;
            padding: 24px;
            perspective: 2000px;
          }
          .info-modal-content.horizontal-layout {
            width: 100%; max-width: 900px; 
            background: #0B0E14;
            border-radius: 40px;
            position: relative;
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 0 120px rgba(34, 211, 238, 0.15), 0 80px 200px rgba(0,0,0,1);
            animation: modalSlideInWide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            overflow: hidden;
            transform-style: preserve-3d;
          }

          @keyframes modalSlideInWide {
            0% { opacity: 0; transform: scale(0.9) translateZ(-200px) rotateY(-5deg); }
            100% { opacity: 1; transform: scale(1) translateZ(0) rotateY(0deg); }
          }

          .close-btn {
            position: absolute; top: 28px; right: 28px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: #94a3b8; width: 40px; height: 40px; border-radius: 50%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all 0.3s; z-index: 100;
          }
          .close-btn:hover { background: #f87171; color: white; transform: rotate(90deg); }

          /* Left Panel */
          .modal-left-panel { padding: 48px; border-right: 1px solid rgba(255,255,255,0.05); }
          .feature-header-row { display: flex; gap: 24px; align-items: center; margin-bottom: 24px; }
          .feature-icon-box { width: 80px; height: 80px; background: rgba(255,255,255,0.03); border-radius: 24px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05); }
          
          .badge-row { display: flex; gap: 8px; margin-bottom: 8px; }
          .badge { font-size: 9px; font-weight: 900; padding: 3px 10px; border-radius: 6px; letter-spacing: 1px; }
          .badge.premium { background: linear-gradient(90deg, #22d3ee, #3b82f6); color: white; }
          .badge.beta { background: rgba(251, 191, 36, 0.1); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.2); }
          
          .feature-main-title { font-size: 28px; font-weight: 900; color: white; margin: 0; letter-spacing: -1px; line-height: 1.1; }
          .feature-description { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 32px; }

          .section-label { font-size: 10px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; }
          .capabilities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 40px; }
          .capability-item { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: #e2e8f0; }

          .modal-footer-horizontal { margin-top: auto; }
          .btn-configure {
            width: 100%; height: 64px; 
            background: linear-gradient(135deg, #22d3ee, #3b82f6);
            border: none; border-radius: 20px; color: white;
            font-size: 15px; font-weight: 900; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 12px;
            transition: all 0.3s;
            box-shadow: 0 10px 30px rgba(34, 211, 238, 0.3);
          }
          .btn-configure:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(34, 211, 238, 0.5); }

          /* Right Panel */
          .modal-right-panel { padding: 48px; background: rgba(0,0,0,0.2); display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
          .interactive-preview-box {
            width: 100%; max-width: 340px; aspect-ratio: 1.1;
            background: rgba(1, 4, 18, 0.5); border-radius: 32px;
            border: 1px solid rgba(255,255,255,0.05); padding: 32px;
            position: relative; overflow: hidden;
            box-shadow: inset 0 0 40px rgba(0,0,0,0.5);
          }
          .preview-glare { position: absolute; top: -100%; left: -100%; width: 300%; height: 300%; background: radial-gradient(circle at center, rgba(34, 211, 238, 0.05), transparent 70%); pointer-events: none; }
          .interaction-hint { margin-top: 20px; display: flex; align-items: center; gap: 8px; color: #475569; font-size: 11px; font-weight: 800; text-transform: uppercase; }

          /* Visuals */
          .viz-container { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; }
          .viz-header { font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; }
          
          .overdue-viz .viz-row { display: flex; align-items: center; gap: 12px; padding: 14px; background: rgba(255,255,255,0.03); border-radius: 16px; margin-bottom: 10px; }
          .viz-dot { width: 8px; height: 8px; border-radius: 50%; }
          .viz-dot.critical { background: #f87171; box-shadow: 0 0 12px #f87171; animation: pulseDot 1s infinite; }
          .viz-dot.warning { background: #fbbf24; }
          .viz-name { flex: 1; font-weight: 800; color: #fff; font-size: 13px; }
          .viz-value { font-size: 12px; font-weight: 900; color: #64748b; }

          .cashflow-viz .viz-chart { display: flex; align-items: flex-end; gap: 8px; height: 120px; }
          .viz-bar { flex: 1; background: linear-gradient(180deg, #a855f7, #6366f1); border-radius: 4px 4px 0 0; position: relative; cursor: pointer; animation: growBar 1s ease-out forwards; transform-origin: bottom; }
          .viz-labels { display: flex; justify-content: space-between; padding-top: 12px; font-size: 10px; font-weight: 900; color: #475569; }
          .viz-tooltip { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: white; color: black; font-size: 10px; font-weight: 900; padding: 4px 8px; border-radius: 6px; }

          .income-viz .viz-donut-row { display: flex; align-items: center; gap: 24px; }
          .viz-donut-mini { width: 80px; height: 80px; border-radius: 50%; border: 8px solid #34d399; border-top-color: transparent; animation: spin 20s linear infinite; }
          .viz-legend { display: flex; flex-direction: column; gap: 8px; }
          .viz-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #94a3b8; }
          .viz-legend-item .dot { width: 8px; height: 8px; border-radius: 50%; }
          .viz-legend-item .dot.s1 { background: #34d399; }
          .viz-legend-item .dot.s2 { background: #22d3ee; }

          .categories-viz .viz-tag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
          .viz-tag-pill { background: rgba(251, 191, 36, 0.1); color: #fbbf24; border-radius: 10px; padding: 10px; font-size: 11px; font-weight: 800; text-align: center; border: 1px solid rgba(251, 191, 36, 0.1); animation: pop 0.4s ease-out forwards; transform: scale(0); }
          .viz-savings { font-size: 13px; color: #94a3b8; text-align: center; }
          .viz-savings b { color: #34d399; font-size: 16px; }

          .recurring-viz .viz-mini-card { background: rgba(255,255,255,0.03); padding: 12px; border-radius: 16px; margin-bottom: 12px; }
          .viz-progress-bg { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 8px; }
          .viz-progress-fill { height: 100%; background: #22d3ee; border-radius: 2px; }

          .history-viz .viz-flat-item { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 12px; font-weight: 700; }

          /* Animations */
          @keyframes growBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
          @keyframes pop { to { transform: scale(1); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulseDot { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } 100% { opacity: 1; transform: scale(1); } }
          
          .shake-animation { animation: shake 5s ease-in-out infinite; }
          .pulse-animation { animation: pulse 3s ease-in-out infinite; }
          .float-animation { animation: float 4s ease-in-out infinite; }

          @keyframes shake { 0%, 90% { transform: rotate(0); } 92% { transform: rotate(10deg); } 94% { transform: rotate(-10deg); } 96% { transform: rotate(10deg); } 98% { transform: rotate(-10deg); } 100% { transform: rotate(0); } }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); filter: brightness(1.2); } }
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

          .text-red { color: #f87171; }
          .text-green { color: #34d399; }
          .text-primary { color: #22d3ee; }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AppInfoModal;
