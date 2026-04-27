import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookMarked, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Timer, 
  LogOut,
  Moon,
  Sun,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Subjects', icon: BookMarked, path: '/subjects' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'Exams', icon: AlertCircle, path: '/exams' },
    { name: 'Calendar', icon: CalendarIcon, path: '/calendar' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon glass">
          <BookOpen size={24} className="text-primary" />
        </div>
        <span className="brand-name">SmartStudy</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-details">
            <p className="user-name">{user?.name}</p>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>

        <button onClick={toggleTheme} className="theme-toggle glass">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <button onClick={logout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      <style>{`
        .sidebar-header {
          padding: 2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .brand-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text-main);
        }
        .sidebar-nav {
          flex: 1;
          padding: 0 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.2s;
        }
        .nav-item:hover {
          background-color: var(--bg-main);
          color: var(--text-main);
        }
        .nav-item.active {
          background-color: var(--primary);
          color: white;
        }
        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          background-color: var(--secondary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        .user-details {
          overflow: hidden;
        }
        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .theme-toggle, .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--text-main);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .theme-toggle:hover {
          background-color: var(--bg-main);
        }
        .logout-btn {
          color: #ef4444;
        }
        .logout-btn:hover {
          background-color: #fee2e2;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
