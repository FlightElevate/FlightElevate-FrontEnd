import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const locationService = {
  async getLocations(params = {}) {
    return await api.get(ENDPOINTS.LOCATIONS.LIST, { params });
  },
  async createLocation(data) {
    return await api.post(ENDPOINTS.LOCATIONS.CREATE, data);
  },
  async updateLocation(id, data) {
    return await api.put(ENDPOINTS.LOCATIONS.UPDATE(id), data);
  },
  async deleteLocation(id) {
    return await api.delete(ENDPOINTS.LOCATIONS.DELETE(id));
  },
};
