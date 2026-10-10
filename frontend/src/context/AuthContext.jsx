import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { tokenStorage } from '../utils/tokenStorage';
import { SESSION_EXPIRED_EVENT } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.getToken());
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [sessionMessage, setSessionMessage] = useState(null);

  // Synchronize storage and listen for 401 session expiry events
  useEffect(() => {
    const handleSessionExpired = (event) => {
      setToken(null);
      setUser(null);
      setSessionMessage(event.detail?.message || 'Your session has expired. Please log in again.');
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError(null);
    setSessionMessage(null);
    try {
      const response = await authApi.login({ email, password });
      const authToken = response.token;
      const expiresIn = response.expiresIn || 900;
      const userInfo = { email };

      tokenStorage.setToken(authToken, expiresIn, userInfo);
      setToken(authToken);
      setUser(userInfo);
      return response;
    } catch (err) {
      const message = err.userMessage || 'Login failed. Please check your credentials.';
      setAuthError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setAuthError(null);
    setSessionMessage(null);
    try {
      const response = await authApi.register({ name, email, password });
      let authToken = response.token;
      let expiresIn = response.expiresIn || 900;

      // Backend AuthService returns null token on registration; auto-login to acquire JWT
      if (!authToken) {
        const loginResp = await authApi.login({ email, password });
        authToken = loginResp.token;
        expiresIn = loginResp.expiresIn || 900;
      }

      const userInfo = { name, email };
      tokenStorage.setToken(authToken, expiresIn, userInfo);
      setToken(authToken);
      setUser(userInfo);
      return response;
    } catch (err) {
      const message = err.userMessage || 'Registration failed. Please check your input.';
      setAuthError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setAuthError(null);
    setSessionMessage(null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const clearSessionMessage = useCallback(() => {
    setSessionMessage(null);
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    loading,
    authError,
    sessionMessage,
    login,
    register,
    logout,
    clearAuthError,
    clearSessionMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
