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
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      // Let Axios set the multipart boundary.
      if (config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
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
        case 401: {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');

          const currentPath = window.location.pathname;
          const publicAuthPaths = [
            '/',
            '/login',
            '/register',
            '/forgot-password',
            '/reset-password',
          ];

          if (!publicAuthPaths.includes(currentPath)) {
            window.location.href = '/';
          }

          errorResponse.message =
            data?.message || 'Unauthorized. Please login again.';
          break;
        }

        case 403: {
          errorResponse.message = data?.message || 'Access denied';

          if (data?.subscription_required) {
            let isInstructorOrStudent = false;

            try {
              const storedUser = localStorage.getItem('user');

              if (storedUser) {
                const userObj = JSON.parse(storedUser);
                const roles = userObj.roles || [];

                isInstructorOrStudent = roles.some((role) => {
                  const roleName = (
                    typeof role === 'string' ? role : role?.name || ''
                  ).toLowerCase();

                  return roleName === 'instructor' || roleName === 'student';
                });
              }
            } catch (err) {
              if (import.meta.env.DEV) {
                console.error('Failed to parse user roles in apiClient:', err);
              }
            }

            if (!isInstructorOrStudent) {
              const currentPath = window.location.pathname;

              if (currentPath !== '/subscription') {
                window.location.href = '/subscription';
              }
            }
          }

          if (import.meta.env.DEV) {
            console.error('Access denied:', data);
          }
          break;
        }

        case 404:
          errorResponse.message = data?.message || 'Resource not found';
          break;

        case 422: {
          let msg =
            data?.errors?.message ||
            data?.message ||
            'Validation failed';

          if (
            (msg === 'Validation failed' ||
              msg === 'The given data was invalid.') &&
            data?.errors?.details
          ) {
            const details = data.errors.details;

            if (typeof details === 'string') {
              msg = details;
            } else if (Array.isArray(details) && details.length > 0) {
              msg = details[0];
            } else if (typeof details === 'object' && details !== null) {
              const firstDetail = Object.values(details).flat()[0];

              if (firstDetail) {
                msg = firstDetail;
              }
            }
          }

          errorResponse.message = msg;
          errorResponse.errors = data?.errors || data;

          if (import.meta.env.DEV) {
            console.error('Validation failed:', data?.errors || data);
          }
          break;
        }

        case 500:
          errorResponse.message = data?.message || 'Internal server error';

          if (import.meta.env.DEV) {
            console.error('Server error:', data);
          }
          break;

        default:
          errorResponse.message =
            data?.errors?.message || data?.message || `Error: ${status}`;
      }

      return Promise.reject(errorResponse);
    }

    errorResponse.message =
      error.message || 'Network error. Please check your connection.';

    return Promise.reject(errorResponse);
  }
);

export const api = {
  get: (url, config = {}) => {
    // Accept either Axios config ({ params: ... }) or a plain params object.
    const axiosConfig =
      config &&
      typeof config === 'object' &&
      !Array.isArray(config) &&
      'params' in config
        ? config
        : { params: config };

    return apiClient.get(url, axiosConfig);
  },

  post: (url, data, config = {}) => {
    if (data instanceof FormData) {
      return apiClient.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
        },
      });
    }

    return apiClient.post(url, data, config);
  },

  put: (url, data, config = {}) => {
    if (data instanceof FormData) {
      if (!data.has('_method')) {
        data.append('_method', 'PUT');
      }

      return apiClient.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
        },
        transformRequest: [(formData) => formData],
      });
    }

    return apiClient.put(url, data, config);
  },

  patch: (url, data) => apiClient.patch(url, data),

  delete: (url) => apiClient.delete(url),

  upload: (url, formData) =>
    apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export default apiClient;

