import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create API instance with useMemo to prevent unnecessary recreations
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://192.168.1.113/api',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    // Add response interceptor to handle 401s
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token is invalid - logout
          localStorage.removeItem('auth_token');
          setToken(null);
          setCurrentUser(null);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [token]);

  // Verify token on mount or token change
  useEffect(() => {
    let mounted = true;

    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.post('/auth.php?action=verify');
        if (mounted && response.data?.user) {
          setCurrentUser(response.data.user);
        }
      } catch (err) {
        console.error('Token validation error:', err);
        if (mounted) {
          logout();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    verifyToken();
    return () => {
      mounted = false;
    };
  }, [token, api]);

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await api.post('/auth.php?action=login', {
        username,
        password
      });
      
      const { token: newToken, user } = response.data;
      
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setCurrentUser(user);
      
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Errore durante il login';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth.php?action=logout', { token });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setCurrentUser(null);
    }
  };

  const getAuthenticatedApi = () => api;

  const isAdmin = () => currentUser?.role_name === 'admin';
  const hasRole = (roleName) => currentUser?.role_name === roleName;

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    isAdmin,
    hasRole,
    getAuthenticatedApi
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};