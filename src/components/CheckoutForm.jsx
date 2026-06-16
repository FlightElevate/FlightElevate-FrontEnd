import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { subscriptionPlanService } from '../api/services/subscriptionPlanService';
import { showErrorToast, showSuccessToast } from '../utils/notifications';
import { FiLoader, FiLock } from 'react-icons/fi';

const CheckoutForm = ({ planId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required'
    });

    if (error) {
      showErrorToast(error.message || 'Payment verification failed');
      setLoading(false);
      return;
    }

    try {
      // Send the payment method ID to our backend
      const res = await subscriptionPlanService.subscribe(planId, 1, setupIntent.payment_method);
      if (res.success) {
        showSuccessToast('Subscription successful!');
        onSuccess();
      } else {
        showErrorToast(res.message || 'Subscription failed');
      }
    } catch (err) {
      showErrorToast(err?.message || 'Server error during subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-6">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all ${
          loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
        }`}
      >
        {loading ? (
          <><FiLoader className="animate-spin" size={18} /> Processing...</>
        ) : (
          <><FiLock size={16} /> Secure Checkout</>
        )}
      </button>
      <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
        <FiLock /> Guaranteed safe & secure checkout powered by Stripe
      </p>
    </form>
  );
};

export default CheckoutForm;
