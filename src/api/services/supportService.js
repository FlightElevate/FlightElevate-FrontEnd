import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const supportService = {
  
  async getTickets(params = {}) {
    return await api.get(ENDPOINTS.SUPPORT.LIST, { params });
  },

  
  async getTicket(id) {
    return await api.get(ENDPOINTS.SUPPORT.SHOW(id));
  },

  
  async createTicket(data) {
    return await api.post(ENDPOINTS.SUPPORT.CREATE, data);
  },

  
  async updateTicket(id, data) {
    return await api.put(ENDPOINTS.SUPPORT.UPDATE(id), data);
  },

  
  async completeTicket(id) {
    return await api.post(ENDPOINTS.SUPPORT.COMPLETE(id));
  },

  
  async getMessages(id) {
    return await api.get(ENDPOINTS.SUPPORT.MESSAGES(id));
  },

  
  async sendMessage(id, data) {
    return await api.post(ENDPOINTS.SUPPORT.SEND_MESSAGE(id), data);
  },
};

