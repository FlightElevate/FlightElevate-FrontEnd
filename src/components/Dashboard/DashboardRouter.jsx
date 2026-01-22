import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import SuperAdminDashboard from '../../pages/SuperAdmin/Dashboard';
import AdminDashboard from '../../pages/AdminFE/Dashboard';
import StudentDashboard from '../../pages/StudentFE/Dashboard';
import InstructorDashboard from '../../pages/InstructorFE/Dashboard';

const DashboardRouter = React.memo(() => {
  const { user, loading } = useAuth();

  // Use useMemo to optimize role checking
  const userRole = useMemo(() => {
    if (!user?.roles || loading) return null;
    
    const roles = user.roles.map(role => {
      const roleName = typeof role === 'string' ? role : role?.name || '';
      return roleName.toLowerCase();
    });

    if (roles.includes('super admin') || roles.includes('super-admin')) {
      return 'super-admin';
    }
    if (roles.includes('admin')) {
      return 'admin';
    }
    if (roles.includes('instructor')) {
      return 'instructor';
    }
    if (roles.includes('student')) {
      return 'student';
    }
    return 'admin'; // Default fallback
  }, [user?.roles, loading]);

  // Show loading only if auth is actually loading
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render appropriate dashboard immediately
  switch (userRole) {
    case 'super-admin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'instructor':
      return <InstructorDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <AdminDashboard />;
  }
});

DashboardRouter.displayName = 'DashboardRouter';

export default DashboardRouter;
