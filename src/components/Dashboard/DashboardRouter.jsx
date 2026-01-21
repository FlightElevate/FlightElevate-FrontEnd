import React from 'react';
import { useAuth } from '../../context/AuthContext';
import SuperAdminDashboard from '../../pages/SuperAdmin/Dashboard';
import AdminDashboard from '../../pages/AdminFE/Dashboard';
import StudentDashboard from '../../pages/StudentFE/Dashboard';
import InstructorDashboard from '../../pages/InstructorFE/Dashboard';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  
  const isSuperAdmin = user?.roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'super admin' || 
           lowerRole === 'super-admin';
  }) || false;

  
  const isAdmin = user?.roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'admin' && !isSuperAdmin;
  }) || false;

  
  const isStudent = user?.roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'student';
  }) || false;

  
  const isInstructor = user?.roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'instructor';
  }) || false;

  
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }
  
  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isInstructor) {
    return <InstructorDashboard />;
  }

  if (isStudent) {
    return <StudentDashboard />;
  }
  
  
  return <AdminDashboard />;
};

export default DashboardRouter;
