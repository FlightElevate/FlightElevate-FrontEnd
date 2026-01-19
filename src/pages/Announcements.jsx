import React, { useState, useEffect, useRef } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { Link } from "react-router-dom";
import { announcementService } from "../api/services/announcementService";
import { showDeleteConfirm, showSuccessToast, showErrorToast } from "../utils/notifications";
import Pagination from "../components/Pagination";
import { useRole } from "../hooks/useRole";

const Announcements = () => {
  const { isSuperAdmin } = useRole();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const dropdownRefs = useRef({});

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu !== null && dropdownRefs.current[openMenu] && !dropdownRefs.current[openMenu].contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await announcementService.getAnnouncements({
        page: currentPage,
        per_page: itemsPerPage,
        sort: 'created_at',
        order: 'desc'
      });

      if (response.success) {
        setAnnouncements(response.data);
        setTotalItems(response.meta?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Error loading announcements');
      showErrorToast('Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, index) => {
    const confirmed = await showDeleteConfirm(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      'Yes, delete'
    );
    if (!confirmed) return;

    setActionLoading(id);
    setOpenMenu(null);
    try {
      const response = await announcementService.deleteAnnouncement(id);
      if (response.success) {
        showSuccessToast('Announcement deleted successfully');
        fetchAnnouncements();
      }
    } catch (err) {
      showErrorToast('Failed to delete announcement');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-xs rounded-lg">
        <div className="sm:flex-row items-start justify-between p-4">
          <div className="bg-white shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-4 sm:py-5 gap-3 sm:gap-0">
              <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
              {isSuperAdmin() && (
              <Link
                to="/announcements/compose"
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-[#1376CD] text-white rounded-lg hover:bg-blue-700 transition text-center min-h-[44px] flex items-center justify-center text-sm sm:text-base"
              >
                Add Announcement
              </Link>
              )}
            </div>
          </div>

          {}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative m-4">
              {error}
              <button onClick={fetchAnnouncements} className="ml-4 underline font-semibold">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="bg-[#FFFFFF] inset-shadow-sm shadow-sm rounded-xl mt-3">
              {}
              <div className="hidden md:block overflow-x-auto border-gray-200">
                <table className="table-auto w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-sm sm:text-base">Date</th>
                      <th className="px-6 py-3 text-sm sm:text-base text-[#475467]">Time</th>
                      <th className="px-6 py-3 text-sm sm:text-base text-[#475467]">Announcement</th>
                      <th className="w-10 text-right px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.length > 0 ? (
                      announcements.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 hover:bg-gray-50 relative text-[#475467]"
                        >
                          <td className="px-3 py-4 text-sm sm:text-base">{item.date}</td>
                          <td className="px-3 py-4 text-sm sm:text-base">{item.time}</td>
                          <td className="px-3 py-4 text-sm sm:text-base">{item.announcement}</td>
                          <td className="px-4 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                            {isSuperAdmin() && (
                              <>
                            {actionLoading === item.id ? (
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              <div ref={(el) => (dropdownRefs.current[index] = el)}>
                                <button
                                  onClick={() => toggleMenu(index)}
                                  className="p-2 rounded-full hover:bg-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                  <HiDotsVertical className="w-5 h-5 text-gray-500" />
                                </button>

                                {openMenu === index && (
                                  <div className="absolute right-4 mt-1 mr-4 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <Link
                                      to={`/announcements/edit/${item.id}`}
                                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 min-h-[44px] flex items-center"
                                      onClick={() => setOpenMenu(null)}
                                    >
                                      Edit
                                    </Link>
                                    <button
                                      className="block w-full text-left px-4 py-1 text-sm text-red-600 hover:bg-gray-100 min-h-[44px] flex items-center"
                                      onClick={() => handleDelete(item.id, index)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-gray-500 py-6">
                          No announcements found
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="4" className="h-15"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {}
              <div className="md:hidden">
                {announcements.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {announcements.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500 font-medium">{item.date}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{item.time}</span>
                            </div>
                            <p className="text-sm text-[#475467] break-words">{item.announcement}</p>
                          </div>
                          {isSuperAdmin() && (
                          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {actionLoading === item.id ? (
                              <div className="flex justify-center min-w-[44px] min-h-[44px] items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              <div ref={(el) => (dropdownRefs.current[index] = el)}>
                                <button
                                  onClick={() => toggleMenu(index)}
                                  className="p-2 rounded-full hover:bg-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                  <HiDotsVertical className="w-5 h-5 text-gray-500" />
                                </button>

                                {openMenu === index && (
                                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <Link
                                      to={`/announcements/edit/${item.id}`}
                                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 min-h-[44px] flex items-center"
                                      onClick={() => setOpenMenu(null)}
                                    >
                                      Edit
                                    </Link>
                                    <button
                                      className="block w-full text-left px-4 py-1 text-sm text-red-600 hover:bg-gray-100 min-h-[44px] flex items-center"
                                      onClick={() => handleDelete(item.id, index)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6 px-4">
                    No announcements found
                  </div>
                )}
              </div>

              <div className="py-2.5 gap-3 flex justify-center">
                <Pagination
                  page={currentPage}
                  setPage={setCurrentPage}
                  perPage={itemsPerPage}
                  setPerPage={setItemsPerPage}
                  totalItems={totalItems}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
