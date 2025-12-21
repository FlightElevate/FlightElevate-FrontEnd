import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const supportService = {
  /**
   * Get all support tickets with filters
   * @param {Object} params - Query parameters
   * @param {number} params.per_page - Items per page
   * @param {number} params.page - Page number
   * @param {string} params.search - Search term
   * @param {string} params.status - Filter by status (open, ongoing, closed)
   * @param {string} params.priority - Filter by priority (low, normal, high, urgent)
   */
  async getTickets(params = {}) {
    return await api.get(ENDPOINTS.SUPPORT.LIST, { params });
  },

  /**
   * Get a specific support ticket by ID
   * @param {number} id - Ticket ID
   */
  async getTicket(id) {
    return await api.get(ENDPOINTS.SUPPORT.SHOW(id));
  },

  /**
   * Create a new support ticket
   * @param {Object} data - Ticket data
   * @param {string} data.title - Ticket title
   * @param {string} data.description - Ticket description
   * @param {string} data.priority - Priority (low, normal, high, urgent)
   */
  async createTicket(data) {
    return await api.post(ENDPOINTS.SUPPORT.CREATE, data);
  },

  /**
   * Update a support ticket
   * @param {number} id - Ticket ID
   * @param {Object} data - Updated ticket data
   */
  async updateTicket(id, data) {
    return await api.put(ENDPOINTS.SUPPORT.UPDATE(id), data);
  },

  /**
   * Mark a support ticket as complete
   * @param {number} id - Ticket ID
   */
  async completeTicket(id) {
    return await api.post(ENDPOINTS.SUPPORT.COMPLETE(id));
  },

  /**
   * Get messages for a support ticket
   * @param {number} id - Ticket ID
   */
  async getMessages(id) {
    return await api.get(ENDPOINTS.SUPPORT.MESSAGES(id));
  },

  /**
   * Send a message to a support ticket
   * @param {number} id - Ticket ID
   * @param {Object} data - Message data
   * @param {string} data.message - Message content
   */
  async sendMessage(id, data) {
    return await api.post(ENDPOINTS.SUPPORT.SEND_MESSAGE(id), data);
  },
};

