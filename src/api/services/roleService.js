import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const roleService = {
  /**
   * Get all roles with permissions
   */
  async getRoles() {
    return await api.get(ENDPOINTS.ROLES.LIST);
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
   */
  async getPermissions() {
    return await api.get('/roles/permissions/list');
  },

  /**
   * Update permissions for a role
   * @param {number} id - Role ID
   * @param {Array} permissions - Array of permission names
   */
  async updateRolePermissions(id, permissions) {
    return await api.post(`/roles/${id}/permissions`, { permissions });
  },
};

