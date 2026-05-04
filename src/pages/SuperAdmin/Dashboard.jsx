import React, { useState, useEffect } from "react";
import Widgets from "../../components/ui/Widgets";
import FSession from "../../components/Dashboard/FSession";
import TotalRevenue from "../../components/Dashboard/TotalRevenue";
import { superAdminService } from "../../api/services/superAdminService";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_organizations: 0,
    total_users: 0,
    total_earnings: 0,
    pending_requests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await superAdminService.getStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 bg-white inset-shadow-sm shadow-xl rounded-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome to FlightElevate Super Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Widgets
          bgColor="#E9F0FC"
          textColor="#1751D0"
          label="Total Organizations"
          count={loading ? "..." : stats.total_organizations}
          viewLink="/user-management?tab=Organization"
        />
        <Widgets
          bgColor="#FFF1DA"
          textColor="#EC980C"
          label="Earnings"
          count={loading ? "..." : `$${stats.total_earnings}`}
          viewLink="/subscription-plans"
        />
        <Widgets
          bgColor="#E7F7EF"
          textColor="#0D894F"
          label="Active Users"
          count={loading ? "..." : stats.total_users}
          viewLink="/users"
        />
        <Widgets
          bgColor="#FEE2E2"
          textColor="#991B1B"
          label="Pending Requests"
          count={loading ? "..." : stats.pending_requests}
          viewLink="/user-management?tab=Request"
        />
      </div>
      <div className="flex flex-col gap-6">
        <FSession />
        <TotalRevenue />
      </div>
    </div>
  );
};

Dashboard.displayName = 'SuperAdminDashboard';

export default Dashboard;
