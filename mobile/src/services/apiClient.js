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

// Initialize base URL (optimized for fast startup)
const initializeBaseURL = async () => {
  try {
    // Try to get cached IP first (fast path)
    const { getCurrentIP } = require('../utils/networkDetector');
    const cachedIP = getCurrentIP();
    
    if (cachedIP && cachedIP !== 'localhost') {
      // Use cached IP immediately for fast startup
      currentServerIP = cachedIP;
      baseURL = `http://${cachedIP}:${PORT}/api`;
      apiClient.defaults.baseURL = baseURL;
      console.log(`⚡ [API Client] Using cached IP: ${cachedIP}:${PORT} (fast startup)`);
    } else {
      // Fallback to localhost for immediate availability
      baseURL = `http://localhost:${PORT}/api`;
      apiClient.defaults.baseURL = baseURL;
      console.log(`⚡ [API Client] Using localhost fallback (fast startup)`);
    }
    
    // Start monitoring network changes in background (non-blocking)
    startNetworkMonitoring();
    
    // Subscribe to IP changes and update base URL
    subscribeToNetworkChanges((newIP) => {
      if (newIP && newIP !== currentServerIP) {
        console.log(`\n🔄 [API Client] Updating API base URL`);
        console.log(`   Old IP: ${currentServerIP || 'none'}`);
        console.log(`   New IP: ${newIP}:${PORT}`);
        currentServerIP = newIP;
        const newBaseURL = `http://${newIP}:${PORT}/api`;
        baseURL = newBaseURL;
        apiClient.defaults.baseURL = newBaseURL;
        console.log(`✅ [API Client] Base URL updated: ${newBaseURL}\n`);
      }
    });
    
    // Detect IP in background (non-blocking, will update when found)
    getServerIP(true).then((detectedIP) => {
      if (detectedIP && detectedIP !== currentServerIP && detectedIP !== 'localhost') {
        currentServerIP = detectedIP;
        baseURL = `http://${detectedIP}:${PORT}/api`;
        apiClient.defaults.baseURL = baseURL;
        console.log(`✅ [API Client] Background IP detection complete: ${detectedIP}:${PORT}`);
      }
    }).catch(() => {
      // Silent error
    });
  } catch (error) {
    // Silent error - use localhost fallback
    baseURL = `http://localhost:${PORT}/api`;
    apiClient.defaults.baseURL = baseURL;
  }
};

// Initialize immediately (non-blocking)
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
    if ((error.code === 'ECONNREFUSED' || error.message.includes('Network request failed') || error.code === 'ERR_NETWORK' || error.code === 'ETIMEDOUT') && !error.config._retry) {
      try {
        // First, try to get the latest IP from network detector (might have changed)
        const { getServerIP } = require('../utils/networkDetector');
        console.log(`\n⚠️ [API Client] Network error detected, detecting new IP...`);
        const newIP = await getServerIP(false, true); // Show logs, force refresh
        
        if (newIP && newIP !== currentServerIP) {
          console.log(`🔄 [API Client] Updating IP due to network error: ${currentServerIP} -> ${newIP}`);
          currentServerIP = newIP;
          const newBaseURL = `http://${newIP}:${PORT}/api`;
          baseURL = newBaseURL;
          apiClient.defaults.baseURL = newBaseURL;
          console.log(`✅ [API Client] Retrying request with new IP: ${newBaseURL}\n`);
        }
        
        // Mark request to prevent infinite retry loop
        error.config._retry = true;
        // Update the URL in the config to use new base URL
        if (error.config.url) {
          error.config.url = error.config.url.replace(/^https?:\/\/[^\/]+/, '');
        }
        // Retry the original request with new URL
        return apiClient.request(error.config);
      } catch (reconnectError) {
        // Silent error - network might be down
      }
    }

    // For other errors, return the error message
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
