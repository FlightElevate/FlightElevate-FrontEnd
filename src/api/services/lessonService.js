import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const lessonService = {
  
  async getUserLessons(userId, params = {}) {
    return await api.get(`/users/${userId}/lessons`, { params });
  },

  
  async getLessons(params = {}) {
    return await api.get(ENDPOINTS.LESSONS.LIST, { params });
  },

  
  async getReservations(params = {}) {
    return await api.get(ENDPOINTS.RESERVATIONS.LIST, { params });
  },

  
  async getLesson(id) {
    return await api.get(ENDPOINTS.LESSONS.SHOW(id));
  },

  async getReservation(id) {
    return await api.get(ENDPOINTS.RESERVATIONS.SHOW(id));
  },

  
  async createLesson(data) {
    return await api.post(ENDPOINTS.LESSONS.CREATE, data);
  },

  
  async createReservation(data) {
    return await api.post(ENDPOINTS.RESERVATIONS.CREATE, data);
  },

  
  async updateLesson(id, data) {
    return await api.put(ENDPOINTS.LESSONS.UPDATE(id), data);
  },

  async updateReservation(id, data) {
    return await api.put(ENDPOINTS.RESERVATIONS.UPDATE(id), data);
  },

  async deleteLesson(id) {
    return await api.delete(ENDPOINTS.LESSONS.DELETE(id));
  },
};

