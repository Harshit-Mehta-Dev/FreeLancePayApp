import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const THEMES = [
  { id: 'purple', label: 'Purple', primary: '#8b5cf6', dark: '#6d28d9', light: '#c4b5fd', rgb: '139,92,246' },
  { id: 'cyan', label: 'Cyan', primary: '#06b6d4', dark: '#0891b2', light: '#67e8f9', rgb: '6,182,212' },
  { id: 'pink', label: 'Pink', primary: '#ec4899', dark: '#db2777', light: '#f9a8d4', rgb: '236,72,153' },
  { id: 'green', label: 'Green', primary: '#10b981', dark: '#059669', light: '#6ee7b7', rgb: '16,185,129' },
  { id: 'orange', label: 'Orange', primary: '#f59e0b', dark: '#d97706', light: '#fcd34d', rgb: '245,158,11' },
  { id: 'blue', label: 'Blue', primary: '#3b82f6', dark: '#2563eb', light: '#93c5fd', rgb: '59,130,246' },
  { id: 'rose', label: 'Rose', primary: '#f43f5e', dark: '#e11d48', light: '#fda4af', rgb: '244,63,94' },
  { id: 'cyber', label: 'Cyber', primary: '#a855f7', dark: '#7e22ce', light: '#d8b4fe', rgb: '168,85,247', special: 'cyber' },
  { id: 'rgb', label: 'RGB Mode', primary: '#ff0000', dark: '#800000', light: '#ffaaaa', rgb: '255,0,0', special: 'rgb' },
];

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('fp_theme') || 'dark');
  const [colorThemeId, setColorThemeId] = useState(() => localStorage.getItem('fp_color') || 'purple');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }

    // Special Themes
    document.documentElement.classList.remove('cyber-mode', 'rgb-mode');
    if (colorThemeId === 'cyber') document.documentElement.classList.add('cyber-mode');
    if (colorThemeId === 'rgb') document.documentElement.classList.add('rgb-mode');

    if (user) {
      localStorage.setItem('fp_theme', theme);
      localStorage.setItem('fp_color', colorThemeId);
    }
  }, [theme, colorThemeId, user]);

  useEffect(() => {
    if (!user) {
      document.documentElement.classList.remove('light-mode');
    }
  }, [user]);

  const toggleTheme = () => {
    if (!user) return;
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const activeColorTheme = THEMES.find(t => t.id === colorThemeId) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', colorThemeId, setColorThemeId, activeColorTheme }}>
      <style>{`
        :root {
          --primary: ${activeColorTheme.primary};
          --primary-dark: ${activeColorTheme.dark};
          --primary-light: ${activeColorTheme.light};
          --primary-rgb: ${activeColorTheme.rgb};
          
          /* Override hardcoded gradients in CSS */
          --gradient-purple: linear-gradient(135deg, var(--primary), var(--primary-dark));
          --accent-purple: var(--primary);
        }

        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }

        .rgb-mode {
          animation: rainbow 5s linear infinite;
        }

        .cyber-mode {
          --bg-primary: #05050a;
          --bg-secondary: #0a0a14;
          --glass: rgba(10, 10, 20, 0.95);
          --glass-border: rgba(var(--primary-rgb), 0.3);
          --text-muted: #8888aa;
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
