import React, { useState, useEffect } from "react";
import { subscriptionPlanService } from "../../../api/services/subscriptionPlanService";
import { showSuccessToast, showErrorToast } from "../../../utils/notifications";
import { FiCheck, FiDollarSign } from "react-icons/fi";

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null); // Store planId being subscribed to

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await subscriptionPlanService.getSubscriptionPlans();
      console.log('Subscription Plans API Response:', response);
      
      if (response && response.success) {
        // Handle nested data structures correctly
        let plansList = [];
        if (Array.isArray(response.data)) {
          plansList = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          plansList = response.data.data;
        } else if (response.data && typeof response.data === 'object') {
          // If it's an object with numeric keys (rare but happens)
          plansList = Object.values(response.data).filter(item => typeof item === 'object' && item !== null);
        }
        
        setPlans(plansList);
      } else if (Array.isArray(response)) {
        // Case where the interceptor might have returned just the array
        setPlans(response);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      showErrorToast('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(planId);
    try {
      const response = await subscriptionPlanService.subscribe(planId);
      if (response.success) {
        if (response.data?.checkout_url) {
          // Redirect to Stripe Checkout
          window.location.href = response.data.checkout_url;
        } else {
          showSuccessToast('Successfully subscribed to plan!');
          // Reload to update subscription status and unlock routes
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="py-6 md:mt-5 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Subscription Plans
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose the plan that fits your organization's needs. Scale your operations efficiently.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <FiDollarSign className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No active plans available</h3>
          <p className="mt-1 text-sm text-gray-500">Please check back later or contact support.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    Monthly
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2 h-10">
                  {plan.description || "Comprehensive aviation management solution."}
                </p>
                
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">${parseFloat(plan.price).toFixed(0)}</span>
                  <span className="ml-1 text-sm font-medium text-gray-500">/mo</span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FiCheck className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="font-medium">{plan.max_aircraft === 0 ? 'Unlimited' : plan.max_aircraft} Aircraft</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FiCheck className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="font-medium">{plan.max_users === 0 ? 'Unlimited' : plan.max_users} Users</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FiCheck className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="font-medium">{plan.aircraft}</span>
                  </div>
                  {plan.para && (
                    <div className="flex items-start text-sm text-gray-700">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                        <FiCheck className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="font-medium">{plan.para}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-6 pb-6 mt-auto">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing !== null}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {subscribing === plan.id ? (
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Subscribe Now"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscription;
