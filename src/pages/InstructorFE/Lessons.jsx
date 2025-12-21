import React, { useState, useRef, useEffect } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import Pagination from "../../components/Pagination";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { lessonService } from "../../api/services/lessonService";

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

  const handleViewClick = (lessonId) => {
    // Navigate to lesson details page
    navigate(`/lessons/${lessonId}`);
  };

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
        <div className="overflow-visible flex justify-between gap-3 py-5 px-4 border-b border-[#F3F4F6]">
          <h2 className="text-xl font-semibold">Lessons</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Request Button */}
            <button
              onClick={() => setShowRequests(!showRequests)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showRequests
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Request
            </button>
            
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm grow sm:grow-0 w-full">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
                ⌘
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="relative sort-container" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700"
              >
                <MdFilterList className="w-5 h-5" />
                <span className="whitespace-nowrap">Sort by</span>
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {["Newest", "Oldest"].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setSortOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === option
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs - Hide when showing requests */}
        {!showRequests && (
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 border-b py-3 px-4 border-[#F3F4F6]">
            {["All", "Pending", "Ongoing", "Completed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedTab === tab
                    ? "bg-[#C6E4FF] text-[#262628]"
                    : "text-[#8A8A8A] hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto py-5 px-4">
          <table className="min-w-full border border-gray-200 text-sm relative">
            <thead className="bg-[#FAFAFA] text-[#090909] text-left">
              <tr>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Student</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Dates</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Time</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Flight Type</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Notes</th>
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
                    <td className="py-2 px-3 border border-[#E5E1E6] text-center relative">
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    {showRequests ? "No requested sessions found" : "No lessons found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden py-4 px-3">
          {currentItems.length > 0 ? (
            currentItems.map((lesson) => (
              <div key={lesson.id} className="border border-[#E5E7EB] rounded-xl p-4 bg-white shadow-sm relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium text-gray-900">{lesson.student}</h3>
                    <p className="text-xs text-[#797979] mt-1">{lesson.flightType}</p>
                  </div>
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
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600"><span className="font-medium">Date:</span> {lesson.date}</p>
                  <p className="text-xs text-gray-600"><span className="font-medium">Time:</span> {lesson.time}</p>
                  <p className="text-xs text-gray-600"><span className="font-medium">Notes:</span> {lesson.notes}</p>
                </div>
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
    </div>
  );
};

export default InstructorLessons;

