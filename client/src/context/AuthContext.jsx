import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../api/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    console.log('🔍 Auth: Fetching current user from:', API);
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      console.log('✅ Auth: User session found:', data.name);
      setUser(data);
    } catch (err) {
      console.warn('ℹ️ Auth: No active session or error:', err.message);
      setUser(null);
    } finally {
      console.log('🏁 Auth: Initialization complete.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await fetchMe();
      if (!isMounted) return;
    };
    init();
    return () => { isMounted = false; };
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, currency) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password, currency });
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch {
      // ignore errors on logout
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
