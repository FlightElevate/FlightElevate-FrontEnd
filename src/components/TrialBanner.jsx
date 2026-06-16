import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiZap, FiX } from 'react-icons/fi';

const TrialBanner = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const trialInfo = useMemo(() => {
    // Only show for Admin users in trial period
    if (!user) return null;
    if (hasRole('Super Admin')) return null;
    if (!user.is_trial_active) return null;
    if (!user.trial_ends_at) return null;

    const today = new Date();
    const trialEnd = new Date(user.trial_ends_at);
    const diffMs = trialEnd - today;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return null; // expired — subscription wall handles this

    return { daysLeft };
  }, [user, hasRole]);

  if (!trialInfo) return null;

  const { daysLeft } = trialInfo;

  // Color based on urgency
  const getBannerStyle = () => {
    if (daysLeft <= 2) {
      return {
        bg: 'bg-red-600',
        text: 'text-white',
        badge: 'bg-red-800 text-red-100',
        btn: 'bg-white text-red-600 hover:bg-red-50',
        icon: 'text-red-200',
      };
    }
    if (daysLeft <= 5) {
      return {
        bg: 'bg-amber-500',
        text: 'text-white',
        badge: 'bg-amber-700 text-amber-100',
        btn: 'bg-white text-amber-600 hover:bg-amber-50',
        icon: 'text-amber-200',
      };
    }
    return {
      bg: 'bg-blue-600',
      text: 'text-white',
      badge: 'bg-blue-800 text-blue-100',
      btn: 'bg-white text-blue-600 hover:bg-blue-50',
      icon: 'text-blue-200',
    };
  };

  const style = getBannerStyle();

  return (
    <div className={`${style.bg} ${style.text} px-4 py-2.5 flex items-center justify-between gap-4 text-sm`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FiClock className={`${style.icon} flex-shrink-0`} size={16} />
        <span className="font-medium">
          {daysLeft <= 2 ? '🚨' : daysLeft <= 5 ? '⚠️' : '🕐'}
          {' '}
          Your free trial expires in{' '}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${style.badge}`}>
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
          </span>
          . Upgrade to keep full access.
        </span>
      </div>
      <button
        onClick={() => navigate('/subscription')}
        className={`${style.btn} flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors`}
      >
        <FiZap size={12} />
        Upgrade Now →
      </button>
    </div>
  );
};

export default TrialBanner;
