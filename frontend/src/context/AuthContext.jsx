import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  async function refresh() {
    const token = localStorage.getItem("siae_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    setToken(data.access_token);
    await refresh();
    return data;
  }

  async function register(payload) {
    const { data } = await api.post("/api/auth/register", payload);
    setToken(data.access_token);
    await refresh();
    return data;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function flash(type, message) {
    if (!message) {
      setNotice(null);
      return;
    }
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
