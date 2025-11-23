import { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/apiClient';
import AuthContext from './AuthContext.js';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('coachpay:user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('coachpay:token'));

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('coachpay:token', token);
    } else {
      delete apiClient.defaults.headers.common.Authorization;
      localStorage.removeItem('coachpay:token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('coachpay:user', JSON.stringify(user));
    } else {
      localStorage.removeItem('coachpay:user');
    }
  }, [user]);

  const login = async (credentials) => {
    const attempt = async (endpoint) => {
      try {
        const { data } = await apiClient.post(endpoint, credentials);
        const authenticatedUser = data.admin || data.coach;
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

    const adminRole = await attempt('/auth/admin/login');
    if (adminRole) {
      return adminRole;
    }

    const coachRole = await attempt('/auth/coach/login');
    if (coachRole) {
      return coachRole;
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

