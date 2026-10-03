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
    const fetchSupportTickets = async () => {
      try {
        const response = await api.get(ENDPOINTS.SUPPORT.LIST, {
          params: {
            per_page: 1,
            status: 'open',
          },
        });

        if (response.success) {
          setSupportTicketsCount(response.meta?.total || 0);
        }
      } catch (err) {
        console.error('Error fetching support tickets:', err);
        setSupportTicketsCount(0);
      } finally {
        setLoading(prev => ({ ...prev, tickets: false }));
      }
    };

    const fetchTotalFlights = async () => {
      try {
        const response = await logbookService.getEntries({ per_page: 1 });
        if (response.success) {
          setTotalFlights(response.meta?.total || 0);
        }
      } catch (err) {
        console.error('Error fetching total flights:', err);
        setTotalFlights(0);
      } finally {
        setLoading(prev => ({ ...prev, flights: false }));
      }
    };

    // Match Upcoming Sessions: include bookings dated today or later,
    // excluding canceled, completed, and no-show reservations.
    const fetchUpcomingBookings = async () => {
      try {
        const firstPage = await lessonService.getReservations({
          per_page: 100,
          page: 1
        });

        if (!firstPage.success) {
          throw new Error('Could not load reservations');
        }

        const getReservations = response => {
          if (Array.isArray(response?.data)) return response.data;
          if (Array.isArray(response?.data?.data)) return response.data.data;
          return [];
        };

        const lastPage = Number(
          firstPage.meta?.last_page ??
          firstPage.data?.meta?.last_page ??
          1
        );

        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, lastPage - 1) }, (_, index) =>
            lessonService.getReservations({
              per_page: 100,
              page: index + 2
            })
          )
        );

        const reservations = [
          ...getReservations(firstPage),
          ...remainingPages.flatMap(getReservations)
        ];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const inactiveStatuses = new Set([
          'cancelled',
          'canceled',
          'completed',
          'no_show',
          'no-show'
        ]);

        const count = reservations.filter(reservation => {
          const status = String(reservation.status || '').toLowerCase();
          if (inactiveStatuses.has(status)) return false;

          const dateValue =
            reservation.full_date ||
            reservation.reservation_date ||
            reservation.date ||
            reservation.start_date ||
            reservation.scheduled_date ||
            reservation.booking_date ||
            reservation.flight_date;

          if (!dateValue) return false;

          const dateText = String(dateValue).trim();
          const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);

          let scheduledDate;
          if (match) {
            scheduledDate = new Date(
              Number(match[1]),
              Number(match[2]) - 1,
              Number(match[3])
            );
          } else {
            scheduledDate = new Date(dateText.replace(' ', 'T'));
          }

          return (
            !Number.isNaN(scheduledDate.getTime()) &&
            scheduledDate >= today
          );
        }).length;

        setUpcomingBookings(count);
      } catch (err) {
        console.error('Error fetching upcoming bookings:', err);
        setUpcomingBookings(0);
      } finally {
        setLoading(prev => ({ ...prev, bookings: false }));
      }
    };

    const fetchAircraftInUse = async () => {
      try {
        const response = await aircraftService.getAircraft({
          per_page: 1000,
          status: 'in_service'
        });

        if (response.success) {
          const aircraftList = Array.isArray(response.data)
            ? response.data
            : (response.data?.data || []);

          const inUseCount = aircraftList.filter(aircraft =>
            aircraft.status === 'in_service' ||
            aircraft.status === 'In Service'
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Widgets
        bgColor="#FFFFFF"
        textColor="#475569"
        label="Total Flights"
        count={loading.flights ? '...' : totalFlights}
        viewLink="/logbook"
        cardClassName="rounded-xl border border-gray-200 p-5 transition-colors hover:border-gray-300"
        labelClassName="font-heading !mb-4 !text-sm !font-medium"
        countClassName="font-num !text-3xl !font-semibold !leading-none !tracking-tight !text-slate-950"
        linkClassName="mt-5 block border-t border-gray-100 pt-3 !text-sm !font-medium"
      />

      <Widgets
        bgColor="#FFFFFF"
        textColor="#475569"
        label="Upcoming Bookings"
        count={loading.bookings ? '...' : upcomingBookings}
        viewLink="/calendar"
        cardClassName="rounded-xl border border-gray-200 p-5 transition-colors hover:border-gray-300"
        labelClassName="font-heading !mb-4 !text-sm !font-medium"
        countClassName="font-num !text-3xl !font-semibold !leading-none !tracking-tight !text-slate-950"
        linkClassName="mt-5 block border-t border-gray-100 pt-3 !text-sm !font-medium"
      />

      <Widgets
        bgColor="#FFFFFF"
        textColor="#475569"
        label="Aircraft In Use"
        count={loading.aircraft ? '...' : aircraftInUse}
        viewLink="/air-craft-profile"
        cardClassName="rounded-xl border border-gray-200 p-5 transition-colors hover:border-gray-300"
        labelClassName="font-heading !mb-4 !text-sm !font-medium"
        countClassName="font-num !text-3xl !font-semibold !leading-none !tracking-tight !text-slate-950"
        linkClassName="mt-5 block border-t border-gray-100 pt-3 !text-sm !font-medium"
      />

      <Widgets
        bgColor="#FFFFFF"
        textColor="#475569"
        label="Support Tickets"
        count={loading.tickets ? '...' : supportTicketsCount}
        viewLink="/support"
        cardClassName="rounded-xl border border-gray-200 p-5 transition-colors hover:border-gray-300"
        labelClassName="font-heading !mb-4 !text-sm !font-medium"
        countClassName="font-num !text-3xl !font-semibold !leading-none !tracking-tight !text-slate-950"
        linkClassName="mt-5 block border-t border-gray-100 pt-3 !text-sm !font-medium"
      />
    </div>
  );
};

export default SummaryCards;
