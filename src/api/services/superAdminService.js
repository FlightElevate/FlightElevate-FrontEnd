import { api } from '../apiClient';

export const superAdminService = {
  async getStats() {
    try {
      return await api.get('/super-admin/stats');
    } catch (error) {
      console.error('Error fetching super admin stats:', error);
      throw error;
    }
  },
};
