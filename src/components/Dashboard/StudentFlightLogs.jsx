import React, { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { HiDotsVertical } from "react-icons/hi";
import { lessonService } from "../../api/services/lessonService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


const getStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-600";
  
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'pending':
      return "bg-[#FFF1DA] text-[#C47E0A]";
    case 'ongoing':
      return "bg-[#EBF0FB] text-[#113B98]";
    case 'completed':
      return "bg-[#E1FAEA] text-[#016626]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};


const formatStatus = (status) => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const StudentFlightLogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRefs = useRef({});

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await lessonService.getUserLessons(user.id, {
          per_page: 10, 
          page: 1,
          type: 'student',
        });

        if (response.success) {
          const transformedLessons = (response.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date || lesson.lesson_date,
            time: lesson.time || lesson.full_time || lesson.lesson_time,
            instructor: lesson.instructor_name || lesson.instructor || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
          }));
          
          setLessons(transformedLessons);
        }
      } catch (error) {
        console.error('Error fetching flight logs:', error);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [user?.id]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu !== null && menuRefs.current[openMenu] && !menuRefs.current[openMenu].contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const filteredLessons = lessons.filter((lesson) =>
    (lesson.instructor && lesson.instructor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lesson.flightType && lesson.flightType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lesson.date && lesson.date.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleMenuToggle = (id) => {
    setOpenMenu(openMenu === id ? null : id);
  };

  const handleViewDetails = (lessonId) => {
    navigate(`/my-lessons/${lessonId}`);
    setOpenMenu(null);
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Flight Logs</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
            <FiSearch className="text-gray-400 mr-2" size={16} />
            <input
              type="text"
              placeholder="Q Search"
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
                Instructor
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Status
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
            {filteredLessons.length > 0 ? (
              filteredLessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {lesson.date ? new Date(lesson.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {lesson.time || 'N/A'}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {lesson.instructor}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(lesson.status)}`}
                    >
                      {formatStatus(lesson.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {lesson.flightType}
                  </td>
                  <td className="py-4 px-4">
                    <div className="relative" ref={(el) => (menuRefs.current[lesson.id] = el)}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuToggle(lesson.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition"
                      >
                        <HiDotsVertical className="text-gray-600" size={18} />
                      </button>
                      {openMenu === lesson.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(lesson.id);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            View Details
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
                  No flight logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentFlightLogs;

