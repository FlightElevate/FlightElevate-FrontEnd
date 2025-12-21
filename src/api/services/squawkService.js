import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const squawkService = {
  // Get all squawks with filters
  async getSquawks(params = {}) {
    return await api.get(ENDPOINTS.SQUAWKS.LIST, { params });
  },

  // Get single squawk
  async getSquawkById(id) {
    return await api.get(ENDPOINTS.SQUAWKS.SHOW(id));
  },

  // Create squawk
  async createSquawk(data) {
    return await api.post(ENDPOINTS.SQUAWKS.CREATE, data);
  },

  // Update squawk
  async updateSquawk(id, data) {
    return await api.put(ENDPOINTS.SQUAWKS.UPDATE(id), data);
  },

  // Resolve squawk
  async resolveSquawk(id) {
    return await api.post(ENDPOINTS.SQUAWKS.RESOLVE(id));
  },

  // Delete squawk
  async deleteSquawk(id) {
    return await api.delete(ENDPOINTS.SQUAWKS.DELETE(id));
  },
};
