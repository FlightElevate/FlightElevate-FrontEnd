import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TrialBanner from '../components/TrialBanner';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Super Admins are exempt from trial checks
    if (isSuperAdmin()) return;

    // Check if user has an organization and if the trial has expired
    if (user?.organization_id) {
      const hasActiveSub = !!user.has_active_subscription;
      
      const backendTrialActive = !!user.is_trial_active;
      const safeDateStr = user.trial_ends_at ? (user.trial_ends_at.includes('T') ? user.trial_ends_at : user.trial_ends_at.replace(' ', 'T') + 'Z') : null;
      const clientTrialActive = safeDateStr ? new Date(safeDateStr) > new Date() : false;
      const isTrialActive = backendTrialActive || clientTrialActive;
      
      // If trial is expired and no active subscription, redirect to subscription page
      // Unless they are already on the subscription page or support page
      const isOnSubscriptionPage = location.pathname === '/subscription' || location.pathname === '/subscription-plans';
      const isOnSupportPage = location.pathname.startsWith('/support');

      if (!hasActiveSub && !isTrialActive && !isOnSubscriptionPage && !isOnSupportPage) {
        navigate('/subscription-required', { replace: true });
      }
    }
  }, [user, isSuperAdmin, navigate, location.pathname]);

  return (
    <div className="flex h-screen" style={{ overflowX: 'hidden', overflowY: 'hidden' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1" style={{ overflowX: 'hidden', overflowY: 'hidden', minWidth: 0 }}>
        <TrialBanner />
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 bg-gray-50" style={{ overflowX: 'visible', overflowY: 'auto', minWidth: 0, maxWidth: '100%' }}>
          <Outlet />
        </main>   
      </div>
    </div>
  );
};

export default MainLayout;
