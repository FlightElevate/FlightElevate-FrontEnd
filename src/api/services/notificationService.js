// api/services/notificationService.js
import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const notificationService = {
  // params: { per_page, page, unread: true }
  async list(params = {}) {
    return await api.get(ENDPOINTS.NOTIFICATIONS.LIST, { params });
  },

  async unreadCount() {
    return await api.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  },

  async markRead(id) {
    return await api.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  async markAllRead() {
    return await api.post(ENDPOINTS.NOTIFICATIONS.READ_ALL);
  },

  async remove(id) {
    return await api.delete(ENDPOINTS.NOTIFICATIONS.DELETE(id));
  },

  // Returns every event with label, category, locked channels and the user's current choices.
  async getPreferences() {
    return await api.get(ENDPOINTS.NOTIFICATIONS.PREFERENCES);
  },

  // preferences: [{ event: 'reservation.reminder_1h', channel: 'mail', enabled: false }, ...]
  async updatePreferences(preferences) {
    return await api.put(ENDPOINTS.NOTIFICATIONS.PREFERENCES, { preferences });
  },
};
