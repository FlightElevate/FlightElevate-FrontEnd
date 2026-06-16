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

  async getSetupIntent() {
    return await api.get('/subscription-plans/setup-intent');
  },

  async subscribe(planId, aircraftCount = 1, paymentMethodId = null) {
    return await api.post('/subscription-plans/subscribe', { 
      plan_id: planId, 
      aircraft_count: aircraftCount,
      payment_method: paymentMethodId
    });
  },

  async getCurrentSubscription() {
    return await api.get('/subscription-plans/current');
  },

  async getBillingHistory() {
    return await api.get('/subscription-plans/billing-history');
  },

  async getBillingPortal() {
    return await api.post('/subscription-plans/billing-portal');
  },
};
