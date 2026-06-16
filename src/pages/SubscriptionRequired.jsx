import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionPlanService } from '../api/services/subscriptionPlanService';
import { showErrorToast, showSuccessToast } from '../utils/notifications';
import {
  FiShield, FiCheck, FiZap, FiUsers, FiAlertCircle,
  FiLoader, FiStar
} from 'react-icons/fi';
import { MdFlight } from 'react-icons/md';

const SubscriptionRequired = () => {
  const { user, hasRole, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);

  // If user already has active access, bounce them to dashboard
  useEffect(() => {
    if (!user) return;
    if (hasRole('Super Admin')) { navigate('/dashboard', { replace: true }); return; }
    if (user.has_active_subscription || user.is_trial_active) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, hasRole, navigate]);

  // Fetch plans from DB
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await subscriptionPlanService.getSubscriptionPlans();
        if (response.success) {
          const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          setPlans(list.filter(p => p.status === 'active'));
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId, price) => {
    navigate(`/checkout/${planId}`);
  };

  const isExpiredTrial = user && !user.has_active_subscription && !user.is_trial_active && user.trial_ends_at;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-start py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10 max-w-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 mb-5">
          <FiShield className="text-red-400" size={30} />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          {isExpiredTrial ? '⏰ Your Free Trial Has Ended' : '🔒 Subscription Required'}
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          {isExpiredTrial
            ? 'Your 14-day free trial has expired. Choose a plan below to continue using FlightElevate.'
            : 'Your subscription has expired. Please renew your plan to regain access to your dashboard.'}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium">
          <FiAlertCircle size={14} />
          All your data is safe and preserved. Subscribe to continue.
        </div>
      </div>

      {/* Plans */}
      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-20">
          <FiLoader className="animate-spin" size={20} />
          <span>Loading available plans...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No plans available. Please contact support.</p>
        </div>
      ) : (
        <div className={`grid gap-6 w-full max-w-5xl ${
          plans.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
          plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {plans.map((plan, idx) => {
            const isPopular = plans.length > 1 && idx === Math.floor(plans.length / 2);
            const isLoading = subscribing === plan.id;
            const features = plan.para
              ? plan.para.split(/[|\n]/).map(f => f.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border transition-all duration-300 flex flex-col ${
                  isPopular
                    ? 'border-blue-500 bg-gradient-to-b from-blue-900/60 to-slate-900/80 shadow-2xl shadow-blue-500/20 scale-105'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg">
                      <FiStar size={11} />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.title}</h3>
                    {plan.description && (
                      <p className="text-slate-400 text-sm leading-relaxed">{plan.description}</p>
                    )}
                  </div>

                  {/* Flat monthly price */}
                  <div className="mb-5 rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-slate-400 text-xs font-medium mb-1">Flat monthly fee</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold text-white">${parseFloat(plan.price).toFixed(2)}</span>
                      <span className="text-slate-400 text-sm mb-1.5">/ month</span>
                    </div>
                    {plan.setup_fee > 0 && (
                      <p className="text-slate-500 text-xs mt-1">
                        + ${parseFloat(plan.setup_fee).toFixed(2)} one-time setup fee
                      </p>
                    )}
                  </div>

                  {/* Limits badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-xs font-medium">
                      <MdFlight size={11} />
                      {plan.max_aircraft === 0 ? 'Unlimited aircraft' : `Up to ${plan.max_aircraft} aircraft`}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-xs font-medium">
                      <FiUsers size={11} />
                      {plan.max_users === 0 ? 'Unlimited users' : `Up to ${plan.max_users} users`}
                    </span>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-2">
                      {features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <FiCheck className="text-green-400 flex-shrink-0 mt-0.5" size={14} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => handleSubscribe(plan.id, plan.price)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                      isPopular
                        ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20'
                    } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <FiLoader className="animate-spin" size={16} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiZap size={15} />
                        Get Started — ${parseFloat(plan.price).toFixed(2)}/mo
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-2">🔒 Secure payment via Stripe</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-10 text-center">
        <p className="text-slate-500 text-sm">
          Need help? Contact us at{' '}
          <a href="mailto:support@flightelevate.com" className="text-blue-400 hover:text-blue-300 underline">
            support@flightelevate.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionRequired;
