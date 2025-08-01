import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Calendar from './pages/Calendar';
import Inbox from './pages/Inbox';
import RolesPermissions from './pages/RolesPermissions';
import Announcements from './pages/Announcements';
import Subscriptions from './pages/Subscriptions';
import Support from './pages/Support';
import Roles from './pages/Permissions/Roles';
import UserLogs from './pages/UserLogs';
import Compose from './pages/Announcment/Compose ';
import Profile from './pages/UserManagement/Profile';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/user-logs" element={<UserLogs />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/roles-permissions" element={<RolesPermissions />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/support" element={<Support />} />

        {/* Roles with permissions Routes */}
        <Route path="/roles-permissions/create" element={<Roles />} />
        
        <Route path="/announcements/compose" element={<Compose />} />
        
        <Route path="/user-management/profile/:id" element={<Profile />} />

        {/* <Route path="/user-management/profile/:id" element={<user/>} /> */}



      </Route>
    </Routes>

  );
};

export default App;
