import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { subscriptionPlanService } from '../api/services/subscriptionPlanService';
import CheckoutForm from '../components/CheckoutForm';
import { FiArrowLeft, FiShield, FiLoader } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

// Use env variable or fallback dummy key to avoid crashing
const STRIPE_PK = import.meta.env.VITE_STRIPE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const stripePromise = loadStripe(STRIPE_PK);

const CheckoutPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  const [clientSecret, setClientSecret] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initCheckout = async () => {
      try {
        // Fetch plan details
        const planRes = await subscriptionPlanService.getSubscriptionPlanById(planId);
        if (planRes.success) {
          setPlan(planRes.data);
        } else {
          setError('Plan not found.');
          setLoading(false);
          return;
        }

        // Fetch Setup Intent Client Secret
        const intentRes = await subscriptionPlanService.getSetupIntent();
        if (intentRes.success && intentRes.data?.client_secret) {
          setClientSecret(intentRes.data.client_secret);
        } else {
          setError('Failed to initialize secure checkout session.');
        }
      } catch (err) {
        setError(err?.message || 'Unable to connect to payment server. Check your Stripe keys.');
      } finally {
        setLoading(false);
      }
    };
    initCheckout();
  }, [planId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-500">
          <FiLoader size={30} className="animate-spin mb-3 text-blue-600" />
          <p>Initializing secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Checkout Unavailable</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
      borderRadius: '8px',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <FiArrowLeft /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Order Summary */}
          <div className="w-full md:w-5/12 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Order Summary</h3>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{plan?.title || 'Subscription'}</h2>
                <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">${parseFloat(plan?.price || 0).toFixed(2)}</span>
                <span className="text-gray-500 text-sm">/mo</span>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6"></div>

            <div className="flex justify-between text-gray-900 font-bold text-lg">
              <span>Total Due Today</span>
              <span>${parseFloat(plan?.price || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="w-full md:w-7/12 bg-white rounded-2xl p-6 shadow-xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h3>
            
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
              <CheckoutForm 
                planId={planId} 
                onSuccess={async () => {
                  await refreshUser();
                  navigate('/dashboard');
                }} 
              />
            </Elements>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
