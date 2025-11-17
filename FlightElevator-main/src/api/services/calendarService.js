import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const calendarService = {
  /**
   * Get schedule data for calendar view
   * @param {Object} params - Query parameters (date, location)
   */
  async getSchedule(params = {}) {
    return await api.get(ENDPOINTS.CALENDAR.SCHEDULE, { params });
  },

  /**
   * Get available locations
   */
  async getLocations() {
    return await api.get(ENDPOINTS.CALENDAR.LOCATIONS);
  },

  /**
   * Get calendar settings/preferences
   */
  async getSettings() {
    return await api.get(ENDPOINTS.CALENDAR.SETTINGS);
  },

  /**
   * Update calendar settings/preferences
   * @param {Object} settings - Settings object
   */
  async updateSettings(settings) {
    return await api.put(ENDPOINTS.CALENDAR.SETTINGS, settings);
  },

  /**
   * Get available time slots for a specific date
   * @param {Object} params - Query parameters (date, instructor_id, aircraft_id, duration)
   */
  async getAvailableTimeSlots(params = {}) {
    return await api.get(ENDPOINTS.CALENDAR.AVAILABLE_SLOTS, { params });
  },
};

