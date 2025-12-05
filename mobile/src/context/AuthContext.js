import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from storage on mount (optimized for fast startup)
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        // Use multiGet for faster parallel reads
        const items = await AsyncStorage.multiGet(['sportdue:user', 'sportdue:token']);
        const storedUser = items[0][1];
        const storedToken = items[1][1];

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (parseError) {
            // Invalid JSON, clear it
            await AsyncStorage.removeItem('sportdue:user');
          }
        }
        if (storedToken) {
          setToken(storedToken);
          apiClient.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        // Set loading to false immediately after reading storage
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  useEffect(() => {
    const updateToken = async () => {
      if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        await AsyncStorage.setItem('sportdue:token', token);
      } else {
        // Clear token from API client defaults
        delete apiClient.defaults.headers.common.Authorization;
        // Also clear from common headers
        if (apiClient.defaults.headers) {
          delete apiClient.defaults.headers.Authorization;
        }
        await AsyncStorage.removeItem('sportdue:token');
      }
    };
    updateToken();
  }, [token]);

  useEffect(() => {
    const updateUser = async () => {
      if (user) {
        await AsyncStorage.setItem('sportdue:user', JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem('sportdue:user');
      }
    };
    updateUser();
  }, [user]);

  const login = async (credentials, role = null) => {
    const attempt = async (endpoint) => {
      try {
        const { data } = await apiClient.post(endpoint, credentials);
        const authenticatedUser = data.admin || data.coach || data.player;
        setUser(authenticatedUser);
        setToken(data.token);
        return authenticatedUser.role;
      } catch (err) {
        if (err.response?.status && err.response.status !== 401) {
          throw err;
        }
        return null;
      }
    };

    // If role is specified, only try that role's endpoint
    if (role === 'admin') {
      const adminRole = await attempt('/auth/admin/login');
      if (adminRole) return adminRole;
      throw new Error('Invalid credentials');
    }

    if (role === 'coach') {
      const coachRole = await attempt('/auth/coach/login');
      if (coachRole) return coachRole;
      throw new Error('Invalid credentials');
    }

    if (role === 'player') {
      const playerRole = await attempt('/auth/player/login');
      if (playerRole) return playerRole;
      throw new Error('Invalid credentials');
    }

    // Otherwise, try all roles (admin, coach, player)
    const adminRole = await attempt('/auth/admin/login');
    if (adminRole) return adminRole;

    const coachRole = await attempt('/auth/coach/login');
    if (coachRole) return coachRole;

    const playerRole = await attempt('/auth/player/login');
    if (playerRole) return playerRole;

    throw new Error('Invalid credentials');
  };

  const logout = async () => {
    try {
      // Clear token from API client first
      delete apiClient.defaults.headers.common.Authorization;
      if (apiClient.defaults.headers) {
        delete apiClient.defaults.headers.Authorization;
      }
      
      // Clear from storage
      await AsyncStorage.multiRemove(['sportdue:token', 'sportdue:user']);
      
      // Clear state
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear state even if storage fails
      setUser(null);
      setToken(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
      role: user?.role,
      updateUser: setUser,
      loading,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;


