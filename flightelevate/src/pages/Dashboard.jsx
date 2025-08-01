import React from 'react';
import Widgets from '../components/ui/Widgets';

const Dashboard = () => {
  return (
    <div className='p-2'>
      <div className='mb-10'>
        <h2 className="text-3xl fw6 leading-[38px]">Welcome Back, John</h2>
        <p className='text-base text-[#8A8A8A]'>Keep the track of you flight lessons records and analytics here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Widgets
          bgColor="#E9F0FC"
          textColor="#1751D0"
          label="Total Organizations"
          count={45}
          viewLink="#"
        />
        <Widgets
          bgColor="#FFF1DA"
          textColor="#EC980C"
          label="Earning"
          count="$1,520"
          viewLink="#"
        />

      </div>

    </div>
  );
};

export default Dashboard;
