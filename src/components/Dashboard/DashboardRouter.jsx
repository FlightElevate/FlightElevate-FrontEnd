import React from 'react';
import { useAuth } from '../../context/AuthContext';
import SuperAdminDashboard from '../../pages/SuperAdmin/Dashboard';
import AdminDashboard from '../../pages/AdminFE/Dashboard';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  // Check if user is Super Admin
  const isSuperAdmin = user?.roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'super admin' || 
           lowerRole === 'super-admin';
  }) || false;

  // Check if user is Admin
  const isAdmin = user?.roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'admin' && !isSuperAdmin;
  }) || false;

  // Show SuperAdmin dashboard for Super Admin, Admin dashboard for Admin, default to Admin
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }
  
  return <AdminDashboard />;
};

export default DashboardRouter;
