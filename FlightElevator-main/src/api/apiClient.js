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
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access denied');
          break;
        case 422:
          // Validation error
          console.error('Validation failed:', error.response.data.errors);
          break;
        case 500:
          // Server error
          console.error('Server error');
          break;
      }
      
      // Return error from error envelope
      return Promise.reject(error.response.data.errors || error.response.data);
    }
    
    return Promise.reject(error);
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
    // If data is FormData, don't set Content-Type (browser will set it with boundary)
    if (data instanceof FormData) {
      return apiClient.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return apiClient.post(url, data, config);
  },

  // PUT request
  put: (url, data, config = {}) => {
    // If data is FormData, don't set Content-Type (browser will set it with boundary)
    if (data instanceof FormData) {
      return apiClient.put(url, data, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
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

