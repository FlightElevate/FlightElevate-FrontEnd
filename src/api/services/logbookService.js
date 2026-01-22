import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const logbookService = {
  
  // Get all logbook entries
  async getEntries(params = {}) {
    return await api.get(ENDPOINTS.LOGBOOK?.LIST || '/logbooks', { params });
  },

  // Get a single logbook entry
  async getEntry(id) {
    return await api.get(ENDPOINTS.LOGBOOK?.SHOW?.(id) || `/logbooks/${id}`);
  },

  // Get logbook entries for a specific user
  async getUserEntries(userId, params = {}) {
    return await api.get(`/users/${userId}/logbooks`, { params });
  },

  // Create a new logbook entry
  async createEntry(data) {
    return await api.post(ENDPOINTS.LOGBOOK?.CREATE || '/logbooks', data);
  },

  // Update a logbook entry
  async updateEntry(id, data) {
    return await api.put(ENDPOINTS.LOGBOOK?.UPDATE?.(id) || `/logbooks/${id}`, data);
  },

  // Delete a logbook entry
  async deleteEntry(id) {
    return await api.delete(ENDPOINTS.LOGBOOK?.DELETE?.(id) || `/logbooks/${id}`);
  },

  // Get logbook statistics
  async getStats(params = {}) {
    return await api.get(ENDPOINTS.LOGBOOK?.STATS || '/logbooks/stats', { params });
  },

  // Export logbook entries
  async exportEntries(params = {}) {
    return await api.get(ENDPOINTS.LOGBOOK?.EXPORT || '/logbooks/export', { 
      params,
      responseType: 'blob'
    });
  },

  // Get flight hours summary
  async getFlightHours(userId, params = {}) {
    return await api.get(`/users/${userId}/logbooks/flight-hours`, { params });
  },
};
