import axios from 'axios';
import { API_URL, DEFAULT_CONFIG } from './config';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  ...DEFAULT_CONFIG,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Return data from success envelope
    return response.data;
  },
  (error) => {
    // Create a structured error object
    const errorResponse = {
      message: 'An error occurred',
      errors: null,
      response: error.response,
      status: error.response?.status,
    };

    if (error.response) {
      const { data, status } = error.response;
      
      // Handle specific error codes
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to landing page
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          // Don't redirect if already on landing page or auth pages
          const currentPath = window.location.pathname;
          if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/';
          }
          errorResponse.message = data?.message || 'Unauthorized. Please login again.';
          break;
        case 403:
          // Forbidden
          errorResponse.message = data?.message || 'Access denied';
          if (import.meta.env.DEV) {
            console.error('Access denied:', data);
          }
          break;
        case 404:
          // Not found
          errorResponse.message = data?.message || 'Resource not found';
          break;
        case 422:
          // Validation error
          errorResponse.message = data?.message || 'Validation failed';
          errorResponse.errors = data?.errors || data;
          if (import.meta.env.DEV) {
            console.error('Validation failed:', data?.errors || data);
          }
          break;
        case 500:
          // Server error
          errorResponse.message = data?.message || 'Internal server error';
          if (import.meta.env.DEV) {
            console.error('Server error:', data);
          }
          break;
        default:
          errorResponse.message = data?.message || `Error: ${status}`;
      }
      
      // Return structured error
      return Promise.reject(errorResponse);
    }
    
    // Network error or no response
    errorResponse.message = error.message || 'Network error. Please check your connection.';
    return Promise.reject(errorResponse);
  }
);

// API Methods
export const api = {
  // GET request
  get: (url, params = {}) => {
    return apiClient.get(url, { params });
  },

  // POST request
  post: (url, data, config = {}) => {
    // If data is FormData, let browser set Content-Type with boundary automatically
    if (data instanceof FormData) {
      return apiClient.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
          // Don't set Content-Type - browser will set it with boundary
        },
      });
    }
    return apiClient.post(url, data, config);
  },

  // PUT request
  put: (url, data, config = {}) => {
    // If data is FormData, let browser set Content-Type with boundary automatically
    if (data instanceof FormData) {
      return apiClient.put(url, data, {
        ...config,
        headers: {
          ...config.headers,
          // Don't set Content-Type - browser will set it with boundary
        },
      });
    }
    return apiClient.put(url, data, config);
  },

  // PATCH request
  patch: (url, data) => {
    return apiClient.patch(url, data);
  },

  // DELETE request
  delete: (url) => {
    return apiClient.delete(url);
  },

  // Upload file (multipart/form-data)
  upload: (url, formData) => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default apiClient;

