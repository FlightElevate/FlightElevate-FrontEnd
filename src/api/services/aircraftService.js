import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const aircraftService = {
  
  async getAircraft(params = {}) {
    return await api.get(ENDPOINTS.AIRCRAFT.LIST, params);
  },

  
  async getAircraftById(id) {
    return await api.get(ENDPOINTS.AIRCRAFT.SHOW(id));
  },

  
  async createAircraft(data) {
    return await api.post(ENDPOINTS.AIRCRAFT.CREATE, data);
  },

  
  async updateAircraft(id, data) {
    return await api.put(ENDPOINTS.AIRCRAFT.UPDATE(id), data);
  },

  
  async deleteAircraft(id) {
    return await api.delete(ENDPOINTS.AIRCRAFT.DELETE(id));
  },
};
