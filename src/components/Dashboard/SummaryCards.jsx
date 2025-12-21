import React, { useState, useEffect } from 'react';
import Widgets from '../ui/Widgets';
import { api } from '../../api/apiClient';
import { ENDPOINTS } from '../../api/config';

const SummaryCards = () => {
  const [supportTicketsCount, setSupportTicketsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupportTickets = async () => {
      try {
        // Fetch support tickets to get count
        const response = await api.get(ENDPOINTS.SUPPORT.LIST, {
          params: {
            per_page: 1, // We only need the total count
            status: 'open', // Get open tickets
          },
        });

        if (response.success) {
          // Handle different response structures
          let total = 0;
          
          // Check if response has pagination meta
          if (response.data?.meta?.total) {
            total = response.data.meta.total;
          } 
          // Check if response has direct total
          else if (response.data?.total) {
            total = response.data.total;
          }
          // Check if response is an array
          else if (Array.isArray(response.data)) {
            total = response.data.length;
          }
          // Check if response.data.data exists (nested structure)
          else if (response.data?.data) {
            if (response.data.meta?.total) {
              total = response.data.meta.total;
            } else if (Array.isArray(response.data.data)) {
              total = response.data.data.length;
            }
          }
          
          setSupportTicketsCount(total);
        }
      } catch (err) {
        // API endpoint might not be implemented yet, show 0
        console.error('Error fetching support tickets:', err);
        setSupportTicketsCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSupportTickets();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Widgets
        bgColor="#E9F0FC"
        textColor="#1751D0"
        label="Total Flights"
        count={76}
        viewLink="#"
      />
      <Widgets
        bgColor="#E6F7E6"
        textColor="#10B981"
        label="Upcoming Bookings"
        count={12}
        viewLink="#"
      />
      <Widgets
        bgColor="#FEE2E2"
        textColor="#EF4444"
        label="Aircraft In Use"
        count={4}
        viewLink="#"
      />
      <Widgets
        bgColor="#FFF1DA"
        textColor="#EC980C"
        label="Support Tickets"
        count={loading ? '...' : supportTicketsCount}
        viewLink="/support"
      />
    </div>
  );
};

export default SummaryCards;
