import React, { useState, useRef, useEffect } from "react";
import { HiDotsVertical, HiChevronDown } from "react-icons/hi";
import { FiSearch, FiCheck, FiX, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import Pagination from "../../components/Pagination";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { lessonService } from "../../api/services/lessonService";
import { userService } from "../../api/services/userService";
import { aircraftService } from "../../api/services/aircraftService";
import { showSuccessToast, showErrorToast } from "../../utils/notifications";

// Get status colors with case-insensitive matching
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
    case 'requested':
      return "bg-[#FFF3CD] text-[#856404]"; // Yellow for requests
    default:
      return "bg-gray-100 text-gray-600";
  }
};

// Format status for display (capitalize first letter)
const formatStatus = (status) => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const InstructorLessons = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState("Newest");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [showRequests, setShowRequests] = useState(false);

  const sortRef = useRef(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [aircraft, setAircraft] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Lesson form state
  const [lessonForm, setLessonForm] = useState({
    student_id: '',
    aircraft_id: '',
    flight_type: '',
    lesson_date: '',
    lesson_time: '',
    duration_minutes: 60,
    notes: '',
  });

  const handleViewClick = (lessonId) => {
    // Navigate to lesson details page
    navigate(`/lessons/${lessonId}`);
  };

  const handleAcceptRequest = async (lessonId) => {
    setAcceptingId(lessonId);
    try {
      const response = await lessonService.updateLesson(lessonId, {
        status: 'pending'
      });
      if (response.success) {
        showSuccessToast('Session request accepted');
        // Refresh lessons list
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
          type: 'instructor'
        };
        if (showRequests) {
          params.status = 'requested';
        }
        const refreshResponse = await lessonService.getUserLessons(user.id, params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to accept session request');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeclineRequest = async (lessonId) => {
    setDecliningId(lessonId);
    try {
      const response = await lessonService.updateLesson(lessonId, {
        status: 'cancelled'
      });
      if (response.success) {
        showSuccessToast('Session request declined');
        // Refresh lessons list
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
          type: 'instructor'
        };
        if (showRequests) {
          params.status = 'requested';
        }
        const refreshResponse = await lessonService.getUserLessons(user.id, params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to decline session request');
    } finally {
      setDecliningId(null);
    }
  };

  // Fetch students for the instructor's organization
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.organization_id && !user?.organization?.id) return;
      
      setLoadingStudents(true);
      try {
        const orgId = user?.organization_id || user?.organization?.id;
        const response = await userService.getUsers({
          role: 'Student',
          organization_id: orgId,
          per_page: 100,
        });
        
        if (response.success) {
          setStudents(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (showAddLessonModal) {
      fetchStudents();
    }
  }, [user?.organization_id, user?.organization?.id, showAddLessonModal]);

  // Fetch aircraft for the instructor's organization
  useEffect(() => {
    const fetchAircraft = async () => {
      if (!user?.organization_id && !user?.organization?.id) return;
      
      try {
        const response = await aircraftService.getAircraft({
          per_page: 100,
          status: 'in_service',
        });
        
        if (response.success) {
          setAircraft(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching aircraft:', error);
        setAircraft([]);
      }
    };

    if (showAddLessonModal) {
      fetchAircraft();
    }
  }, [user?.organization_id, user?.organization?.id, showAddLessonModal]);

  // Fetch lessons from API
  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
          type: 'instructor'
        };
        
        // If showing requests, filter by requested status
        if (showRequests) {
          params.status = 'requested';
        }
        
        const response = await lessonService.getUserLessons(user.id, params);
        
        if (response.success) {
          const transformedLessons = (response.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
          }));
          
          setLessons(transformedLessons);
          setTotalItems(response.meta?.total || transformedLessons.length);
        }
      } catch (error) {
        console.error('Error fetching lessons:', error);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [user?.id, currentPage, itemsPerPage, showRequests]);

  // Handle lesson form changes
  const handleLessonFormChange = (e) => {
    const { name, value } = e.target;
    setLessonForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle lesson creation
  const handleCreateLesson = async () => {
    if (!lessonForm.student_id) {
      showErrorToast('Please select a student');
      return;
    }
    if (!lessonForm.flight_type) {
      showErrorToast('Please select a flight type');
      return;
    }
    if (!lessonForm.lesson_date) {
      showErrorToast('Please select a lesson date');
      return;
    }
    if (!lessonForm.lesson_time) {
      showErrorToast('Please select a lesson time');
      return;
    }

    setSubmitting(true);
    try {
      const lessonData = {
        ...lessonForm,
        instructor_id: user.id,
        student_id: parseInt(lessonForm.student_id),
        aircraft_id: lessonForm.aircraft_id ? parseInt(lessonForm.aircraft_id) : null,
        duration_minutes: parseInt(lessonForm.duration_minutes) || 60,
        status: 'pending',
      };

      const response = await lessonService.createLesson(lessonData);
      
      if (response.success) {
        showSuccessToast('Lesson created successfully');
        setShowAddLessonModal(false);
        setLessonForm({
          student_id: '',
          aircraft_id: '',
          flight_type: '',
          lesson_date: '',
          lesson_time: '',
          duration_minutes: 60,
          notes: '',
        });
        // Refresh lessons list
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
          type: 'instructor'
        };
        if (showRequests) {
          params.status = 'requested';
        }
        const refreshResponse = await lessonService.getUserLessons(user.id, params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create lesson';
      showErrorToast(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Close sort and menu dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".menu-container") && !e.target.closest(".sort-container")) {
        setOpenMenuId(null);
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtering and sorting (client-side for search and status filter)
  let filteredData = lessons.filter(
    (lesson) => {
      // If showing requests, only show lessons with "requested" status
      // Don't apply tab filtering when showing requests
      if (showRequests) {
        if (lesson.status?.toLowerCase() !== 'requested') {
          return false;
        }
        // Only apply search filter for requests
        const searchMatch = lesson.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.flightType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.aircraft?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        return searchMatch;
      } else {
        // If not showing requests, exclude requested status from regular view
        if (lesson.status?.toLowerCase() === 'requested') {
          return false;
        }
        
        const lessonStatus = lesson.status ? lesson.status.toLowerCase() : '';
        const selectedStatus = selectedTab === "All" ? null : selectedTab.toLowerCase();
        
        const statusMatch = selectedTab === "All" || lessonStatus === selectedStatus;
        const searchMatch = lesson.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.flightType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.aircraft?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return statusMatch && searchMatch;
      }
    }
  );

  filteredData = filteredData.sort((a, b) =>
    sortBy === "Newest" ? b.id - a.id : a.id - b.id
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="p-3">
        <div className="border border-gray-200 bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="border border-gray-200 bg-white rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Lessons</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Request Button */}
            <button
              onClick={() => setShowRequests(!showRequests)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap ${
                showRequests
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Request
            </button>
            
            {/* Search */}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-[250px] min-h-[44px]">
              <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full min-w-0"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:inline">
                ⌘
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full sm:w-auto sort-container" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700 min-h-[44px] whitespace-nowrap hover:bg-gray-50 transition-colors"
              >
                <MdFilterList className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Sort by</span>
                <HiChevronDown 
                  size={16} 
                  className={`transition-transform flex-shrink-0 ${sortOpen ? 'transform rotate-180' : ''}`}
                />
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-48 md:w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    {["Newest", "Oldest"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setSortOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                          sortBy === option
                            ? "text-blue-600 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        <span>{option}</span>
                        {sortBy === option && (
                          <span className="text-xs text-gray-500">{sortBy === "Newest" ? '↓' : '↑'}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs - Hide when showing requests */}
        {!showRequests && (
          <div className="bg-white border-b border-[#F3F4F6]">
            {/* Mobile: Vertical Tabs */}
            <div className="md:hidden">
              <div className="flex flex-col px-4 py-2">
                {["All", "Pending", "Ongoing", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`w-full text-left py-3 px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                      selectedTab === tab
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                {/* Add Lesson Button - Mobile */}
                <button
                  onClick={() => setShowAddLessonModal(true)}
                  className="w-full text-left py-3 px-4 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 min-h-[44px] flex items-center justify-center gap-2 mt-2"
                >
                  <FiPlus size={18} />
                  <span>Add Lesson</span>
                </button>
              </div>
            </div>

            {/* Desktop: Horizontal Tabs */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between gap-2 px-6 py-4">
                <div className="flex gap-2">
                  {["All", "Pending", "Ongoing", "Completed"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={`py-2.5 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center justify-center min-h-[44px] ${
                        selectedTab === tab
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {/* Add Lesson Button - Desktop */}
                <button
                  onClick={() => setShowAddLessonModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 min-h-[44px] whitespace-nowrap"
                >
                  <FiPlus size={18} />
                  <span>Add Lesson</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto py-4 sm:py-5 px-3 sm:px-4">
          <table className="min-w-full border border-gray-200 text-sm relative">
            <thead className="bg-[#FAFAFA] text-[#090909] text-left">
              <tr>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Student</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Dates</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Time</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Flight Type</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Notes</th>
                {showRequests && <th className="py-2 px-3 font-medium border border-[#E5E1E6] text-center">Status</th>}
                <th className="py-2 px-3 font-medium border border-[#E5E1E6] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#3D3D3D] bg-[#FFFFFF]">
              {currentItems.length > 0 ? (
                currentItems.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50 relative">
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.student}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.date}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.time}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.flightType}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.notes}</td>
                    {showRequests && (
                      <td className="py-2 px-3 border border-[#E5E1E6] text-center">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(lesson.status)}`}>
                          {formatStatus(lesson.status)}
                        </span>
                      </td>
                    )}
                    <td className="py-2 px-3 border border-[#E5E1E6] text-center relative">
                      {showRequests && lesson.status?.toLowerCase() === 'requested' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAcceptRequest(lesson.id)}
                            disabled={acceptingId === lesson.id}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 text-xs"
                            title="Accept request"
                          >
                            {acceptingId === lesson.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <FiCheck size={14} />
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(lesson.id)}
                            disabled={decliningId === lesson.id}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 text-xs"
                            title="Decline request"
                          >
                            {decliningId === lesson.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <FiX size={14} />
                                Decline
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="menu-container inline-block">
                          <HiDotsVertical
                            className="text-[#5C5F62] cursor-pointer"
                            onClick={() =>
                              setOpenMenuId(openMenuId === lesson.id ? null : lesson.id)
                            }
                          />
                          {openMenuId === lesson.id && (
                            <div className="absolute right-5 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleViewClick(lesson.id);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                View
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                                Edit
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showRequests ? "7" : "6"} className="py-8 text-center text-gray-500">
                    {showRequests ? "No requested sessions found" : "No lessons found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden py-4 px-3 sm:px-4">
          {currentItems.length > 0 ? (
            currentItems.map((lesson) => (
              <div key={lesson.id} className="border border-[#E5E7EB] rounded-xl p-4 bg-white shadow-sm relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium text-gray-900">{lesson.student}</h3>
                    <p className="text-xs text-[#797979] mt-1">{lesson.flightType}</p>
                    {showRequests && (
                      <span className={`mt-2 inline-block px-2 py-1 text-xs rounded font-medium ${getStatusColor(lesson.status)}`}>
                        {formatStatus(lesson.status)}
                      </span>
                    )}
                  </div>
                  {!showRequests || lesson.status?.toLowerCase() !== 'requested' ? (
                    <div className="menu-container relative">
                      <HiDotsVertical
                        className="text-[#5C5F62] cursor-pointer"
                        onClick={() => setOpenMenuId(openMenuId === lesson.id ? null : lesson.id)}
                      />
                      {openMenuId === lesson.id && (
                        <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleViewClick(lesson.id);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            View
                          </button>
                          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Edit</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600"><span className="font-medium">Date:</span> {lesson.date}</p>
                  <p className="text-xs text-gray-600"><span className="font-medium">Time:</span> {lesson.time}</p>
                  <p className="text-xs text-gray-600"><span className="font-medium">Notes:</span> {lesson.notes}</p>
                </div>
                {showRequests && lesson.status?.toLowerCase() === 'requested' && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleAcceptRequest(lesson.id)}
                      disabled={acceptingId === lesson.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 text-sm"
                    >
                      {acceptingId === lesson.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FiCheck size={16} />
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(lesson.id)}
                      disabled={decliningId === lesson.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 text-sm"
                    >
                      {decliningId === lesson.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FiX size={16} />
                          Decline
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {showRequests ? "No requested sessions found" : "No lessons found"}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="gap-3 text-sm">
          <Pagination
            page={currentPage}
            setPage={setCurrentPage}
            perPage={itemsPerPage}
            setPerPage={setItemsPerPage}
            totalItems={filteredData.length}
          />
        </div>
      </div>

      {/* Add Lesson Modal */}
      {showAddLessonModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Add New Lesson</h3>
              <button
                onClick={() => {
                  setShowAddLessonModal(false);
                  setLessonForm({
                    student_id: '',
                    aircraft_id: '',
                    flight_type: '',
                    lesson_date: '',
                    lesson_time: '',
                    duration_minutes: 60,
                    notes: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student <span className="text-red-500">*</span>
                </label>
                <select
                  name="student_id"
                  value={lessonForm.student_id}
                  onChange={handleLessonFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  required
                  disabled={loadingStudents}
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
                {loadingStudents && (
                  <p className="text-xs text-gray-500 mt-1">Loading students...</p>
                )}
              </div>

              {/* Flight Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flight Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="flight_type"
                  value={lessonForm.flight_type}
                  onChange={handleLessonFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  required
                >
                  <option value="">Select flight type</option>
                  <option value="Solo">Solo</option>
                  <option value="Duo Landing">Duo Landing</option>
                  <option value="Windy Smooth landing">Windy Smooth landing</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Crash landing">Crash landing</option>
                  <option value="Night Flight">Night Flight</option>
                  <option value="Cross Country">Cross Country</option>
                </select>
              </div>

              {/* Date and Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lesson Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="lesson_date"
                    value={lessonForm.lesson_date}
                    onChange={handleLessonFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Lesson Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="lesson_time"
                    value={lessonForm.lesson_time}
                    onChange={handleLessonFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    required
                  />
                </div>
              </div>

              {/* Aircraft and Duration Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Aircraft Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aircraft (Optional)
                  </label>
                  <select
                    name="aircraft_id"
                    value={lessonForm.aircraft_id}
                    onChange={handleLessonFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    <option value="">No aircraft selected</option>
                    {aircraft.map((ac) => (
                      <option key={ac.id} value={ac.id}>
                        {ac.name} {ac.model ? `(${ac.model})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={lessonForm.duration_minutes}
                    onChange={handleLessonFormChange}
                    min="15"
                    max="480"
                    step="15"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={lessonForm.notes}
                  onChange={handleLessonFormChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddLessonModal(false);
                  setLessonForm({
                    student_id: '',
                    aircraft_id: '',
                    flight_type: '',
                    lesson_date: '',
                    lesson_time: '',
                    duration_minutes: 60,
                    notes: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLesson}
                disabled={submitting || !lessonForm.student_id || !lessonForm.flight_type || !lessonForm.lesson_date || !lessonForm.lesson_time}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  'Create Lesson'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorLessons;

