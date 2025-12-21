import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import DashboardRouter from "./components/Dashboard/DashboardRouter";
import UserManagement from "./pages/SuperAdmin/UserManagement";
import UserManagementConnected from "./pages/SuperAdmin/UserManagementConnected";
import Calendar from "./pages/Calendar";
import Inbox from "./pages/Inbox";
import RolesPermissions from "./pages/SuperAdmin/RolesPermissions";
import RoleDetails from "./pages/SuperAdmin/RoleDetails";
import Announcements from "./pages/Announcements";
import Subscriptions from "./pages/SuperAdmin/Subscriptions";
import Support from "./pages/Support/Support";
import Roles from "./pages/SuperAdmin/Permissions/Roles";
import UserLogs from "./pages/SuperAdmin/UserLogs";
import Compose from "./pages/Announcment/Compose";
import UserProfilePage from "./pages/AdminFE/Users/UserProfile";
import Plans from "./pages/SuperAdmin/Subscriptions/Plans";
import Chatsupport from "./pages/Support/Chatsupport";
import Users from "./pages/AdminFE/Users/Users";
import UserProfile from './pages/AdminFE/Users/UserProfile';
import OrganizationDetail from "./pages/SuperAdmin/OrganizationDetail";
import AirCraftProfile from "./pages/AdminFE/AirCraftProfile/AirCraftProfile";
import AirCraftDetail from "./pages/AdminFE/AirCraftProfile/AirCraftDetail";
import MyLessons from "./pages/StudentFE/MyLessons";
import Instructors from "./pages/StudentFE/Instructors";
import Setting from "./pages/StudentFE/Setting";
import LessonDetails from "./pages/StudentFE/MyLesson/LessonDetails";
import LessonTasks from "./pages/StudentFE/MyLessons/LessonTasks";
import InstructorProfile from "./pages/StudentFE/Instructors/InstructorProfile";
import InstructorLessons from "./pages/InstructorFE/Lessons";

const App = () => {
  return (
    <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<DashboardRouter />} />
          
          {/* User Management - Original (static data) */}
          <Route path="/user-management" element={<UserManagement />} />
          
          {/* User Management - API Connected (new) */}
          <Route path="/user-management-api" element={
            <ProtectedRoute requiredPermission="view users">
              <UserManagementConnected />
            </ProtectedRoute>
          } />
          
          <Route path="/user-logs" element={<UserLogs />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/inbox" element={<Inbox />} />
          
          {/* Super Admin Only Routes */}
          <Route path="/roles-permissions" element={
            <ProtectedRoute requiredRole="Super Admin">
              <RolesPermissions />
            </ProtectedRoute>
          } />
          
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/support" element={<Support />} />
          <Route path="/users" element={<Users />} />
          <Route path="/air-craft-profile" element={<AirCraftProfile />} />
          <Route path="/my-lessons" element={<MyLessons />} />
          <Route path="/my-lessons/:id/tasks" element={<LessonTasks />} />
          <Route path="/lessons" element={<InstructorLessons />} />
          <Route path="/lessons/:id" element={<LessonDetails />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/setting" element={<Setting />} />

          {/* Nested Routes */}
          <Route path="/roles-permissions/create" element={<Roles />} />
          <Route path="/roles-permissions/:id" element={<RoleDetails />} />
          <Route path="/announcements/compose" element={<Compose />} />
          <Route path="/announcements/edit/:id" element={<Compose />} />
          <Route path="/user-management/profile/:id" element={<UserProfilePage />} />
          <Route path="/user-management/organization/:id" element={<OrganizationDetail />} />
          <Route path="/subscriptions/plans/:id" element={<Plans />} />
          <Route path="/support/chatsupport/:id?" element={<Chatsupport />} />
          <Route path="/users/profile/:id" element={<UserProfile />} />
          <Route path="/air-craft-profile/aircraft/:id" element={<AirCraftDetail />} />
          <Route path="/my-lessons/:id" element={<LessonDetails />} />
          <Route path="/instructors/instructorprofile/:id" element={<InstructorProfile />} />
        </Route>
    </Routes>
  );
};

export default App;
