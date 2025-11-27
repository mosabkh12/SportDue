import { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/apiClient';
import AuthContext from './AuthContext.js';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('sportdue:user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sportdue:token'));

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('sportdue:token', token);
    } else {
      delete apiClient.defaults.headers.common.Authorization;
      localStorage.removeItem('sportdue:token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('sportdue:user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sportdue:user');
    }
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
    if (adminRole) {
      return adminRole;
    }

    const coachRole = await attempt('/auth/coach/login');
    if (coachRole) {
      return coachRole;
    }

    const playerRole = await attempt('/auth/player/login');
    if (playerRole) {
      return playerRole;
    }

    throw new Error('Invalid credentials');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
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
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
export { AuthProvider };

