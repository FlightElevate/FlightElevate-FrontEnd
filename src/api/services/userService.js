import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const userService = {
  
  async getUsers(params = {}) {
    return await api.get(ENDPOINTS.USERS.LIST, params);
  },

  
  async getUser(id) {
    return await api.get(ENDPOINTS.USERS.SHOW(id));
  },

  
  async createUser(data) {
    return await api.post(ENDPOINTS.USERS.CREATE, data);
  },

  
  async updateUser(id, data) {
    return await api.put(ENDPOINTS.USERS.UPDATE(id), data);
  },

  
  async deleteUser(id) {
    return await api.delete(ENDPOINTS.USERS.DELETE(id));
  },

  
  async assignRole(id, role) {
    return await api.post(ENDPOINTS.USERS.ASSIGN_ROLE(id), { role });
  },

  
  async blockUser(id) {
    return await api.post(ENDPOINTS.USERS.BLOCK_USER(id));
  },

  
  async updateProfile(data) {
    return await api.put(ENDPOINTS.USERS.UPDATE_PROFILE, data);
  },
};

