import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  apiUrl,
  requestJson,
} from '../services/api';

const AuthContext = createContext(null);

function saveAuthToStorage({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    clearAuthStorage();
  }, []);

  const fetchMe = useCallback(async (accessToken) => {
    const data = await requestJson('/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return data.user;
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error('Không có refresh token');
    }

    const data = await requestJson('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    saveAuthToStorage(data);
    setUser(data.user);

    return data.user;
  }, []);

  const reloadMe = useCallback(async () => {
    let accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!accessToken) {
      const refreshedUser = await refreshSession();
      return refreshedUser;
    }

    try {
      const me = await fetchMe(accessToken);
      setUser(me);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
      return me;
    } catch (error) {
      const refreshedUser = await refreshSession();
      return refreshedUser;
    }
  }, [fetchMe, refreshSession]);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (!accessToken && !refreshToken) {
          if (mounted) setAuthLoading(false);
          return;
        }

        if (accessToken) {
          try {
            const me = await fetchMe(accessToken);
            if (!mounted) return;

            setUser(me);
            localStorage.setItem(USER_KEY, JSON.stringify(me));
            setAuthLoading(false);
            return;
          } catch {
            // fallback refresh ở dưới
          }
        }

        if (refreshToken) {
          const me = await refreshSession();
          if (!mounted) return;

          setUser(me);
          localStorage.setItem(USER_KEY, JSON.stringify(me));
        }
      } catch (error) {
        if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [clearSession, fetchMe, refreshSession]);

  const login = useCallback(async (identifier, password) => {
    try {
      const data = await requestJson('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      saveAuthToStorage(data);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const data = await requestJson('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      saveAuthToStorage(data);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(apiUrl('/auth/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error(error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        authLoading,
        login,
        register,
        logout,
        refreshSession,
        reloadMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
