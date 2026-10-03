import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const authService = {
  async login(email, password) {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });

    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  },

  async register(data) {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, data);

    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  },

  async logout() {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
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

    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
    }

    return response;
  },

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    });
  },

  async forgotPassword(email) {
    return api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  async resetPassword(email, token, password, passwordConfirmation) {
    return api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  },

  async switchOrganization(orgId) {
    const response = await api.post(ENDPOINTS.AUTH.SWITCH_ORGANIZATION, {
      org_id: orgId,
    });

    if (response.success && response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  },
};
