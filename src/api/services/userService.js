import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const userService = {
  // Get all users with filters
  async getUsers(params = {}) {
    return await api.get(ENDPOINTS.USERS.LIST, params);
  },

  // Get single user
  async getUser(id) {
    return await api.get(ENDPOINTS.USERS.SHOW(id));
  },

  // Create user
  async createUser(data) {
    return await api.post(ENDPOINTS.USERS.CREATE, data);
  },

  // Update user
  async updateUser(id, data) {
    return await api.put(ENDPOINTS.USERS.UPDATE(id), data);
  },

  // Delete user
  async deleteUser(id) {
    return await api.delete(ENDPOINTS.USERS.DELETE(id));
  },

  // Assign role to user
  async assignRole(id, role) {
    return await api.post(ENDPOINTS.USERS.ASSIGN_ROLE(id), { role });
  },

  // Block/Unblock user
  async blockUser(id) {
    return await api.post(ENDPOINTS.USERS.BLOCK_USER(id));
  },

  // Update current user's profile
  async updateProfile(data) {
    return await api.put(ENDPOINTS.USERS.UPDATE_PROFILE, data);
  },
};

