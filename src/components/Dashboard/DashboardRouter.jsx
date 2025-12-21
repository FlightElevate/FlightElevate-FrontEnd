import React from 'react';
import { useAuth } from '../../context/AuthContext';
import SuperAdminDashboard from '../../pages/SuperAdmin/Dashboard';
import AdminDashboard from '../../pages/AdminFE/Dashboard';
import StudentDashboard from '../../pages/StudentFE/Dashboard';
import InstructorDashboard from '../../pages/InstructorFE/Dashboard';

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

  // Check if user is Student
  const isStudent = user?.roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'student';
  }) || false;

  // Check if user is Instructor
  const isInstructor = user?.roles?.some(role => {
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'instructor';
  }) || false;

  // Show appropriate dashboard based on role
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
  
  // Default to Admin dashboard
  return <AdminDashboard />;
};

export default DashboardRouter;
