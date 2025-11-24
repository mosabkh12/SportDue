import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request interceptor to add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('coachpay:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message;

    // Handle 401 (Unauthorized) errors gracefully - don't show disruptive errors
    if (status === 401) {
      // Create a special error that can be identified by pages
      const authError = new Error(message);
      authError.isAuthError = true;
      authError.status = 401;
      
      // Only redirect if we're not already on the login page
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) {
        // Clear invalid token
        localStorage.removeItem('coachpay:token');
        localStorage.removeItem('coachpay:user');
        // Silently redirect to login (use setTimeout to avoid interrupting hot reload)
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 100);
      }
      return Promise.reject(authError);
    }

    // For other errors, return the error message
    return Promise.reject(new Error(message));
  }
);

export default apiClient;



