import React, { useState, useEffect } from 'react';
import Widgets from '../ui/Widgets';
import { api } from '../../api/apiClient';
import { ENDPOINTS } from '../../api/config';
import { logbookService } from '../../api/services/logbookService';
import { lessonService } from '../../api/services/lessonService';
import { aircraftService } from '../../api/services/aircraftService';

const SummaryCards = () => {
  const [supportTicketsCount, setSupportTicketsCount] = useState(0);
  const [totalFlights, setTotalFlights] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState(0);
  const [aircraftInUse, setAircraftInUse] = useState(0);
  const [loading, setLoading] = useState({
    tickets: true,
    flights: true,
    bookings: true,
    aircraft: true
  });

  useEffect(() => {
    // Fetch Support Tickets
    const fetchSupportTickets = async () => {
      try {
        const response = await api.get(ENDPOINTS.SUPPORT.LIST, {
          params: {
            per_page: 1, 
            status: 'open', 
          },
        });

        if (response.success) {
          let total = 0;
          if (response.data?.meta?.total) {
            total = response.data.meta.total;
          } else if (response.data?.total) {
            total = response.data.total;
          } else if (Array.isArray(response.data)) {
            total = response.data.length;
          } else if (response.data?.data) {
            if (response.data.meta?.total) {
              total = response.data.meta.total;
            } else if (Array.isArray(response.data.data)) {
              total = response.data.data.length;
            }
          }
          setSupportTicketsCount(total);
        }
      } catch (err) {
        console.error('Error fetching support tickets:', err);
        setSupportTicketsCount(0);
      } finally {
        setLoading(prev => ({ ...prev, tickets: false }));
      }
    };

    // Fetch Total Flights (Logbook entries)
    const fetchTotalFlights = async () => {
      try {
        const response = await logbookService.getEntries({ per_page: 1 });
        if (response.success) {
          const total = response.meta?.total || 0;
          setTotalFlights(total);
        }
      } catch (err) {
        console.error('Error fetching total flights:', err);
        setTotalFlights(0);
      } finally {
        setLoading(prev => ({ ...prev, flights: false }));
      }
    };

    // Fetch Upcoming Bookings (Reservations with pending/ongoing status)
    const fetchUpcomingBookings = async () => {
      try {
        const response = await lessonService.getReservations({ 
          per_page: 1,
          status: 'pending'
        });
        if (response.success) {
          const total = response.meta?.total || 0;
          setUpcomingBookings(total);
        }
      } catch (err) {
        console.error('Error fetching upcoming bookings:', err);
        setUpcomingBookings(0);
      } finally {
        setLoading(prev => ({ ...prev, bookings: false }));
      }
    };

    // Fetch Aircraft In Use (status: in_service)
    const fetchAircraftInUse = async () => {
      try {
        const response = await aircraftService.getAircraft({ 
          per_page: 1000,
          status: 'in_service'
        });
        if (response.success) {
          const aircraftList = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          const inUseCount = aircraftList.filter(aircraft => 
            aircraft.status === 'in_service' || aircraft.status === 'In Service'
          ).length;
          setAircraftInUse(inUseCount);
        }
      } catch (err) {
        console.error('Error fetching aircraft in use:', err);
        setAircraftInUse(0);
      } finally {
        setLoading(prev => ({ ...prev, aircraft: false }));
      }
    };

    fetchSupportTickets();
    fetchTotalFlights();
    fetchUpcomingBookings();
    fetchAircraftInUse();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Widgets
        bgColor="#E9F0FC"
        textColor="#1751D0"
        label="Total Flights"
        count={loading.flights ? '...' : totalFlights}
        viewLink="/logbook"
      />
      <Widgets
        bgColor="#E6F7E6"
        textColor="#10B981"
        label="Upcoming Bookings"
        count={loading.bookings ? '...' : upcomingBookings}
        viewLink="/calendar"
      />
      <Widgets
        bgColor="#FEE2E2"
        textColor="#EF4444"
        label="Aircraft In Use"
        count={loading.aircraft ? '...' : aircraftInUse}
        viewLink="/air-craft-profile"
      />
      <Widgets
        bgColor="#FFF1DA"
        textColor="#EC980C"
        label="Support Tickets"
        count={loading.tickets ? '...' : supportTicketsCount}
        viewLink="/support"
      />
    </div>
  );
};

export default SummaryCards;
