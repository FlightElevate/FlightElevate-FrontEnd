import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const announcementService = {
  
  async getAnnouncements(params = {}) {
    return await api.get(ENDPOINTS.ANNOUNCEMENTS.LIST, { params });
  },

  
  async getAnnouncement(id) {
    return await api.get(ENDPOINTS.ANNOUNCEMENTS.SHOW(id));
  },

  
  async createAnnouncement(data) {
    return await api.post(ENDPOINTS.ANNOUNCEMENTS.CREATE, data);
  },

  
  async updateAnnouncement(id, data) {
    return await api.put(ENDPOINTS.ANNOUNCEMENTS.UPDATE(id), data);
  },

  
  async deleteAnnouncement(id) {
    return await api.delete(ENDPOINTS.ANNOUNCEMENTS.DELETE(id));
  },
};

