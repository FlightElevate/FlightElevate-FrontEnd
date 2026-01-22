import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import SummaryCards from '../../components/Dashboard/SummaryCards';
import FSession from '../../components/Dashboard/FSession';
import TotalRevenue from '../../components/Dashboard/TotalRevenue';
import UpcomingBookings from '../../components/Dashboard/UpcomingBookings';

const AdminDashboard = React.memo(() => {
  const { user } = useAuth();
  
  const userName = useMemo(() => {
    return user?.name?.split(' ')[0] || user?.first_name || 'John';
  }, [user?.name, user?.first_name]);

  return (
    <div className="p-2 gap-6">
      <div className='mb-10'>
        <h2 className="text-3xl fw6 leading-[38px]">Welcome Back, {userName}</h2>
        <p className='text-base text-[#8A8A8A]'>Keep the track of you flight lessons records and analytics here.</p>
      </div>

      <div className="flex flex-col gap-6">
        <SummaryCards />
        <FSession/>
        <TotalRevenue/>
        <UpcomingBookings/>
      </div>
    </div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
