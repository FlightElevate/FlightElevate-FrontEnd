import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const messageService = {
    
    async getUsers(params = {}) {
        return await api.get(ENDPOINTS.INBOX.USER, params);
    },

    
    async getConversations(params = {}) {
        return await api.get(ENDPOINTS.INBOX.GETCONVERSATIONS, params);
    },

    
    async createConversation(data) {
        return await api.post(ENDPOINTS.INBOX.CONVERSATION, data);
    },

    
    async getMessages(conversationId, params = {}) {
        return await api.get(ENDPOINTS.INBOX.MESSAGES(conversationId), { params });
    },

    async sendMessage(conservtionId, payload) {
        return await api.post(ENDPOINTS.INBOX.SEND(conservtionId), payload);
    }
};