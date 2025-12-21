import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const authService = {
  // Login
  async login(email, password) {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
    
    // Save token to localStorage
    if (response.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Register
  async register(data) {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, data);
    
    // Save token to localStorage
    if (response.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Logout
  async logout() {
    await api.post(ENDPOINTS.AUTH.LOGOUT);
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Get current user
  async me() {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    
    // Update user in localStorage
    if (response.success && response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Refresh token
  async refresh() {
    const response = await api.post(ENDPOINTS.AUTH.REFRESH);
    
    // Update token in localStorage
    if (response.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored user
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get stored token
  getToken() {
    return localStorage.getItem('auth_token');
  },

  // Change password
  async changePassword(currentPassword, newPassword, confirmPassword) {
    return await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    });
  },

  // Forgot password
  async forgotPassword(email) {
    return await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  // Reset password
  async resetPassword(email, token, password, passwordConfirmation) {
    return await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  },
};

