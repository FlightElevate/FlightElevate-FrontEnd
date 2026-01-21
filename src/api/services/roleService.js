import { api } from '../apiClient';
import { ENDPOINTS } from '../config';


export const roleService = {
  
  async getRoles() {
    try {
      return await api.get(ENDPOINTS.ROLES.LIST);
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  
  async getRole(id) {
    return await api.get(ENDPOINTS.ROLES.SHOW(id));
  },

  
  async createRole(data) {
    return await api.post(ENDPOINTS.ROLES.CREATE, data);
  },

  
  async updateRole(id, data) {
    return await api.put(ENDPOINTS.ROLES.UPDATE(id), data);
  },

  
  async deleteRole(id) {
    return await api.delete(ENDPOINTS.ROLES.DELETE(id));
  },

  
  async getPermissions() {
    try {
      return await api.get(ENDPOINTS.ROLES.PERMISSIONS);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  
  async updateRolePermissions(id, permissions) {
    try {
      return await api.post(ENDPOINTS.ROLES.UPDATE_PERMISSIONS(id), { permissions });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  },
};

