import React from 'react';
import { useAuth } from '../../context/AuthContext';
import InstructorSummaryCards from '../../components/Dashboard/InstructorSummaryCards';
import InstructorFlightSession from '../../components/Dashboard/InstructorFlightSession';
import InstructorUpcomingSessions from '../../components/Dashboard/InstructorUpcomingSessions';

const InstructorDashboard = () => {
  const { user } = useAuth();
  
  // Get user's first name or fallback to "John"
  const userName = user?.name?.split(' ')[0] || user?.first_name || 'John';

  return (
    <div className="p-2 gap-6">
      <div className='mb-10'>
        <h2 className="text-3xl fw6 leading-[38px]">Welcome Back, {userName}</h2>
        <p className='text-base text-[#8A8A8A]'>Keep the track of you flight lessons records and analytics here.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Summary Cards */}
        <InstructorSummaryCards />
        
        {/* Flight Session Summary Chart */}
        <InstructorFlightSession/>
        
        {/* Upcoming Sessions Table */}
        <InstructorUpcomingSessions/>
      </div>
    </div>
  );
};

export default InstructorDashboard;

