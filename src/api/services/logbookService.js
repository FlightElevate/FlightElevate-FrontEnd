import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const logbookService = {
  /**
   * Get all logbook entries with filters
   */
  getLogbooks: async (params = {}) => {
    try {
      const response = await api.get(ENDPOINTS.LOGBOOKS.LIST, { params });
      return response;
    } catch (error) {
      console.error('Error fetching logbooks:', error);
      throw error;
    }
  },

  /**
   * Get a single logbook entry
   */
  getLogbook: async (id) => {
    try {
      const response = await api.get(`${ENDPOINTS.LOGBOOKS.BASE}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching logbook:', error);
      throw error;
    }
  },

  /**
   * Create a new logbook entry
   */
  createLogbook: async (data) => {
    try {
      const response = await api.post(ENDPOINTS.LOGBOOKS.CREATE, data);
      return response;
    } catch (error) {
      console.error('Error creating logbook:', error);
      throw error;
    }
  },

  /**
   * Update an existing logbook entry
   */
  updateLogbook: async (id, data) => {
    try {
      const response = await api.put(`${ENDPOINTS.LOGBOOKS.BASE}/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating logbook:', error);
      throw error;
    }
  },

  /**
   * Delete a logbook entry
   */
  deleteLogbook: async (id) => {
    try {
      const response = await api.delete(`${ENDPOINTS.LOGBOOKS.BASE}/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting logbook:', error);
      throw error;
    }
  },
};
