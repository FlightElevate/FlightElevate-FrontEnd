import React, { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiChevronDown } from "react-icons/hi";
import { activityLogService } from "../../api/services/activityLogService";
import Pagination from "../../components/Pagination";
import { showErrorToast } from "../../utils/notifications";

const UserLogs = () => {
  const [selected, setSelected] = useState("Instructor");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const sortDropdownRef = useRef(null);

  const buttons = ["Instructor", "Student", "Admin"];

  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setSortDropdownOpen(false);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [currentPage, itemsPerPage, selected, searchTerm, sortField, sortOrder]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sortDropdownOpen &&
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortDropdownOpen]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await activityLogService.getActivityLogs({
        page: currentPage,
        per_page: itemsPerPage,
        role: selected,
        search: searchTerm,
        sort: sortField,
        order: sortOrder
      });

      if (response.success) {
        setActivityLogs(response.data);
        setTotalItems(response.meta?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Error loading activity logs');
      showErrorToast('Failed to load activity logs');
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Activity Logs</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {}
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
            
            {}
            <div className="relative w-full sm:w-auto" ref={sortDropdownRef}>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700 min-h-[44px] whitespace-nowrap hover:bg-gray-50 transition-colors"
              >
                <MdFilterList className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Sort by</span>
                <HiChevronDown 
                  size={16} 
                  className={`transition-transform flex-shrink-0 ${sortDropdownOpen ? 'transform rotate-180' : ''}`}
                />
              </button>

              {sortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-48 md:w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => handleSortChange('created_at')}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                        sortField === 'created_at' ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Date</span>
                      {sortField === 'created_at' && (
                        <span className="text-xs text-gray-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSortChange('user_id')}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                        sortField === 'user_id' ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>User</span>
                      {sortField === 'user_id' && (
                        <span className="text-xs text-gray-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSortChange('action')}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                        sortField === 'action' ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Action</span>
                      {sortField === 'action' && (
                        <span className="text-xs text-gray-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="bg-white border-b border-[#F3F4F6]">
          {}
          <div className="md:hidden">
            <div className="flex flex-col px-4 py-2">
              {buttons.map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    setSelected(label);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left py-3 px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    selected === label
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="hidden md:block">
            <div className="flex gap-2 px-6 py-4">
              {buttons.map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    setSelected(label);
                    setCurrentPage(1);
                  }}
                  className={`py-2.5 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center justify-center min-h-[44px] ${
                    selected === label
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
            <button onClick={fetchActivityLogs} className="ml-4 underline font-semibold">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {}
            <div className="hidden md:block overflow-x-auto shadow-lg rounded-xl mt-4">
              <table className="w-full text-sm text-left border-b border-gray-200">
                <thead className="bg-[#F9FAFB] text-black font-inter font-medium">
                  <tr className="h-[44px]">
                    <th className="pl-5">Date</th>
                    <th className="pl-5">User</th>
                    <th className="pl-5">Email</th>
                    <th className="pl-5">Time</th>
                    <th className="pl-5">Role</th>
                    <th className="pl-5">Role Performed</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-[#EAECF0] hover:bg-gray-50 transition-colors h-[72px]"
                      >
                        <td className="p-6">{log.date}</td>
                        <td className="p-6">{log.user}</td>
                        <td className="p-6">{log.email}</td>
                        <td className="p-6">{log.time}</td>
                        <td className="p-6">{log.role}</td>
                        <td className="p-6">{log.role_performed || log.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="h-[72px]">
                      <td colSpan="6" className="text-center text-gray-500 py-6">
                        No activity logs found for "{selected}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {}
            <div className="md:hidden space-y-3 mt-4">
              {activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">{log.user}</h4>
                        <p className="text-sm text-gray-600 truncate mt-1">{log.email}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0 ml-2">
                        {log.role}
                      </span>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-sm text-gray-700">{log.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Time</span>
                        <span className="text-sm text-gray-700">{log.time}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-gray-500">Action</span>
                        <span className="text-sm text-gray-700 text-right flex-1 ml-2">
                          {log.role_performed || log.description || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No activity logs found for "{selected}"
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
          </>
        )}
      </div>
    </div>
  );
};

export default UserLogs;
