import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen" style={{ overflowX: 'hidden', overflowY: 'hidden' }}>
     
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1" style={{ overflowX: 'hidden', overflowY: 'hidden', minWidth: 0 }}>
      
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 bg-gray-50" style={{ overflowX: 'visible', overflowY: 'auto', minWidth: 0, maxWidth: '100%' }}>
          <Outlet />
        </main>   
      </div>
    </div>
  );
};


export default MainLayout;
