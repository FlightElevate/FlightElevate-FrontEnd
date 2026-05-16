import React, { useState, useEffect } from "react";
import { subscriptionPlanService } from "../../../api/services/subscriptionPlanService";
import { aircraftService } from "../../../api/services/aircraftService";
import { showSuccessToast, showErrorToast } from "../../../utils/notifications";
import { FiCheck, FiDollarSign, FiCheckCircle, FiCpu, FiTrendingUp, FiLayers, FiSliders, FiUsers, FiClock } from "react-icons/fi";

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null); 
  const [fleetSize, setFleetSize] = useState(1);
  const [actualAircraftCount, setActualAircraftCount] = useState(0);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      // Fetch available plans first (needed for both cases)
      await fetchPlans();

      // Check if there's an active subscription
      const subResponse = await subscriptionPlanService.getCurrentSubscription();
      if (subResponse && subResponse.success && subResponse.data) {
        setCurrentSubscription(subResponse.data);
      }
      
      // Auto-detect actual fleet size to initialize estimator
      const acResponse = await aircraftService.getAircraft();
      if (acResponse && acResponse.success) {
        const acList = acResponse.data?.data || (Array.isArray(acResponse.data) ? acResponse.data : []);
        setActualAircraftCount(acList.length);
        if (acList.length > 0) {
          setFleetSize(acList.length);
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
        }, 1550);
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-48 space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        <p className="text-gray-500 font-semibold animate-pulse">Loading subscription details...</p>
      </div>
    );
  }

  // ==================== ACTIVE SUBSCRIPTION VIEW ====================
  if (currentSubscription) {
    const aircraftLimit = currentSubscription.max_aircraft || 0;
    const usagePercentage = aircraftLimit > 0 ? Math.min(100, (currentSubscription.aircraft_count / aircraftLimit) * 100) : 0;

    return (
      <div className="py-8 md:mt-5 mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl animate-in fade-in duration-700">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Organization Subscription</h2>
            <p className="mt-2 text-sm text-gray-500">Monitor and manage your fleet billing cycle and allocation.</p>
          </div>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-green-500/10 text-green-700 uppercase tracking-widest flex items-center border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-550 mr-2 animate-ping"></span>
            System Live & Verified
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Main Premium Card */}
            <div className="bg-gradient-to-br from-white via-white to-blue-50/20 border border-gray-200/80 rounded-3xl p-8 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 uppercase tracking-wider">
                    CURRENT ACTIVE PLAN
                  </span>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tight mt-3">{currentSubscription.plan_title}</h3>
                </div>
                <div className="bg-blue-600/10 p-3 rounded-2xl">
                  <FiCheckCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="border-t border-b border-gray-100 py-6 my-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Monthly Investment</p>
                  <div className="flex items-baseline mt-1">
                    <span className="text-4xl font-extrabold text-blue-600">${parseFloat(currentSubscription.price).toFixed(2)}</span>
                    <span className="text-gray-500 font-medium text-sm ml-2">/ month</span>
                  </div>
                </div>
                <div className="bg-gray-500/5 border border-gray-100 rounded-2xl px-5 py-3.5">
                  <span className="text-xs font-bold text-gray-500 block uppercase">Rate per Aircraft</span>
                  <span className="text-lg font-black text-gray-800">
                    ${parseFloat(currentSubscription.price / Math.max(1, currentSubscription.aircraft_count)).toFixed(2)} /mo
                  </span>
                </div>
              </div>

              {/* Resource Limit Gauges */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center"><FiLayers className="mr-2 text-blue-500" /> Fleet Sizing Allocation</span>
                    <span>{currentSubscription.aircraft_count} of {aircraftLimit === 0 ? "Unlimited" : aircraftLimit} Aircraft Active</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-200">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-650 h-full rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${aircraftLimit === 0 ? 100 : usagePercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      <FiUsers className="mr-1.5 text-indigo-500" /> User Seat Capacity
                    </span>
                    <p className="text-2xl font-black text-gray-800">
                      {currentSubscription.max_users === 0 ? 'Unlimited' : `${currentSubscription.max_users} Seats`}
                    </p>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      <FiCpu className="mr-1.5 text-blue-500" /> Fleet Setup
                    </span>
                    <p className="text-2xl font-black text-gray-800">
                      {currentSubscription.aircraft_count} Registered
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button 
                  onClick={() => {
                    setCurrentSubscription(null);
                    fetchPlans();
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-200 hover:-translate-y-0.5"
                >
                  Change / Upgrade Subscription
                </button>
                <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-extrabold py-4 px-6 rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-sm">
                  View Billing & Invoices
                </button>
              </div>
            </div>

            {/* Renewal Banner */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-6 flex items-start space-x-4">
              <div className="bg-white p-3.5 rounded-2xl shadow-md text-indigo-600">
                <FiClock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-indigo-955">Autopay Renewal Activated</h4>
                <p className="text-sm text-indigo-900/80 mt-1 leading-relaxed">
                  Your billing account is connected. The plan is scheduled to automatically renew on{" "}
                  <span className="font-black underline text-indigo-950">
                    {currentSubscription.ends_at ? new Date(currentSubscription.ends_at).toLocaleDateString() : "Next billing period"}
                  </span>.
                </p>
              </div>
            </div>
          </div>

          {/* Premium Benefits Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-gray-900 to-slate-950 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
              
              <h4 className="text-xl font-bold tracking-tight mb-6 flex items-center">
                <FiTrendingUp className="mr-3 text-blue-400" /> Included Benefits
              </h4>
              <ul className="space-y-5">
                {[
                  'Unlimited Flight Logs & Tracking',
                  'Full Student & Instructor Portals',
                  'Smart Fleet Dispatch Calendars',
                  'Automated Hobbs/Tach Telemetry Tracking',
                  'Digital Endorsements & Sign-offs',
                  'Real-time METAR Weather Updates'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-300 font-medium">
                    <span className="bg-blue-500/20 text-blue-400 p-1 rounded-lg mr-3.5 flex-shrink-0 mt-0.5">
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                    <span className="leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-400">Need specific custom enterprise terms?</p>
                <a href="mailto:support@flightelevate.com" className="text-xs text-blue-400 font-bold hover:underline mt-1 block">Contact Enterprise Fleet Desk</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== NEW PLANS LIST & CALCULATOR VIEW ====================
  return (
    <div className="py-8 md:mt-5 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl animate-in fade-in duration-700">
      
      {/* Header section */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-widest">
          FLEXIBLE SCALE
        </span>
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mt-4">
          Aircraft-Based Subscription Plans
        </h2>
        <p className="mt-3 text-lg text-gray-500 leading-relaxed">
          FlightElevate pricing scales dynamically with your fleet size. Real-time maintenance, logs, and dispatch tracking for every plane.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-md mx-auto">
          <FiDollarSign className="mx-auto h-16 w-16 text-gray-300 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-gray-900">No active plans configured</h3>
          <p className="mt-2 text-sm text-gray-500 px-6">Please check back in a few moments or contact our system support desk.</p>
        </div>
      ) : (
        <>
          {/* Interactive Dynamic Fleet Calculator Card */}
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-12"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full w-fit">
                  <FiSliders className="w-4 h-4 text-blue-200" />
                  <span className="text-xs font-bold tracking-wider uppercase">Interactive Cost Estimator</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black">How many aircraft do you have?</h3>
                <p className="text-blue-100 text-sm max-w-md leading-relaxed">
                  Drag the slider to match your organization's total fleet count. We'll automatically calculate your exact pricing plan breakdown.
                </p>
              </div>

              {/* Sizing Controller Control Panel */}
              <div className="w-full md:w-80 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-lg flex flex-col justify-center">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Your Fleet Size</span>
                  <div className="flex items-center space-x-1.5">
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      value={fleetSize}
                      onChange={(e) => setFleetSize(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-white/20 text-white font-black text-center text-lg rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-white border-none"
                    />
                    <span className="text-sm font-bold">Planes</span>
                  </div>
                </div>

                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={fleetSize}
                  onChange={(e) => setFleetSize(parseInt(e.target.value))}
                  className="w-full accent-white h-2 rounded-lg bg-white/20 cursor-pointer outline-none"
                />
                
                <div className="flex justify-between text-[10px] text-blue-200 font-bold mt-2.5">
                  <span>1 Aircraft</span>
                  <span>50+ Aircraft</span>
                </div>

                {actualAircraftCount > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 text-center text-xs text-blue-100 font-semibold">
                    Auto-detected fleet: <span className="underline font-bold text-white">{actualAircraftCount} active planes</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Elegant Grid Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const estimatedTotal = parseFloat(plan.price) * fleetSize;
              const isPopular = plan.title.toLowerCase().includes('standard') || plan.title.toLowerCase().includes('recommended') || index === 1;

              return (
                <div
                  key={plan.id}
                  className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1.5 hover:shadow-2xl relative ${
                    isPopular 
                      ? 'border-blue-500 shadow-xl ring-4 ring-blue-500/10' 
                      : 'border-gray-200/80 shadow-md'
                  }`}
                >
                  {isPopular && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-center py-2 text-xs font-bold tracking-widest uppercase absolute top-0 left-0 right-0">
                      MOST POPULAR CHOICE
                    </div>
                  )}

                  <div className={`p-8 flex-1 flex flex-col ${isPopular ? 'pt-12' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{plan.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1.5 inline-block">
                          SCALE TO FLEET
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-550 text-sm leading-relaxed mb-6 min-h-[40px]">
                      {plan.description || "Robust platform tracking solution for aviation squads."}
                    </p>

                    {/* Highly intuitive dynamic price display */}
                    <div className="bg-gray-550/5 rounded-2xl p-5 mb-6 border border-gray-100 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Estimated Total Billing</span>
                      <div className="flex items-baseline mt-1">
                        <span className="text-4xl font-extrabold text-gray-900">${estimatedTotal.toFixed(0)}</span>
                        <span className="text-gray-500 font-semibold text-sm ml-1.5">/mo</span>
                      </div>
                      <span className="text-xs text-gray-550 font-medium mt-1">
                        Based on {fleetSize} {fleetSize === 1 ? 'aircraft' : 'aircraft'} (${parseFloat(plan.price).toFixed(2)}/aircraft/mo)
                      </span>
                    </div>

                    {/* Features breakdown */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="bg-green-100 text-green-700 p-1 rounded-lg mr-3 flex-shrink-0">
                          <FiCheck className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-semibold text-gray-800">
                          Max Fleet: <span className="underline">{plan.max_aircraft === 0 ? 'Unlimited' : `${plan.max_aircraft} planes`}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="bg-green-100 text-green-700 p-1 rounded-lg mr-3 flex-shrink-0">
                          <FiCheck className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-semibold text-gray-800">
                          Included Members: <span className="underline">{plan.max_users === 0 ? 'Unlimited' : `${plan.max_users} users`}</span>
                        </span>
                      </div>

                      {plan.aircraft && (
                        <div className="flex items-start text-sm text-gray-600">
                          <span className="bg-blue-100 text-blue-700 p-1 rounded-lg mr-3 flex-shrink-0 mt-0.5">
                            <FiCheck className="w-3.5 h-3.5" />
                          </span>
                          <span className="leading-snug">{plan.aircraft}</span>
                        </div>
                      )}
                    </div>

                    {plan.para && (
                      <div className="text-xs text-gray-500 italic mt-auto bg-gray-50/50 p-3.5 rounded-xl border border-dashed border-gray-200">
                        {plan.para}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Subscribe Button */}
                  <div className="p-6 bg-gray-550 border-t border-gray-100 mt-auto">
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing !== null}
                      className={`w-full flex items-center justify-center py-4 px-6 font-extrabold rounded-xl transition-all duration-300 shadow-md ${
                        isPopular 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-100 hover:-translate-y-0.5" 
                          : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {subscribing === plan.id ? (
                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        "Select Plan & Register"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Subscription;
