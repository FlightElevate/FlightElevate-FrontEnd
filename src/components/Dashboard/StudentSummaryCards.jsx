import React, { useState, useEffect } from 'react';
import Widgets from '../ui/Widgets';
import { api } from '../../api/apiClient';
import { ENDPOINTS } from '../../api/config';
import { lessonService } from '../../api/services/lessonService';
import { useAuth } from '../../context/AuthContext';

const StudentSummaryCards = () => {
  const { user } = useAuth();
  const [upcomingLessons, setUpcomingLessons] = useState(0);
  const [totalFlightsLogged, setTotalFlightsLogged] = useState(0);
  const [totalFlightHours, setTotalFlightHours] = useState(0);
  const [supportTicketsCount, setSupportTicketsCount] = useState(0);
  const [loading, setLoading] = useState({
    upcoming: true,
    flights: true,
    hours: true,
    tickets: true,
  });

  
  useEffect(() => {
    const fetchUpcomingLessons = async () => {
      if (!user?.id) {
        setLoading(prev => ({ ...prev, upcoming: false }));
        return;
      }

      try {
        const response = await lessonService.getUserLessons(user.id, {
          per_page: 1,
          page: 1,
          type: 'student',
          status: 'ongoing',
        });

        if (response.success) {
          const total = response.meta?.total || response.data?.total || 
                       (Array.isArray(response.data) ? response.data.length : 0);
          setUpcomingLessons(total);
        }
      } catch (err) {
        console.error('Error fetching upcoming lessons:', err);
        setUpcomingLessons(0);
      } finally {
        setLoading(prev => ({ ...prev, upcoming: false }));
      }
    };

    fetchUpcomingLessons();
  }, [user?.id]);

  
  useEffect(() => {
    const fetchTotalFlights = async () => {
      if (!user?.id) {
        setLoading(prev => ({ ...prev, flights: false }));
        return;
      }

      try {
        const response = await lessonService.getUserLessons(user.id, {
          per_page: 1,
          page: 1,
          type: 'student',
        });

        if (response.success) {
          const total = response.meta?.total || response.data?.total || 
                       (Array.isArray(response.data) ? response.data.length : 0);
          setTotalFlightsLogged(total);
        }
      } catch (err) {
        console.error('Error fetching total flights:', err);
        setTotalFlightsLogged(0);
      } finally {
        setLoading(prev => ({ ...prev, flights: false }));
      }
    };

    fetchTotalFlights();
  }, [user?.id]);

  
  useEffect(() => {
    const fetchTotalHours = async () => {
      if (!user?.id) {
        setLoading(prev => ({ ...prev, hours: false }));
        return;
      }

      try {
        const response = await lessonService.getUserLessons(user.id, {
          per_page: 100, 
          page: 1,
          type: 'student',
        });

        if (response.success) {
          const lessons = response.data || [];
          
          const totalMinutes = lessons.reduce((sum, lesson) => {
            return sum + (parseInt(lesson.duration_minutes) || 0);
          }, 0);
          const totalHours = Math.round(totalMinutes / 60);
          setTotalFlightHours(totalHours);
        }
      } catch (err) {
        console.error('Error fetching flight hours:', err);
        setTotalFlightHours(0);
      } finally {
        setLoading(prev => ({ ...prev, hours: false }));
      }
    };

    fetchTotalHours();
  }, [user?.id]);

  
  useEffect(() => {
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

    fetchSupportTickets();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Widgets
        bgColor="#E9F0FC"
        textColor="#1751D0"
        label="Upcoming Flight Lessons"
        count={loading.upcoming ? '...' : upcomingLessons}
        viewLink="/my-lessons"
      />
      <Widgets
        bgColor="#E6F7E6"
        textColor="#10B981"
        label="Total Flights Logged"
        count={loading.flights ? '...' : totalFlightsLogged}
        viewLink="/my-lessons"
      />
      <Widgets
        bgColor="#FEE2E2"
        textColor="#EF4444"
        label="Total Flights Hours"
        count={loading.hours ? '...' : totalFlightHours}
        viewLink="/my-lessons"
      />
      <Widgets
        bgColor="#FFF1DA"
        textColor="#EC980C"
        label="Support Tickets"
        count={loading.tickets ? '--' : supportTicketsCount}
        viewLink="/support"
      />
    </div>
  );
};

export default StudentSummaryCards;

