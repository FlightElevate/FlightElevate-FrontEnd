import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import SummaryCards from '../../components/Dashboard/SummaryCards';
import FSession from '../../components/Dashboard/FSession';
import TotalRevenue from '../../components/Dashboard/TotalRevenue';
import UpcomingBookings from '../../components/Dashboard/UpcomingBookings';
import AdminFlightLogs from '../../components/Dashboard/AdminFlightLogs';

const AdminDashboard = React.memo(() => {
  const { user } = useAuth();

  const userName = useMemo(() => {
    return user?.name?.split(' ')[0] || user?.first_name || 'John';
  }, [user?.name, user?.first_name]);

  return (
    <div className="p-2 -mx-4 gap-4 sm:gap-6">
      <div className="mb-6 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl fw6 leading-8 sm:leading-[38px]">Welcome Back, {userName}</h2>
        <p className="text-sm sm:text-base text-[#8A8A8A]">Keep track of your flight lesson records and analytics here.</p>
      </div>

      {/* min-w-0 on every block stops wide content (tables, charts) from pushing the page sideways on phones */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="min-w-0">
          <SummaryCards />
        </div>

        {/* One column on phones and tablets, two per row from 1280px up */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <div className="min-w-0 flex [&>*]:w-full">
            <FSession />
          </div>
          <div className="min-w-0 flex [&>*]:w-full">
            <TotalRevenue />
          </div>
        </div>

        {/* Second pair. Side by side from 1536px up, because the bookings table needs about 720px of width */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6">
          <div className="min-w-0 flex [&>*]:w-full">
            <AdminFlightLogs />
          </div>
          {/* Last, so a slow load here never holds up the tiles above it */}
          <div className="min-w-0 flex [&>*]:w-full">
            <UpcomingBookings />
          </div>
        </div>
      </div>
    </div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
