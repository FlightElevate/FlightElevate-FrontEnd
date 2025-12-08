import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const messageService = {
    // Get all users with filters
    async getUsers(params = {}) {
        return await api.get(ENDPOINTS.INBOX.USER, params);
    },

    // Get Conversations
    async getConversations(params = {}) {
        return await api.get(ENDPOINTS.INBOX.GETCONVERSATIONS, params);
    },

    // create Conversation new chat between users
    async createConversation(data) {
        return await api.post(ENDPOINTS.INBOX.CONVERSATION, data);
    },

    // Get Messages by conversation ID
    async getMessages(conversationId, params = {}) {
        return await api.get(ENDPOINTS.INBOX.MESSAGES(conversationId), { params });
    },

    async sendMessage(conservtionId, payload) {
        return await api.post(ENDPOINTS.INBOX.SEND(conservtionId), payload);
    }
};