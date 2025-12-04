import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerIP, subscribeToNetworkChanges, startNetworkMonitoring } from '../utils/networkDetector';

let baseURL = 'http://localhost:5000/api';
const PORT = 5000;
let currentServerIP = null;

// Create axios instance
const apiClient = axios.create({
  baseURL,
  timeout: 10000,
});

// Initialize base URL
const initializeBaseURL = async () => {
  try {
    const serverIP = await getServerIP();
    currentServerIP = serverIP;
    baseURL = `http://${serverIP}:${PORT}/api`;
    apiClient.defaults.baseURL = baseURL;
    
    // Start monitoring network changes
    startNetworkMonitoring();
    
    // Subscribe to IP changes and update base URL (silently)
    subscribeToNetworkChanges((newIP) => {
      if (newIP && newIP !== currentServerIP) {
        currentServerIP = newIP;
        const newBaseURL = `http://${newIP}:${PORT}/api`;
        baseURL = newBaseURL;
        apiClient.defaults.baseURL = newBaseURL;
      }
    });
  } catch (error) {
    // Silent error
  }
};

// Initialize immediately
initializeBaseURL();

// Request interceptor to add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Only add token if it exists and request doesn't already have one
      if (!config.headers.Authorization) {
        const token = await AsyncStorage.getItem('sportdue:token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Explicitly remove Authorization header if no token
          delete config.headers.Authorization;
        }
      }
    } catch (error) {
      // If error reading token, remove authorization header
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message;

    // Handle 401 (Unauthorized) errors gracefully
    if (status === 401) {
      try {
        // Clear invalid token from storage
        await AsyncStorage.removeItem('sportdue:token');
        await AsyncStorage.removeItem('sportdue:user');
        
        // Clear token from API client defaults
        delete apiClient.defaults.headers.common.Authorization;
        if (apiClient.defaults.headers) {
          delete apiClient.defaults.headers.Authorization;
        }
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      // Create a special error that can be identified by pages
      const authError = new Error(message);
      authError.isAuthError = true;
      authError.status = 401;
      return Promise.reject(authError);
    }

    // Handle network errors - try to reconnect with new IP (only once per request)
    if ((error.code === 'ECONNREFUSED' || error.message.includes('Network request failed') || error.code === 'ERR_NETWORK') && !error.config._retry) {
      try {
        const { getServerIP } = require('../utils/networkDetector');
        const newIP = await getServerIP(true); // Silent mode
        if (newIP && newIP !== currentServerIP) {
          currentServerIP = newIP;
          const newBaseURL = `http://${newIP}:${PORT}/api`;
          baseURL = newBaseURL;
          apiClient.defaults.baseURL = newBaseURL;
          // Mark request to prevent infinite retry loop
          error.config._retry = true;
          // Retry the original request with new URL
          return apiClient.request(error.config);
        }
      } catch (reconnectError) {
        // Silent error
      }
    }

    // For other errors, return the error message
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
