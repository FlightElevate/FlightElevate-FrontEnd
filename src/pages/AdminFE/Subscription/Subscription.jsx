import React, { useState, useEffect } from "react";
import { subscriptionPlanService } from "../../../api/services/subscriptionPlanService";
import { aircraftService } from "../../../api/services/aircraftService";
import { showSuccessToast, showErrorToast } from "../../../utils/notifications";
import { FiCheck, FiDollarSign, FiCheckCircle } from "react-icons/fi";

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null); 
  const [aircraftCount, setAircraftCount] = useState(1);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available subscription plans
      await fetchPlans();

      // 2. Fetch current active subscription
      const subResponse = await subscriptionPlanService.getCurrentSubscription();
      if (subResponse && subResponse.success && subResponse.data) {
        setCurrentSubscription(subResponse.data);
      }

      // 3. Fetch aircraft list to get count of active fleet
      const acResponse = await aircraftService.getAircraft();
      if (acResponse && acResponse.success) {
        const acList = acResponse.data?.data || (Array.isArray(acResponse.data) ? acResponse.data : []);
        if (acList.length > 0) {
          setAircraftCount(acList.length);
        }
      }
    } catch (err) {
      console.error('Error initializing subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await subscriptionPlanService.getSubscriptionPlans();
      if (response && response.success) {
        let plansList = [];
        if (Array.isArray(response.data)) {
          plansList = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          plansList = response.data.data;
        }
        setPlans(plansList);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(planId);
    try {
      const response = await subscriptionPlanService.subscribe(planId);
      if (response.success) {
        showSuccessToast('Successfully subscribed to plan!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ==================== ACTIVE SUBSCRIPTION VIEW ====================
  if (currentSubscription) {
    return (
      <div className="py-6 md:mt-5 mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl animate-in fade-in duration-700">
        <div className="mb-8 border-b border-gray-150 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Subscription</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your active plan and organization resources.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FiCheckCircle className="w-24 h-24 text-blue-600" />
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                  Active Plan
                </span>
              </div>

              <h3 className="text-3xl font-bold text-blue-600 mb-2">{currentSubscription.plan_title}</h3>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 my-4 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 font-medium">Monthly Rate per Aircraft:</span>
                  <span className="font-bold text-gray-900">${parseFloat(currentSubscription.price / Math.max(1, currentSubscription.aircraft_count)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-200/50 mt-1 pt-1">
                  <span className="text-gray-500 font-medium">Your Active Fleet Size:</span>
                  <span className="font-bold text-gray-900">{currentSubscription.aircraft_count} Aircraft</span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-200 mt-1.5 pt-1.5 font-bold text-base">
                  <span className="text-gray-800">Total Billed:</span>
                  <span className="text-blue-600">${parseFloat(currentSubscription.price).toFixed(2)}/mo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Aircraft Limit</p>
                  <p className="text-xl font-bold text-gray-900">
                    {currentSubscription.max_aircraft === 0 ? 'Unlimited' : `${currentSubscription.max_aircraft} planes`}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">User Seats</p>
                  <p className="text-xl font-bold text-gray-900">
                    {currentSubscription.max_users === 0 ? 'Unlimited' : `${currentSubscription.max_users} users`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setCurrentSubscription(null);
                    fetchPlans();
                  }}
                  className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Change Plan
                </button>
                <button className="flex-1 bg-white text-gray-600 font-bold py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  Billing History
                </button>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start space-x-3">
              <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600">
                <FiDollarSign className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <h4 className="font-bold text-blue-900">Renewal Notice</h4>
                <p className="text-blue-700/90 mt-0.5">
                  Your plan is scheduled to renew on <span className="font-bold underline">{currentSubscription.ends_at ? new Date(currentSubscription.ends_at).toLocaleDateString() : "next billing period"}</span>. 
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4">Included Plan Benefits</h4>
              <ul className="space-y-3">
                {[
                  'Unlimited Flight Logs',
                  'Instructor Oversight',
                  'Fleet Maintenance',
                  'Digital Logbooks',
                  'Student Dashboard'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm font-medium text-gray-650">
                    <FiCheck className="text-green-500 mr-2.5 w-4 h-4 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== SIMPLE PLANS LIST VIEW ====================
  return (
    <div className="py-6 md:mt-5 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-8 border-b border-gray-150 pb-5">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Subscription Plans
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose the plan that fits your organization's needs. Pricing is calculated strictly per aircraft.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8 text-sm text-blue-800 flex items-center justify-between">
        <div>
          <p className="font-bold">Estimated based on your fleet size:</p>
          <p className="text-blue-700 mt-0.5">You currently have <span className="font-bold">{aircraftCount} active aircraft</span> registered in your fleet.</p>
        </div>
        <div className="bg-white px-3.5 py-1.5 rounded-lg border border-blue-200 text-blue-800 font-bold">
          {aircraftCount} Aircraft
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <FiDollarSign className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No active plans available</h3>
          <p className="mt-1 text-sm text-gray-500">Please check back later or contact support.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const estimatedTotal = parseFloat(plan.price) * aircraftCount;
            return (
              <div
                key={plan.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      Per Aircraft
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-550 min-h-[40px]">
                    {plan.description || "Comprehensive aviation management solution."}
                  </p>
                  
                  <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col justify-center">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">${parseFloat(plan.price).toFixed(0)}</span>
                      <span className="ml-1 text-sm font-medium text-gray-500">/aircraft/mo</span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50/50 rounded-lg px-3 py-2 border border-blue-100">
                      Your Estimate: ${estimatedTotal.toFixed(0)}/mo ({aircraftCount} Planes)
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 pt-2">
                    <div className="flex items-center text-sm text-gray-700">
                      <FiCheck className="w-4 h-4 text-green-500 mr-2.5 flex-shrink-0" />
                      <span className="font-medium">{plan.max_aircraft === 0 ? 'Unlimited' : plan.max_aircraft} Aircraft Limit</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <FiCheck className="w-4 h-4 text-green-500 mr-2.5 flex-shrink-0" />
                      <span className="font-medium">{plan.max_users === 0 ? 'Unlimited' : plan.max_users} Users Capacity</span>
                    </div>
                    {plan.aircraft && (
                      <div className="flex items-start text-sm text-gray-600">
                        <FiCheck className="w-4 h-4 text-blue-500 mr-2.5 flex-shrink-0 mt-0.5" />
                        <span className="font-medium leading-tight">{plan.aircraft}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-6 pb-6 mt-auto">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing !== null}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Subscription;
