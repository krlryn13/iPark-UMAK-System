import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate token against backend on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('ipark_user');
    const savedToken = localStorage.getItem('ipark_token');

    if (savedUser && savedToken) {
      // Verify token is still valid by calling /api/auth/me
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            setToken(savedToken);
          } else if (res.status === 401) {
            // Only clear storage on actual 401 Unauthorized / Expired token
            try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
            localStorage.removeItem('ipark_user');
            localStorage.removeItem('ipark_token');
            setCurrentUser(null);
            setToken(null);
          } else {
            // 429 Rate Limit, 500 Server Error, etc. — keep user logged in with local session
            try {
              setCurrentUser(JSON.parse(savedUser));
              setToken(savedToken);
            } catch (e) {}
          }
        })
        .catch(() => {
          // Network offline / fetch failed — keep existing local session instead of logging out
          try {
            setCurrentUser(JSON.parse(savedUser));
            setToken(savedToken);
          } catch (e) {}
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (userData, userToken) => {
    localStorage.setItem('ipark_user', JSON.stringify(userData));
    localStorage.setItem('ipark_token', userToken);
    setCurrentUser(userData);
    setToken(userToken);
  };

  const logoutUser = () => {
    localStorage.removeItem('ipark_user');
    localStorage.removeItem('ipark_token');
    setCurrentUser(null);
    setToken(null);
  };

  /**
   * authFetch — wrapper around fetch() that auto-attaches Authorization header.
   * Use this for all protected API calls instead of raw fetch().
   * 
   * Usage: const res = await authFetch('/api/stickers/user/1');
   *        const res = await authFetch('/api/stickers/apply', { method: 'POST', body: formData });
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const currentToken = localStorage.getItem('ipark_token');
    const headers = { ...options.headers };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers });

    // Auto-logout on 401 (expired token)
    if (res.status === 401) {
      logoutUser();
    }

    return res;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, loading, loginUser, logoutUser, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
