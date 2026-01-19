import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const activityLogService = {
  
  async getActivityLogs(params = {}) {
    return await api.get(ENDPOINTS.ACTIVITY_LOGS.LIST, { params });
  },

  
  async getActivityLog(id) {
    return await api.get(ENDPOINTS.ACTIVITY_LOGS.SHOW(id));
  },
};

