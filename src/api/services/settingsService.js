import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const settingsService = {
  
  async getSettings() {
    return await api.get(ENDPOINTS.SETTINGS.GET);
  },

  
  async updateSettings(data) {
    return await api.put(ENDPOINTS.SETTINGS.UPDATE, data);
  },

  
  async updateSettingsWithFile(formData) {
    return await api.put(ENDPOINTS.SETTINGS.UPDATE, formData);
  },
};

