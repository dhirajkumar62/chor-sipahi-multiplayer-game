import React, { createContext, useContext, useEffect, useState } from 'react';
import API from '../services/api';
import { getSocket } from '../socket/socket';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!token) { setLoading(false); return; } API.get('/auth/me').then(({ data }) => setCurrentUser(data.user)).catch(() => { localStorage.removeItem('token'); setToken(null); }).finally(() => setLoading(false)); }, [token]);
  const saveSession = ({ token: nextToken, user }) => { localStorage.setItem('token', nextToken); setToken(nextToken); setCurrentUser(user); };
  const login = async (values) => { const { data } = await API.post('/auth/login', values); saveSession(data); return data; };
  const register = async (values) => { const { data } = await API.post('/auth/register', values); saveSession(data); return data; };
  const logout = () => { getSocket()?.disconnect(); localStorage.removeItem('token'); setToken(null); setCurrentUser(null); };
  return <AuthContext.Provider value={{ currentUser, token, loading, isAuthenticated: Boolean(token && currentUser), login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
