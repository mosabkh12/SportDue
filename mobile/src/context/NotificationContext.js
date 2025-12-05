import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationContainer from '../components/NotificationContainer';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      autoClose: options.autoClose !== false,
      duration: options.duration || 3000,
    };

    setNotifications((prev) => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const success = useCallback((message, options) => {
    return addNotification(message, 'success', options);
  }, [addNotification]);

  const error = useCallback((message, options) => {
    return addNotification(message, 'error', options);
  }, [addNotification]);

  const info = useCallback((message, options) => {
    return addNotification(message, 'info', options);
  }, [addNotification]);

  const warning = useCallback((message, options) => {
    return addNotification(message, 'warning', options);
  }, [addNotification]);

  const value = {
    success,
    error,
    info,
    warning,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
};




