import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const aircraftService = {
  // Get all aircraft with filters
  async getAircraft(params = {}) {
    return await api.get(ENDPOINTS.AIRCRAFT.LIST, params);
  },

  // Get single aircraft
  async getAircraftById(id) {
    return await api.get(ENDPOINTS.AIRCRAFT.SHOW(id));
  },

  // Create aircraft
  async createAircraft(data) {
    return await api.post(ENDPOINTS.AIRCRAFT.CREATE, data);
  },

  // Update aircraft
  async updateAircraft(id, data) {
    return await api.put(ENDPOINTS.AIRCRAFT.UPDATE(id), data);
  },

  // Delete aircraft
  async deleteAircraft(id) {
    return await api.delete(ENDPOINTS.AIRCRAFT.DELETE(id));
  },
};
