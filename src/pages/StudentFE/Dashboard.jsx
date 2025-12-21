import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentSummaryCards from '../../components/Dashboard/StudentSummaryCards';
import StudentFlightSession from '../../components/Dashboard/StudentFlightSession';
import StudentFlightLogs from '../../components/Dashboard/StudentFlightLogs';

const StudentDashboard = () => {
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
        <StudentSummaryCards />
        
        {/* Flight Session Summary Chart */}
        <StudentFlightSession/>
        
        {/* Flight Logs Table */}
        <StudentFlightLogs/>
      </div>
    </div>
  );
};

export default StudentDashboard;

