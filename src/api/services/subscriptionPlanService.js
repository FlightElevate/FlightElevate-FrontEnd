import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const subscriptionPlanService = {
  // Get all subscription plans with filters
  async getSubscriptionPlans(params = {}) {
    return await api.get(ENDPOINTS.SUBSCRIPTION_PLANS.LIST, { params });
  },

  // Get single subscription plan
  async getSubscriptionPlanById(id) {
    return await api.get(ENDPOINTS.SUBSCRIPTION_PLANS.SHOW(id));
  },

  // Create subscription plan
  async createSubscriptionPlan(data) {
    return await api.post(ENDPOINTS.SUBSCRIPTION_PLANS.CREATE, data);
  },

  // Update subscription plan
  async updateSubscriptionPlan(id, data) {
    return await api.put(ENDPOINTS.SUBSCRIPTION_PLANS.UPDATE(id), data);
  },

  // Delete subscription plan
  async deleteSubscriptionPlan(id) {
    return await api.delete(ENDPOINTS.SUBSCRIPTION_PLANS.DELETE(id));
  },
};
