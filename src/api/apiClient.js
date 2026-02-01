import axios from 'axios';
import { API_URL, DEFAULT_CONFIG } from './config';


const apiClient = axios.create({
  baseURL: API_URL,
  ...DEFAULT_CONFIG,
});


apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug: Log FormData requests
    if (config.data instanceof FormData) {
      console.log('Sending FormData:', {
        url: config.url,
        method: config.method,
        hasAvatar: config.data.has('avatar'),
        contentType: config.headers['Content-Type'],
      });
      
      // Ensure Content-Type is not set for FormData (axios will set it with boundary)
      if (config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response) => {
    
    return response.data;
  },
  (error) => {
    
    const errorResponse = {
      message: 'An error occurred',
      errors: null,
      response: error.response,
      status: error.response?.status,
    };

    if (error.response) {
      const { data, status } = error.response;
      
      
      switch (status) {
        case 401:
          
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          
          const currentPath = window.location.pathname;
          if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/';
          }
          errorResponse.message = data?.message || 'Unauthorized. Please login again.';
          break;
        case 403:
          
          errorResponse.message = data?.message || 'Access denied';
          if (import.meta.env.DEV) {
            console.error('Access denied:', data);
          }
          break;
        case 404:
          
          errorResponse.message = data?.message || 'Resource not found';
          break;
        case 422:
          
          errorResponse.message = data?.message || 'Validation failed';
          errorResponse.errors = data?.errors || data;
          if (import.meta.env.DEV) {
            console.error('Validation failed:', data?.errors || data);
          }
          break;
        case 500:
          
          errorResponse.message = data?.message || 'Internal server error';
          if (import.meta.env.DEV) {
            console.error('Server error:', data);
          }
          break;
        default:
          errorResponse.message = data?.message || `Error: ${status}`;
      }
      
      
      return Promise.reject(errorResponse);
    }
    
    
    errorResponse.message = error.message || 'Network error. Please check your connection.';
    return Promise.reject(errorResponse);
  }
);


export const api = {
  
  get: (url, config = {}) => {
    // If second arg is { params: {...} } (query params), pass as-is. Else treat as query params object.
    const axiosConfig = config && typeof config === 'object' && !Array.isArray(config) && 'params' in config
      ? config
      : { params: config };
    return apiClient.get(url, axiosConfig);
  },

  
  post: (url, data, config = {}) => {
    // Handle FormData for file uploads
    if (data instanceof FormData) {
      return apiClient.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
          // Don't set Content-Type - axios will set it automatically with boundary
        },
      });
    }
    return apiClient.post(url, data, config);
  },

  
  put: (url, data, config = {}) => {
    // Handle FormData for file uploads
    // Laravel sometimes has issues with PUT + FormData, so use POST with _method=PUT
    if (data instanceof FormData) {
      // IMPORTANT: Add _method=PUT BEFORE appending files (Laravel requirement)
      // Check if _method already exists to avoid duplicates
      if (!data.has('_method')) {
        data.append('_method', 'PUT');
      }
      
      // Debug: Verify FormData has avatar
      console.log('PUT with FormData - has avatar:', data.has('avatar'));
      
      // Use POST instead of PUT for FormData (Laravel will handle _method)
      return apiClient.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
          // Explicitly remove Content-Type to let axios set it with boundary
        },
        // Ensure axios processes FormData correctly
        transformRequest: [(data) => data], // Don't transform FormData
      });
    }
    return apiClient.put(url, data, config);
  },

  
  patch: (url, data) => {
    return apiClient.patch(url, data);
  },

  
  delete: (url) => {
    return apiClient.delete(url);
  },

  
  upload: (url, formData) => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default apiClient;

