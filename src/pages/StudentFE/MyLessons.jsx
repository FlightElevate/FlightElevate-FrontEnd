import React, { useState, useRef, useEffect } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import Pagination from "../../components/Pagination";
import { Link } from "react-router-dom";

const lessonsData = [
  { id: 1, date: "Jun 15", time: "9 AM", instructor: "Dianne Russell", status: "Ongoing", flightType: "Solo" },
  { id: 2, date: "Aug 01", time: "3 PM", instructor: "Jane Cooper", status: "Completed", flightType: "Duo Landing" },
  { id: 3, date: "Jun 23", time: "1 PM", instructor: "Brooklyn Simmons", status: "Pending", flightType: "Windy Smooth landing" },
  { id: 4, date: "Jun 23", time: "1 PM", instructor: "Jacob Jones", status: "Ongoing", flightType: "Emergency" },
  { id: 5, date: "Jun 23", time: "1 PM", instructor: "Guy Hawkins", status: "Pending", flightType: "Emergency" },
  { id: 6, date: "Jun 23", time: "1 PM", instructor: "Eleanor Pena", status: "Pending", flightType: "Crash landing" },
];

const statusColors = {
  Pending: "bg-[#FFF1DA] text-[#C47E0A]",
  Ongoing: "bg-[#EBF0FB] text-[#113B98]",
  Completed: "bg-[#E1FAEA] text-[#016626]",
};

const MyLessons = ({ showReadyButton = false }) => {
  const [selectedTab, setSelectedTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState("Newest");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);

  const sortRef = useRef(null);

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

  // Filtering and sorting
  let filteredData = lessonsData.filter(
    (lesson) =>
      (selectedTab === "All" || lesson.status === selectedTab) &&
      (lesson.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.flightType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

 filteredData = filteredData.sort((a, b) =>
    sortBy === "Newest" ? b.id - a.id : a.id - b.id
  );

  const totalItems = filteredData.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-3">
      <div className="border border-gray-200 bg-white rounded-xl">
        <div className="overflow-visible flex justify-between gap-3 py-5 px-4 border-b border-[#F3F4F6]">
          <h2 className="text-xl font-semibold">My Lessons</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
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

        {/* Tabs */}
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

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto py-5 px-4">
          <table className="min-w-full border border-gray-200 text-sm relative">
            <thead className="bg-[#FAFAFA] text-[#090909] text-left">
              <tr>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Date</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Time</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Instructor</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">{showReadyButton ? "Action" : "Status"}</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Flight Type</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#3D3D3D] bg-[#FFFFFF]">
              {currentItems.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50 relative">
                  <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.date}</td>
                  <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.time}</td>
                  <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.instructor}</td>
                  <td className="py-2 px-3 border border-[#E5E1E6]">
                    {showReadyButton ? (
                      <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                        Ready
                      </button>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded ${statusColors[lesson.status]}`}>
                        {lesson.status}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.flightType}</td>
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
                          <Link
                            to="/my-lessons/lessondetails"
                            onClick={() => setOpenMenuId(null)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            View
                          </Link>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden py-4 px-3">
          {currentItems.map((lesson) => (
            <div key={lesson.id} className="border border-[#E5E7EB] rounded-xl p-4 flex justify-between items-center bg-white shadow-sm relative">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-900">{lesson.flightType}</h3>
                <p className="text-xs text-[#797979] mt-1">{lesson.instructor}</p>
              </div>
              <div className="flex items-center gap-4 relative">
                <button className="px-3 py-1 text-sm font-medium bg-[#1376CD] text-white rounded-md hover:bg-blue-700 transition">
                  Ready
                </button>
                <div className="menu-container relative">
                  <HiDotsVertical
                    className="text-[#5C5F62] cursor-pointer"
                    onClick={() => setOpenMenuId(openMenuId === lesson.id ? null : lesson.id)}
                  />
                  {openMenuId === lesson.id && (
                    <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <Link
                        to="/my-lessons/lessondetails"
                        onClick={() => setOpenMenuId(null)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        View
                      </Link>
                      <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Edit</button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="gap-3 text-sm">
          <Pagination
            page={currentPage}
            setPage={setCurrentPage}
            perPage={itemsPerPage}
            setPerPage={setItemsPerPage}
            totalItems={totalItems}
          />
        </div>
      </div>
    </div>
  );
};

export default MyLessons;
