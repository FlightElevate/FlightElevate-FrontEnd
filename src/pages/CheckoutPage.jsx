import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { subscriptionPlanService } from '../api/services/subscriptionPlanService';
import CheckoutForm from '../components/CheckoutForm';
import { FiArrowLeft, FiShield, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

// Remove the generic fallback key so it fails loudly if you forget your environment variable!
const STRIPE_PK = import.meta.env.VITE_STRIPE_KEY;
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

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
      if (!STRIPE_PK) {
        setError('Stripe Publishable Key is missing! Please add VITE_STRIPE_KEY to your frontend .env file.');
        setLoading(false);
        return;
      }

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
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="flex flex-col items-center text-white">
          <div className="relative flex justify-center items-center">
            <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-500 opacity-20"></div>
            <FiLoader size={40} className="animate-spin text-blue-500 relative z-10" />
          </div>
          <p className="mt-4 font-medium tracking-wide text-blue-100">Preparing Secure Checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <FiShield size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Checkout Unavailable</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb', // Blue-600
      colorBackground: '#ffffff',
      colorText: '#1e293b', // Slate-800
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
    },
    rules: {
      '.Input': {
        borderColor: '#e2e8f0', // Slate-200
        backgroundColor: '#f8fafc', // Slate-50
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      '.Input:focus': {
        borderColor: '#3b82f6', // Blue-500
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
      },
      '.Label': {
        color: '#475569', // Slate-600
        fontWeight: '600',
        marginBottom: '6px',
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Left Panel - Order Summary & Branding */}
      <div className="w-full md:w-5/12 bg-white border-r border-slate-200 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
          <div className="absolute top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-12"
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <FiArrowLeft />
            </div>
            Back to Dashboard
          </button>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest mb-6">
              <FiShield size={12} /> Secure Checkout
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
              Upgrade your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">FlightElevate</span>
            </h1>
            <p className="text-slate-600 text-lg mb-12 max-w-sm leading-relaxed">
              Unlock powerful management tools and elevate your aviation business today.
            </p>
          </div>
        </div>

        <div className="relative z-10 bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Order Summary</p>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{plan?.title || 'Premium Subscription'}</h2>
              <p className="text-sm text-slate-500">Billed monthly</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-slate-900">${parseFloat(plan?.price || 0).toFixed(2)}</span>
              <span className="text-slate-500 text-sm font-medium">/mo</span>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-slate-700">
              <FiCheckCircle className="text-blue-600" /> 
              <span>Instant account activation</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <FiCheckCircle className="text-blue-600" /> 
              <span>Cancel anytime, no hidden fees</span>
            </div>
          </div>

          <div className="h-px w-full bg-slate-200 my-6"></div>
          
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Total Due Today</span>
            <span className="text-xl font-bold text-blue-600">${parseFloat(plan?.price || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Checkout Form */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-8 md:p-12 relative bg-slate-50">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Payment Details</h2>
            <p className="text-slate-500">Enter your card details to complete the subscription.</p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl shadow-slate-200/60 relative overflow-hidden">
            {/* Glossy top highlight */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            
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

          <div className="mt-8 flex items-center justify-center gap-6 opacity-60 grayscale pointer-events-none">
            {/* Subtle logos to imply security */}
            <span className="font-bold text-slate-800 text-lg tracking-tighter">stripe</span>
            <div className="h-4 w-px bg-slate-300"></div>
            <span className="font-semibold text-slate-600 text-sm">PCI DSS Compliant</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CheckoutPage;
