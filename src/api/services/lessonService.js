import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const lessonService = {
  // Get lessons for a specific user
  async getUserLessons(userId, params = {}) {
    return await api.get(`/users/${userId}/lessons`, { params });
  },

  // Get all lessons
  async getLessons(params = {}) {
    return await api.get(ENDPOINTS.LESSONS.LIST, { params });
  },

  // Get a single lesson by ID
  async getLesson(id) {
    return await api.get(ENDPOINTS.LESSONS.SHOW(id));
  },

  // Create a new lesson/reservation
  async createLesson(data) {
    return await api.post(ENDPOINTS.LESSONS.CREATE, data);
  },

  // Update an existing lesson/reservation
  async updateLesson(id, data) {
    return await api.put(ENDPOINTS.LESSONS.UPDATE(id), data);
  },
};

