import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const authService = {
  
  async login(email, password) {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
    
    
    if (response.success && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  
  async register(data) {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, data);
    
    
    if (response.success && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  
  async logout() {
    await api.post(ENDPOINTS.AUTH.LOGOUT);
    
    
    localStorage.removeItem('user');
  },

  
  async me() {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    
    
    if (response.success && response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  },

  
  async refresh() {
    const response = await api.post(ENDPOINTS.AUTH.REFRESH);
    
    
    // The cookie is updated via the response headers, no local action needed
    
    return response;
  },

  
  isAuthenticated() {
    return !!localStorage.getItem('user');
  },

  
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  
  getToken() {
    return null; // Token is now managed securely via HttpOnly cookie
  },

  
  async changePassword(currentPassword, newPassword, confirmPassword) {
    return await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    });
  },

  
  async forgotPassword(email) {
    return await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  
  async resetPassword(email, token, password, passwordConfirmation) {
    return await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  },

  async switchOrganization(orgId) {
    const response = await api.post(ENDPOINTS.AUTH.SWITCH_ORGANIZATION, { org_id: orgId });
    if (response.success && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },
};

