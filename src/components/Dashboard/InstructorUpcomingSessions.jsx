import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiMoreVertical } from "react-icons/fi";
import { useAuth } from '../../context/AuthContext';
import { lessonService } from '../../api/services/lessonService';

const InstructorUpcomingSessions = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRefs = useRef({});

  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch upcoming lessons (status: pending or ongoing, future dates)
        const response = await lessonService.getUserLessons(user.id, {
          type: 'instructor',
          per_page: 50,
          status: 'pending,ongoing',
        });

        if (response.success) {
          const allLessons = response.data || [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Filter upcoming sessions (future dates or today)
          const upcoming = allLessons
            .filter((lesson) => {
              const lessonDate = new Date(lesson.full_date || lesson.lesson_date);
              lessonDate.setHours(0, 0, 0, 0);
              return lessonDate >= today;
            })
            .sort((a, b) => {
              const dateA = new Date(a.full_date || a.lesson_date);
              const dateB = new Date(b.full_date || b.lesson_date);
              return dateA - dateB;
            })
            .slice(0, 10) // Get top 10 upcoming
            .map((lesson) => ({
              id: lesson.id,
              date: lesson.date || new Date(lesson.full_date || lesson.lesson_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              time: lesson.time || new Date(lesson.full_time || lesson.lesson_time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
              student: lesson.student || 'N/A',
              aircraft: lesson.aircraft || 'N/A',
              flightType: lesson.flight_type || 'N/A',
            }));

          setSessions(upcoming);
        }
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
        // Use sample data if API fails
        setSessions([
          {
            id: 1,
            date: "Jun 15",
            time: "9 AM",
            student: "Guy Hawkins",
            aircraft: "JK600",
            flightType: "Loremipsum is a dummy text",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingSessions();
  }, [user?.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu !== null && menuRefs.current[openMenu] && !menuRefs.current[openMenu].contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const filteredSessions = sessions.filter((session) =>
    session.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.aircraft.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.flightType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="border border-gray-200 bg-white rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white rounded-xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-800">Upcoming Sessions</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm grow sm:grow-0">
            <FiSearch className="text-gray-400 mr-2" size={16} />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-[#FAFAFA] text-[#090909] text-left">
            <tr>
              <th className="py-3 px-4 font-medium border border-[#E5E1E6]">Dates</th>
              <th className="py-3 px-4 font-medium border border-[#E5E1E6]">Time</th>
              <th className="py-3 px-4 font-medium border border-[#E5E1E6]">Students</th>
              <th className="py-3 px-4 font-medium border border-[#E5E1E6]">Aircraft</th>
              <th className="py-3 px-4 font-medium border border-[#E5E1E6]">Flight Type</th>
              <th className="py-3 px-4 font-medium border border-[#E5E1E6] text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-[#3D3D3D] bg-[#FFFFFF]">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border border-[#E5E1E6]">{session.date}</td>
                  <td className="py-3 px-4 border border-[#E5E1E6]">{session.time}</td>
                  <td className="py-3 px-4 border border-[#E5E1E6]">{session.student}</td>
                  <td className="py-3 px-4 border border-[#E5E1E6]">{session.aircraft}</td>
                  <td className="py-3 px-4 border border-[#E5E1E6]">{session.flightType}</td>
                  <td className="py-3 px-4 border border-[#E5E1E6] text-center relative">
                    <div
                      ref={(el) => (menuRefs.current[session.id] = el)}
                      className="inline-block"
                    >
                      <FiMoreVertical
                        className="text-[#5C5F62] cursor-pointer mx-auto"
                        onClick={() => setOpenMenu(openMenu === session.id ? null : session.id)}
                      />
                      {openMenu === session.id && (
                        <div className="absolute right-5 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                            View
                          </button>
                          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                            Edit
                          </button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  No upcoming sessions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstructorUpcomingSessions;

