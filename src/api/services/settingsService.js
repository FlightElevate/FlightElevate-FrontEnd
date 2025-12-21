import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const settingsService = {
  // Get all settings data
  async getSettings() {
    return await api.get(ENDPOINTS.SETTINGS.GET);
  },

  // Update settings data
  async updateSettings(data) {
    return await api.put(ENDPOINTS.SETTINGS.UPDATE, data);
  },

  // Update settings with file upload (for avatar)
  async updateSettingsWithFile(formData) {
    return await api.put(ENDPOINTS.SETTINGS.UPDATE, formData);
  },
};

