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
        max_aircraft: plan.max_aircraft != null ? String(plan.max_aircraft) : '0',
        max_users: plan.max_users != null ? String(plan.max_users) : '0',
        price: plan.price != null ? String(plan.price) : '',
        setup_fee: plan.setup_fee != null ? String(plan.setup_fee) : '',
        para: plan.para || '',
        status: plan.status || 'active',
        stripe_plan_id: plan.stripe_plan_id || '',
      };
    }
    return {
      title: '',
      description: '',
      aircraft: '',
      max_aircraft: '0',
      max_users: '0',
      price: '',
      setup_fee: '',
      para: '',
      status: 'active',
      stripe_plan_id: '',
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
        max_aircraft: plan.max_aircraft != null ? String(plan.max_aircraft) : '0',
        max_users: plan.max_users != null ? String(plan.max_users) : '0',
        price: plan.price != null ? String(plan.price) : '',
        setup_fee: plan.setup_fee != null ? String(plan.setup_fee) : '',
        para: plan.para || '',
        status: plan.status || 'active',
        stripe_plan_id: plan.stripe_plan_id || '',
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
          max_aircraft: plan.max_aircraft != null ? String(plan.max_aircraft) : '0',
          max_users: plan.max_users != null ? String(plan.max_users) : '0',
          price: plan.price != null ? String(plan.price) : '',
          setup_fee: plan.setup_fee != null ? String(plan.setup_fee) : '',
          para: plan.para || '',
          status: plan.status || 'active',
          stripe_plan_id: plan.stripe_plan_id || '',
        });
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
      showErrorToast('Failed to load subscription plan');
      navigate('/subscription-plans', { state: { tab: 'Subscription Plans' } });
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
        max_aircraft: parseInt(formData.max_aircraft) || 0,
        max_users: parseInt(formData.max_users) || 0,
        price: parseFloat(formData.price),
        para: formData.para || null,
        status: formData.status,
        stripe_plan_id: formData.stripe_plan_id || null,
      };

      const actualPlanId = planId && planId !== 'new' ? planId : (state?.plan?.id);
      
      if (isEdit && actualPlanId) {
        const response = await subscriptionPlanService.updateSubscriptionPlan(actualPlanId, data);
        if (response.success) {
          showSuccessToast('Subscription plan updated successfully');
          navigate('/subscription-plans', { state: { tab: 'Subscription Plans' } });
        }
      } else {
        const response = await subscriptionPlanService.createSubscriptionPlan(data);
        if (response.success) {
          showSuccessToast('Subscription plan created successfully');
          navigate('/subscription-plans', { state: { tab: 'Subscription Plans' } });
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
    <div className="md:mt-5 mx-auto max-w-4xl animate-in fade-in duration-500">
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Edit Subscription Plan' : 'Add New Plan'}
          </h2>
          <button
            onClick={() => navigate('/subscription-plans')}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Plan Identity */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Plan Name *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                placeholder="e.g. Basic Plan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Monthly Price ($) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Limits */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Max Aircraft (0 = Unlimited) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.max_aircraft}
                onChange={(e) => setFormData({ ...formData, max_aircraft: e.target.value })}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Max Users *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Display Label (e.g. "5 Aircraft") *
              </label>
              <input
                type="text"
                required
                value={formData.aircraft}
                onChange={(e) => setFormData({ ...formData, aircraft: e.target.value })}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                placeholder="How limits appear to users"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Stripe Price ID (Optional)
              </label>
              <input
                type="text"
                value={formData.stripe_plan_id}
                onChange={(e) => setFormData({ ...formData, stripe_plan_id: e.target.value })}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-mono"
                placeholder="price_H1k..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Plan Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none"
                placeholder="Short summary of plan value"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Feature Highlights (para)
              </label>
              <textarea
                value={formData.para}
                onChange={(e) => setFormData({ ...formData, para: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 bg-gray-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none"
                placeholder="Additional features/bullet points"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/subscription-plans', { state: { tab: 'Subscription Plans' } })}
              className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md transition disabled:opacity-50"
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
