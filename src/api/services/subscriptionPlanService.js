import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const subscriptionPlanService = {
  
  async getSubscriptionPlans(params = {}) {
    return await api.get(ENDPOINTS.SUBSCRIPTION_PLANS.LIST, { params });
  },

  
  async getSubscriptionPlanById(id) {
    return await api.get(ENDPOINTS.SUBSCRIPTION_PLANS.SHOW(id));
  },

  
  async createSubscriptionPlan(data) {
    return await api.post(ENDPOINTS.SUBSCRIPTION_PLANS.CREATE, data);
  },

  
  async updateSubscriptionPlan(id, data) {
    return await api.put(ENDPOINTS.SUBSCRIPTION_PLANS.UPDATE(id), data);
  },

  
  async deleteSubscriptionPlan(id) {
    return await api.delete(ENDPOINTS.SUBSCRIPTION_PLANS.DELETE(id));
  },
};
