import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiMoreVertical } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { lessonService } from "../../api/services/lessonService";
import { reservationService } from "../../api/services/reservationService";

const UpcomingBookings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await lessonService.getReservations({
          per_page: 5,
          status: 'pending'
        });
        if (response.success) {
          const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          
          const formattedBookings = list.map(item => {
            const dateObj = new Date(item.reservation_date || item.start_time || new Date());
            const firstStudent = item.students?.[0] || item.student;
            const studentName = firstStudent ? (firstStudent.name || `${firstStudent.first_name || ''} ${firstStudent.last_name || ''}`) : 'N/A';
            
            return {
              id: item.id,
              date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              time: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              student: studentName.trim() || 'N/A',
              aircraft: item.aircraft?.registration || item.aircraft?.serial_number || item.aircraft?.name || item.aircraft?.model || 'N/A',
              flightType: item.flight_type || item.type || item.lesson_type || 'Flight'
            };
          });
          
          setBookings(formattedBookings);
        }
      } catch (err) {
        console.error('Error fetching upcoming bookings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu !== null && menuRefs.current[openMenu] && !menuRefs.current[openMenu].contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const filteredBookings = bookings.filter((booking) =>
    booking.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.aircraft.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuToggle = (id) => {
    setOpenMenu(openMenu === id ? null : id);
  };

  const handleCancelBooking = async (bookingId) => {
    setOpenMenu(null);
    
    const { value: reason } = await Swal.fire({
      title: 'Cancel Booking',
      input: 'textarea',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Type your reason here...',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Continue',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'You need to provide a reason!';
        }
      }
    });

    if (reason) {
      const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to cancel this booking permanently.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, cancel it!'
      });

      if (confirmResult.isConfirmed) {
        try {
          // Pass reason if the backend supports it, otherwise just delete
          await reservationService.deleteReservation(bookingId, { cancel_reason: reason });
          
          Swal.fire(
            'Cancelled!',
            'The booking has been successfully cancelled.',
            'success'
          );
          
          // Remove the booking from the list
          setBookings(prev => prev.filter(b => b.id !== bookingId));
        } catch (error) {
          console.error("Cancellation error:", error);
          Swal.fire(
            'Error!',
            error?.response?.data?.message || 'Failed to cancel the booking. Please try again.',
            'error'
          );
        }
      }
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Upcoming Bookings
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
            <FiSearch className="text-gray-400 mr-2" size={16} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Dates
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Time
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Students
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Aircraft
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Flight Type
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500 text-sm">
                  Loading bookings...
                </td>
              </tr>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {booking.date}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {booking.time}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {booking.student}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {booking.aircraft}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700 capitalize">
                    {booking.flightType}
                  </td>
                  <td className="py-4 px-4">
                    <div className="relative" ref={(el) => (menuRefs.current[booking.id] = el)}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuToggle(booking.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition"
                      >
                        <FiMoreVertical className="text-gray-600" size={18} />
                      </button>
                      {openMenu === booking.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/reservations/${booking.id}`); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/calendar?edit=${booking.id}`); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit in Calendar
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg font-medium"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-8 text-gray-500 text-sm"
                >
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingBookings;
