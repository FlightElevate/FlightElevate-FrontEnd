import React, { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
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

  const buttons = ["Instructor", "Student", "Admin"];

  useEffect(() => {
    fetchActivityLogs();
  }, [currentPage, itemsPerPage, selected, searchTerm]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await activityLogService.getActivityLogs({
        page: currentPage,
        per_page: itemsPerPage,
        role: selected,
        search: searchTerm,
        sort: 'created_at',
        order: 'desc'
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
          <h2 className="text-xl font-inter font-semibold text-gray-800">
            Activity Logs
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
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
            <button className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700">
              <MdFilterList className="w-[20px] h-[20px]" />
              <span className="whitespace-nowrap">Sort by</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-[#F3F4F6] flex gap-[16px] text-sm">
          {buttons.map((label) => (
            <button
              key={label}
              onClick={() => {
                setSelected(label);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded ${
                selected === label
                  ? "bg-[#C6E4FF] text-black"
                  : "bg-white text-gray-700"
              } transition-colors duration-150`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
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
            <div className="overflow-x-auto shadow-lg rounded-xl">
              <table className="w-full text-sm text-left border-b border-gray-200 mt-4">
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
