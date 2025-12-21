import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

/**
 * Role Service
 * Handles all role-related API calls
 */
export const roleService = {
  /**
   * Get all roles with permissions
   * @returns {Promise<Object>} - Response object with success, data, and meta
   */
  async getRoles() {
    try {
      return await api.get(ENDPOINTS.ROLES.LIST);
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  /**
   * Get a specific role by ID
   * @param {number} id - Role ID
   */
  async getRole(id) {
    return await api.get(ENDPOINTS.ROLES.SHOW(id));
  },

  /**
   * Create a new role
   * @param {Object} data - Role data
   */
  async createRole(data) {
    return await api.post(ENDPOINTS.ROLES.CREATE, data);
  },

  /**
   * Update a role
   * @param {number} id - Role ID
   * @param {Object} data - Updated data
   */
  async updateRole(id, data) {
    return await api.put(ENDPOINTS.ROLES.UPDATE(id), data);
  },

  /**
   * Delete a role
   * @param {number} id - Role ID
   */
  async deleteRole(id) {
    return await api.delete(ENDPOINTS.ROLES.DELETE(id));
  },

  /**
   * Get all available permissions
   * @returns {Promise<Object>} - Response object with success and data
   */
  async getPermissions() {
    try {
      return await api.get(ENDPOINTS.ROLES.PERMISSIONS);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  /**
   * Update permissions for a role
   * @param {number} id - Role ID
   * @param {Array} permissions - Array of permission names
   * @returns {Promise<Object>} - Response object with success and data
   */
  async updateRolePermissions(id, permissions) {
    try {
      return await api.post(ENDPOINTS.ROLES.UPDATE_PERMISSIONS(id), { permissions });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  },
};

