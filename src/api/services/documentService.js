import { api } from '../apiClient';

export const documentService = {
  
  async getUserDocuments(userId) {
    return await api.get(`/users/${userId}/documents`);
  },

  
  async createDocument(userId, data) {
    return await api.post(`/users/${userId}/documents`, data);
  },

  
  async updateDocument(userId, documentId, data) {
    return await api.put(`/users/${userId}/documents/${documentId}`, data);
  },

  
  async deleteDocument(userId, documentId) {
    return await api.delete(`/users/${userId}/documents/${documentId}`);
  },
};

