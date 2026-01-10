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

  /**
   * Update an organization
   * @param {number} id - Organization ID
   * @param {Object} data - Organization data to update (name, logo_file)
   * @returns {Promise<Object>} - Response object with success and data
   */
  async updateOrganization(id, data) {
    try {
      const formData = new FormData();
      
      // Always append name if provided
      if (data.name !== undefined && data.name !== null) {
        formData.append('name', String(data.name).trim());
      }
      
      // Append logo_file if provided
      if (data.logo_file) {
        formData.append('logo_file', data.logo_file);
      }

      // Debug: Log what we're sending
      if (import.meta.env.DEV) {
        console.log('Updating organization:', {
          id,
          name: data.name,
          hasLogoFile: !!data.logo_file,
        });
      }

      // Don't set Content-Type header - let browser set it with boundary for FormData
      return await api.put(ENDPOINTS.ORGANIZATIONS.UPDATE(id), formData);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  },
};

