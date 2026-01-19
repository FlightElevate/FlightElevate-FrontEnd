import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { subscriptionPlanService } from "../../../api/services/subscriptionPlanService";
import { showSuccessToast, showErrorToast } from "../../../utils/notifications";

const Plans = () => {
  const { planId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  
  const isEdit = (planId && planId !== 'new') || (state?.plan && state.plan.id);
  
  const [loading, setLoading] = useState(isEdit && !state?.plan);
  const [submitting, setSubmitting] = useState(false);
  
  
  const getInitialData = () => {
    if (state?.plan) {
      const plan = state.plan;
      return {
        title: plan.title || '',
        description: plan.description || '',
        aircraft: plan.aircraft || '',
        price: plan.price != null ? String(plan.price) : '',
        setup_fee: plan.setup_fee != null ? String(plan.setup_fee) : '',
        para: plan.para || '',
        status: plan.status || 'active',
      };
    }
    return {
      title: '',
      description: '',
      aircraft: '',
      price: '',
      setup_fee: '',
      para: '',
      status: 'active',
    };
  };

  const [formData, setFormData] = useState(getInitialData());

  
  useEffect(() => {
    if (state?.plan) {
      const plan = state.plan;
      setFormData({
        title: plan.title || '',
        description: plan.description || '',
        aircraft: plan.aircraft || '',
        price: plan.price != null ? String(plan.price) : '',
        setup_fee: plan.setup_fee != null ? String(plan.setup_fee) : '',
        para: plan.para || '',
        status: plan.status || 'active',
      });
      setLoading(false);
    }
  }, [state]);

  
  useEffect(() => {
    if (planId && planId !== 'new' && !state?.plan) {
      fetchPlan();
    }
    
  }, [planId]);

  const fetchPlan = async () => {
    if (!planId || planId === 'new') return;
    
    setLoading(true);
    try {
      const response = await subscriptionPlanService.getSubscriptionPlanById(planId);
      if (response.success) {
        const plan = response.data;
        setFormData({
          title: plan.title || '',
          description: plan.description || '',
          aircraft: plan.aircraft || '',
          price: plan.price != null ? String(plan.price) : '',
          setup_fee: plan.setup_fee != null ? String(plan.setup_fee) : '',
          para: plan.para || '',
          status: plan.status || 'active',
        });
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
      showErrorToast('Failed to load subscription plan');
      navigate('/subscriptions', { state: { tab: 'Subscription Plans' } });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description || null,
        aircraft: formData.aircraft,
        price: parseFloat(formData.price),
        setup_fee: formData.setup_fee ? parseFloat(formData.setup_fee) : 0,
        para: formData.para || null,
        status: formData.status,
      };

      const actualPlanId = planId && planId !== 'new' ? planId : (state?.plan?.id);
      
      if (isEdit && actualPlanId) {
        const response = await subscriptionPlanService.updateSubscriptionPlan(actualPlanId, data);
        if (response.success) {
          showSuccessToast('Subscription plan updated successfully');
          navigate('/subscriptions', { state: { tab: 'Subscription Plans' } });
        }
      } else {
        const response = await subscriptionPlanService.createSubscriptionPlan(data);
        if (response.success) {
          showSuccessToast('Subscription plan created successfully');
          navigate('/subscriptions', { state: { tab: 'Subscription Plans' } });
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} subscription plan`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Subscription Plan' : 'Add New Subscription Plan'}
          </h2>
          <button
            onClick={() => navigate('/subscriptions')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter plan name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter plan description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aircraft Limit *
                </label>
                <input
                  type="text"
                  required
                  value={formData.aircraft}
                  onChange={(e) => setFormData({ ...formData, aircraft: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5 Aircraft"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Month *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  One-time Setup Fee
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.setup_fee}
                  onChange={(e) => setFormData({ ...formData, setup_fee: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Notes
              </label>
              <textarea
                value={formData.para}
                onChange={(e) => setFormData({ ...formData, para: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter additional notes or details"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/subscriptions', { state: { tab: 'Subscription Plans' } })}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Plans;
