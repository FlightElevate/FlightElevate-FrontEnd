import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

/**
 * Organization Service
 * Handles all organization-related API calls
 */
export const organizationService = {
  /**
   * Get all organizations with pagination and filters
   * @param {Object} params - Query parameters (page, per_page, search, sort, order)
   * @returns {Promise<Object>} - Response object with success, data, and meta
   */
  async getOrganizations(params = {}) {
    try {
      return await api.get(ENDPOINTS.ORGANIZATIONS.LIST, params);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  },

  /**
   * Get a specific organization by ID
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} - Response object with success and data
   */
  async getOrganization(id) {
    try {
      return await api.get(ENDPOINTS.ORGANIZATIONS.SHOW(id));
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  },
};

