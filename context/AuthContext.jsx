'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('siae_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('siae_token', token);
  else localStorage.removeItem('siae_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.detail || 'Request failed');
    err.response = { data: body, status: res.status };
    throw err;
  }
  return { data: body };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  async function refresh() {
    const token = getToken();
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const { data } = await apiFetch('/api/auth/me');
      setUser(data);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function login(email, password) {
    const { data } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    await refresh();
    return data;
  }

  async function register(payload) {
    const { data } = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.access_token);
    await refresh();
    return data;
  }

  function logout() { setToken(null); setUser(null); }

  function flash(type, message) {
    if (!message) { setNotice(null); return; }
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 4200);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, notice, flash }),
    [user, loading, notice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
