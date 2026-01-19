import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const squawkService = {
  
  async getSquawks(params = {}) {
    return await api.get(ENDPOINTS.SQUAWKS.LIST, { params });
  },

  
  async getSquawkById(id) {
    return await api.get(ENDPOINTS.SQUAWKS.SHOW(id));
  },

  
  async createSquawk(data) {
    return await api.post(ENDPOINTS.SQUAWKS.CREATE, data);
  },

  
  async updateSquawk(id, data) {
    return await api.put(ENDPOINTS.SQUAWKS.UPDATE(id), data);
  },

  
  async resolveSquawk(id) {
    return await api.post(ENDPOINTS.SQUAWKS.RESOLVE(id));
  },

  
  async deleteSquawk(id) {
    return await api.delete(ENDPOINTS.SQUAWKS.DELETE(id));
  },
};
