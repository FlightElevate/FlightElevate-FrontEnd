import React, { useState, useEffect } from "react";
import { subscriptionPlanService } from "../../../api/services/subscriptionPlanService";
import { showSuccessToast, showErrorToast } from "../../../utils/notifications";
import { FiCheck, FiDollarSign } from "react-icons/fi";

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

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
    setSubscribing(true);
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
      setSubscribing(false);
    }
  };

  return (
    <div className="py-8 md:mt-5 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl animate-in fade-in duration-700">
      <div className="text-center mb-10">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl tracking-tight">
          Organization Plans
        </h2>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl mx-auto">
          Choose the perfect plan for your flight school. Scale your operations with our flexible subscription models.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading best plans for you...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <FiDollarSign className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No plans found</h3>
          <p className="mt-1 text-sm text-gray-500">No active subscription plans available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 xl:gap-12">
          {plans.map((plan) => {
            const isPopular = plan.title.toLowerCase().includes('standard') || plan.title.toLowerCase().includes('premium');
            
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden ${
                  isPopular 
                    ? 'border-2 border-blue-500 shadow-xl scale-105 z-10 bg-white' 
                    : 'border border-gray-200 shadow-sm bg-white'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 mt-4 mr-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white uppercase tracking-widest shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 sm:p-10 flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{plan.title}</h3>
                  <p className="mt-4 text-gray-500 text-sm leading-relaxed h-12">
                    {plan.description || "Comprehensive solution for managing your modern flight operations."}
                  </p>
                  
                  <div className="mt-8 flex items-baseline">
                    <span className="text-5xl font-black text-gray-900 tracking-tight">${parseFloat(plan.price).toFixed(0)}</span>
                    <span className="ml-2 text-lg font-semibold text-gray-400">/monthly</span>
                  </div>
                  
                  <div className="mt-10 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Aircraft</p>
                        <p className="text-lg font-black text-blue-900">{plan.max_aircraft === 0 ? 'Unlimited' : plan.max_aircraft}</p>
                      </div>
                      <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Users</p>
                        <p className="text-lg font-black text-indigo-900">{plan.max_users === 0 ? 'Unlimited' : plan.max_users}</p>
                      </div>
                    </div>

                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                          <FiCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="ml-3 text-sm font-medium text-gray-600">{plan.aircraft}</p>
                      </li>
                      {plan.para && (
                        <li className="flex items-start">
                          <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                            <FiCheck className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="ml-3 text-sm font-medium text-gray-600">{plan.para}</p>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="p-8 sm:p-10 pt-0">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing}
                    className={`w-full flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg ${
                      isPopular 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200' 
                        : 'bg-gray-900 text-white hover:bg-black hover:shadow-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {subscribing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>
                  <p className="mt-4 text-center text-xs text-gray-400 font-medium">
                    Cancel or upgrade anytime. Secure payment by Stripe.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Subscription;
