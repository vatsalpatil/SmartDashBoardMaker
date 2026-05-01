/**
 * AuthContext – provides user state, login, signup, logout to the whole app.
 * Tokens are stored in localStorage (access_token + refresh_token).
 * On mount it validates the stored token by calling /auth/me.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { authApi } from './auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef       = useRef(null);

  // ── Token helpers ─────────────────────────────────────────────────────────
  const saveTokens = (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  };

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  };

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password, rememberMe = false }) => {
    const res = await authApi.login({ email, password, rememberMe });
    saveTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    return res.user;
  }, []);

  const signup = useCallback(async ({ username, email, password, fullName }) => {
    const res = await authApi.signup({ username, email, password, fullName });
    saveTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
