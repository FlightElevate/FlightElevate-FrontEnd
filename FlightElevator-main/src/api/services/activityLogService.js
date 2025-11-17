import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const activityLogService = {
  /**
   * Get all activity logs with filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page
   * @param {string} params.search - Search term
   * @param {string} params.role - Filter by role
   * @param {string} params.action - Filter by action
   * @param {number} params.user_id - Filter by user ID
   * @param {string} params.sort - Sort field
   * @param {string} params.order - Sort order (asc/desc)
   */
  async getActivityLogs(params = {}) {
    return await api.get(ENDPOINTS.ACTIVITY_LOGS.LIST, { params });
  },

  /**
   * Get a specific activity log by ID
   * @param {number} id - Activity log ID
   */
  async getActivityLog(id) {
    return await api.get(ENDPOINTS.ACTIVITY_LOGS.SHOW(id));
  },
};

