import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiMoreVertical } from "react-icons/fi";

const UpcomingBookings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const menuRefs = useRef({});

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu !== null && menuRefs.current[openMenu] && !menuRefs.current[openMenu].contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  
  const bookings = [
    {
      id: 1,
      date: "Jun 15",
      time: "9 AM",
      student: "Guy Hawkins",
      aircraft: "JK600",
      flightType: "Loremipsum",
    },
    {
      id: 2,
      date: "Jun 16",
      time: "10 AM",
      student: "Jane Smith",
      aircraft: "JK601",
      flightType: "Training",
    },
    {
      id: 3,
      date: "Jun 17",
      time: "2 PM",
      student: "John Doe",
      aircraft: "JK602",
      flightType: "Practice",
    },
  ];

  const filteredBookings = bookings.filter((booking) =>
    booking.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.aircraft.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuToggle = (id) => {
    setOpenMenu(openMenu === id ? null : id);
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
            {filteredBookings.length > 0 ? (
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
                  <td className="py-4 px-4 text-sm text-gray-700">
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
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
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
