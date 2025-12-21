import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const maintenanceService = {
  // Get all maintenance records with filters
  async getMaintenance(params = {}) {
    return await api.get(ENDPOINTS.MAINTENANCE.LIST, { params });
  },

  // Get single maintenance record
  async getMaintenanceById(id) {
    return await api.get(ENDPOINTS.MAINTENANCE.SHOW(id));
  },

  // Create maintenance record
  async createMaintenance(data) {
    return await api.post(ENDPOINTS.MAINTENANCE.CREATE, data);
  },

  // Update maintenance record
  async updateMaintenance(id, data) {
    return await api.put(ENDPOINTS.MAINTENANCE.UPDATE(id), data);
  },

  // Delete maintenance record
  async deleteMaintenance(id) {
    return await api.delete(ENDPOINTS.MAINTENANCE.DELETE(id));
  },
};
