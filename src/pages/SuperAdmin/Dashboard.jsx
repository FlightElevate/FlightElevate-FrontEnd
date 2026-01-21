import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Widgets from '../../components/ui/Widgets';
import FSession from '../../components/Dashboard/FSession';
import TotalRevenue from '../../components/Dashboard/TotalRevenue';

const Dashboard = () => {
  const { user } = useAuth();
  
  
  const userName = user?.name?.split(' ')[0] || user?.first_name || 'John';

  return (
    <div className="p-2 gap-6">
      <div className='mb-10'>
        <h2 className="text-3xl fw6 leading-[38px]">Welcome Back, {userName}</h2>
        <p className='text-base text-[#8A8A8A]'>Keep the track of you flight lessons records and analytics here.</p>
      </div>

     <div className="flex flex-col  gap-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Widgets
          bgColor="#E9F0FC"
          textColor="#1751D0"
          label="Total Organizations"
          count={76}
          viewLink="#"
        />
        <Widgets
          bgColor="#FFF1DA"
          textColor="#EC980C"
          label="Earnings"
          count="$1,520"
          viewLink="#"
        />
      </div>
      
      <FSession/>
      <TotalRevenue/>
     </div>

    </div>
  );
};

export default Dashboard;
