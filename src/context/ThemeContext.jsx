import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const THEMES = [
  { id: 'slate-khaki', label: 'Slate Khaki', primary: '#C5A059', dark: '#1e1a11', light: '#fdfcf0', rgb: '197,160,89', class: 'theme-slate-khaki' },
  { id: 'wattle-green', label: 'Wattle Green', primary: '#9DBF4A', dark: '#151e0a', light: '#f9fbf0', rgb: '157,191,74', class: 'theme-wattle-green' },
  { id: 'murrey-alabaster', label: 'Murrey Alabaster', primary: '#7B1F4A', dark: '#1e0a13', light: '#fcf0f5', rgb: '123,31,74', class: 'theme-murrey-alabaster' },
  { id: 'latte-mint', label: 'Latte Mint', primary: '#6BB5A6', dark: '#0a1e1a', light: '#f0fbf9', rgb: '107,181,166', class: 'theme-latte-mint' },
  { id: 'caramel-raisin', label: 'Caramel Raisin', primary: '#B36D3E', dark: '#1e110a', light: '#fbf5f0', rgb: '179,109,62', class: 'theme-caramel-raisin' },
  { id: 'purple', label: 'Purple', primary: '#8b5cf6', dark: '#1e1b4b', light: '#f5f3ff', rgb: '139,92,246' },
  { id: 'cyan', label: 'Cyan', primary: '#06b6d4', dark: '#083344', light: '#ecfeff', rgb: '6,182,212' },
  { id: 'pink', label: 'Pink', primary: '#ec4899', dark: '#500724', light: '#fdf2f8', rgb: '236,72,153' },
  { id: 'green', label: 'Green', primary: '#10b981', dark: '#064e3b', light: '#f0fdf4', rgb: '16,185,129' },
  { id: 'orange', label: 'Orange', primary: '#f59e0b', dark: '#451a03', light: '#fffbeb', rgb: '245,158,11' },
  { id: 'blue', label: 'Blue', primary: '#3b82f6', dark: '#172554', light: '#eff6ff', rgb: '59,130,246' },
  { id: 'rose', label: 'Rose', primary: '#f43f5e', dark: '#4c0519', light: '#fff1f2', rgb: '244,63,94' },
  { id: 'cyber', label: 'Cyber', primary: '#a855f7', dark: '#2e1065', light: '#faf5ff', rgb: '168,85,247', special: 'cyber' },
  { id: 'rgb', label: 'RGB Mode', primary: '#ff0000', dark: '#450a0a', light: '#fef2f2', rgb: '255,0,0', special: 'rgb' },
];

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('fp_theme') || 'dark');
  const [colorThemeId, setColorThemeId] = useState(() => localStorage.getItem('fp_color') || 'slate-khaki');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark', 'dark-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark', 'dark-mode');
    }

    // Clear all theme classes first
    THEMES.forEach(t => {
      if (t.class) document.documentElement.classList.remove(t.class);
    });
    
    // Add active theme class
    const activeTheme = THEMES.find(t => t.id === colorThemeId);
    if (activeTheme && activeTheme.class) {
      document.documentElement.classList.add(activeTheme.class);
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
          --primary-rgb: ${activeColorTheme.rgb};
          --theme-dark: ${activeColorTheme.dark};
          --theme-light: ${activeColorTheme.light};
          
          /* Sync Aurora to active theme colors */
          --aurora-1: ${activeColorTheme.primary}44;
          --aurora-2: ${activeColorTheme.dark};
          --aurora-3: ${activeColorTheme.primary}22;
          --aurora-4: ${activeColorTheme.dark}88;
          --aurora-5: ${activeColorTheme.primary}66;
        }

        html.light-mode {
          --primary: ${activeColorTheme.primary};
          --bg-primary: ${activeColorTheme.light};
          --bg-secondary: #ffffff;
          --text-primary: #1a1a1a;
          --text-secondary: #4a4a4a;
          --glass-border: rgba(${activeColorTheme.rgb}, 0.15);
          
          /* Sync Aurora for Light Mode */
          --aurora-1: ${activeColorTheme.primary}22;
          --aurora-2: #ffffff;
          --aurora-3: ${activeColorTheme.primary}11;
          --aurora-4: #f8fafc;
          --aurora-5: #ffffff;
        }

        .dark-mode {
          --bg-primary: ${activeColorTheme.dark};
          --bg-secondary: ${activeColorTheme.dark}cc;
          --text-primary: #ffffff;
          --text-secondary: #cbd5e1;
          --glass-border: rgba(${activeColorTheme.rgb}, 0.2);
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
