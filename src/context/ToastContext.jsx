import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API } from '../api/config';
import { useAuth } from './AuthContext';
import { Bell, X, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showCenter, setShowCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${API}/notifications`, { withCredentials: true });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`${API}/notifications/${id}/read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${API}/notifications/read-all`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'bug_report':
      case 'bug_status': return <CheckCircle2 size={18} className="text-success" />;
      case 'admin_message':
      case 'user_message': return <MessageCircle size={18} className="text-accent" />;
      default: return <AlertCircle size={18} className="text-primary" />;
    }
  };

  return (
    <NotificationContext.Provider value={{ addToast, notifications, unreadCount, markAsRead, markAllAsRead, setShowCenter, showCenter }}>
      {children}
      
      {/* Toast Overlay */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} interactive-notification`}>
            <div className="toast-icon">{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</div>
            <div className="toast-content">{t.msg}</div>
          </div>
        ))}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <>
          <div className="notification-backdrop" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedNotification(null)} />
          <div className="notif-detail-modal glass-card">
            <div className="notif-detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="notif-icon-box" style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: 10, borderRadius: 12 }}>
                  {getIcon(selectedNotification.type)}
                </div>
                <h3 style={{ margin: 0, fontSize: 18 }}>{selectedNotification.title}</h3>
              </div>
              <button className="close-notif-btn" onClick={() => setSelectedNotification(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="notif-detail-content">
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 24 }}>
                {selectedNotification.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Received: {new Date(selectedNotification.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Notification Center Popover */}
      {showCenter && (
        <>
          <div className="notification-backdrop" onClick={() => setShowCenter(false)} />
          <div className="notification-center glass-card">
            <div className="notification-header">
              <h3>Notifications</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="text-btn" onClick={markAllAsRead}>Mark all read</button>
                <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowCenter(false)} />
              </div>
            </div>
            
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-notifications">
                  <Bell size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id);
                      setSelectedNotification(n);
                      setShowCenter(false);
                    }}
                  >
                    <div className="notif-icon-box">{getIcon(n.type)}</div>
                    <div className="notif-body">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-msg">{n.message.length > 60 ? n.message.substring(0, 60) + '...' : n.message}</div>
                      <div className="notif-time">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                    {!n.is_read && <div className="unread-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .toast-container {
          position: fixed; top: 24px; right: 24px; z-index: 9999;
          display: flex; flex-direction: column; gap: 12px;
        }
        .toast {
          background: rgba(15, 23, 42, 0.9); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 20px;
          border-radius: 12px; color: white; display: flex; align-items: center; gap: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          animation: toastIn 0.3s ease-out;
        }
        .interactive-notification {
          border-left: 4px solid var(--accent-purple);
          min-width: 300px;
        }
        @keyframes toastIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .notification-backdrop {
          position: fixed; inset: 0; z-index: 9990;
        }
        .notification-center {
          position: fixed; top: 80px; right: 24px; width: 380px; max-height: 500px;
          z-index: 9991; display: flex; flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
          animation: slideDown 0.2s ease-out;
        }
        .notification-header {
          padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex; justify-content: space-between; align-items: center;
        }
        .notification-header h3 { margin: 0; font-size: 16px; }
        .notification-list { flex: 1; overflow-y: auto; }
        .notification-item {
          padding: 16px 20px; display: flex; gap: 16px; cursor: pointer;
          transition: all 0.2s; border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative;
        }
        .notification-item:hover { background: rgba(255,255,255,0.05); }
        .notification-item.unread { background: rgba(var(--primary-rgb), 0.05); }
        .notif-icon-box { margin-top: 2px; }
        .notif-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
        .notif-msg { font-size: 13px; color: var(--text-muted); line-height: 1.4; }
        .notif-time { font-size: 11px; color: var(--text-muted); margin-top: 8px; }
        .unread-dot {
          position: absolute; top: 16px; right: 20px; width: 8px; height: 8px;
          background: var(--accent-purple); border-radius: 50%;
        }
        .empty-notifications {
          padding: 40px; text-align: center; color: var(--text-muted);
        }
        .text-btn {
          background: none; border: none; color: var(--accent-purple);
          font-size: 13px; font-weight: 500; cursor: pointer;
        }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .notif-detail-modal {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 90%; max-width: 500px; z-index: 10001;
          animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          background: #0f172a; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; overflow: hidden;
        }
        @keyframes modalIn { from { opacity: 0; transform: translate(-50%, -40%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        .notif-detail-header {
          padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center;
        }
        .notif-detail-content { padding: 24px; }
        .close-notif-btn {
          background: rgba(255,255,255,0.05); border: none; color: var(--text-muted);
          width: 32px; height: 32px; border-radius: 8px; display: flex; 
          align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s;
        }
        .close-notif-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; transform: rotate(90deg); }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
export const useToast = () => {
  const ctx = useContext(NotificationContext);
  return { addToast: ctx.addToast };
};
