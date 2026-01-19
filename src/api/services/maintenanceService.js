import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const maintenanceService = {
  
  async getMaintenance(params = {}) {
    return await api.get(ENDPOINTS.MAINTENANCE.LIST, { params });
  },

  
  async getMaintenanceById(id) {
    return await api.get(ENDPOINTS.MAINTENANCE.SHOW(id));
  },

  
  async createMaintenance(data) {
    return await api.post(ENDPOINTS.MAINTENANCE.CREATE, data);
  },

  
  async updateMaintenance(id, data) {
    return await api.put(ENDPOINTS.MAINTENANCE.UPDATE(id), data);
  },

  
  async deleteMaintenance(id) {
    return await api.delete(ENDPOINTS.MAINTENANCE.DELETE(id));
  },
};
