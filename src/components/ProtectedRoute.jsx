import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = null, requiredPermission = null }) => {
  const { isAuthenticated, user, hasRole, hasPermission, loading } = useAuth();
  const location = useLocation();

  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  
  if (requiredRoles && Array.isArray(requiredRoles)) {
    const hasAnyRole = requiredRoles.some(role => hasRole(role));
    if (!hasAnyRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access this page. Required role: <strong>{requiredRoles.join(' or ')}</strong>
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }
  // Check for required role (single)
  else if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page. Required role: <strong>{requiredRole}</strong>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to perform this action. Required permission: <strong>{requiredPermission}</strong>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Subscription guard — only for Admin-role users with an organization
  // SuperAdmins and users without an org (e.g., newly invited students) bypass this
  const isAdminUser = user?.roles?.some(r => {
    const roleName = (typeof r === 'string' ? r : r?.name || '').toLowerCase();
    return roleName === 'admin';
  });
  const isSuperAdminUser = user?.roles?.some(r => {
    const roleName = (typeof r === 'string' ? r : r?.name || '').toLowerCase();
    return roleName === 'super admin' || roleName === 'super-admin';
  });

  const isInstructorUser = user?.roles?.some(r => {
    const roleName = (typeof r === 'string' ? r : r?.name || '').toLowerCase();
    return roleName === 'instructor';
  });
  const isStudentUser = user?.roles?.some(r => {
    const roleName = (typeof r === 'string' ? r : r?.name || '').toLowerCase();
    return roleName === 'student';
  });

  if (!isSuperAdminUser && user?.organization_id) {
    const hasActiveSub = !!user.has_active_subscription;

    const backendTrialActive = !!user.is_trial_active;
    const safeDateStr = user.trial_ends_at ? (user.trial_ends_at.includes('T') ? user.trial_ends_at : user.trial_ends_at.replace(' ', 'T') + 'Z') : null;
    const clientTrialActive = safeDateStr ? new Date(safeDateStr) > new Date() : false;
    const isTrialActive = backendTrialActive || clientTrialActive;
    const isExpired = !hasActiveSub && !isTrialActive;

    if (isExpired) {
      // All roles redirect to /subscription when expired
      const isSubscriptionPath = location.pathname === '/subscription' || location.pathname.startsWith('/checkout');
      if (!isSubscriptionPath) {
        return <Navigate to="/subscription" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
