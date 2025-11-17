import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const announcementService = {
  /**
   * Get all announcements
   * @param {Object} params - Query parameters
   */
  async getAnnouncements(params = {}) {
    return await api.get(ENDPOINTS.ANNOUNCEMENTS.LIST, { params });
  },

  /**
   * Get a specific announcement by ID
   * @param {number} id - Announcement ID
   */
  async getAnnouncement(id) {
    return await api.get(ENDPOINTS.ANNOUNCEMENTS.SHOW(id));
  },

  /**
   * Create a new announcement
   * @param {Object} data - Announcement data
   */
  async createAnnouncement(data) {
    return await api.post(ENDPOINTS.ANNOUNCEMENTS.CREATE, data);
  },

  /**
   * Update an announcement
   * @param {number} id - Announcement ID
   * @param {Object} data - Updated data
   */
  async updateAnnouncement(id, data) {
    return await api.put(ENDPOINTS.ANNOUNCEMENTS.UPDATE(id), data);
  },

  /**
   * Delete an announcement
   * @param {number} id - Announcement ID
   */
  async deleteAnnouncement(id) {
    return await api.delete(ENDPOINTS.ANNOUNCEMENTS.DELETE(id));
  },
};

