import { api } from '../apiClient';

export const documentService = {
  // Get all documents for a user
  async getUserDocuments(userId) {
    return await api.get(`/users/${userId}/documents`);
  },

  // Create document (supports FormData for file uploads)
  async createDocument(userId, data) {
    return await api.post(`/users/${userId}/documents`, data);
  },

  // Update document (supports FormData for file uploads)
  async updateDocument(userId, documentId, data) {
    return await api.put(`/users/${userId}/documents/${documentId}`, data);
  },

  // Delete document
  async deleteDocument(userId, documentId) {
    return await api.delete(`/users/${userId}/documents/${documentId}`);
  },
};

