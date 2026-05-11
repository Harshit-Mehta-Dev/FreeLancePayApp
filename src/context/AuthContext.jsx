import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../api/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [cachedAvatar, setCachedAvatar] = useState(localStorage.getItem('fp_avatar'));

  const fetchMe = useCallback(async () => {
    console.log('🔍 Auth: Fetching current user from:', API);
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      console.log('✅ Auth: User session found:', data.name);
      setUser(data);
      if (data.avatar) {
        setCachedAvatar(data.avatar);
        localStorage.setItem('fp_avatar', data.avatar);
      }
      if (data.is_banned) setIsBanned(true);
    } catch (err) {
      if (err.response?.status === 403 && (err.response?.data?.error === 'PERMANENT_BAN' || err.response?.data?.message?.includes('revoked'))) {
        setIsBanned(true);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      setUser(data.user);
      return data;
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error === 'PERMANENT_BAN') {
        setIsBanned(true);
      }
      throw err;
    }
  };

  const register = async (name, email, password, currency) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, { name, email, password, currency });
      setUser(data.user);
      return data;
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error === 'PERMANENT_BAN') {
        setIsBanned(true);
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch { }
    setUser(null);
    setIsBanned(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isBanned, login, register, logout, setUser, cachedAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
