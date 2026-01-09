import React, { useState, useRef, useEffect } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FiSearch, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import Pagination from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";
import { logbookService } from "../../api/services/logbookService";
import { userService } from "../../api/services/userService";
import { showSuccessToast, showErrorToast, showDeleteConfirm } from "../../utils/notifications";

const Logbook = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("Newest");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filter states
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [students, setStudents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLogbook, setEditingLogbook] = useState(null);
  const [editForm, setEditForm] = useState({
    notes: '',
    summary: '',
    dual_hours: 0,
    solo_hours: 0,
    pic_hours: 0,
    total_hours: 0,
    landings_day: 0,
    landings_night: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const sortRef = useRef(null);

  // Fetch logbooks from API
  useEffect(() => {
    fetchLogbooks();
  }, [currentPage, itemsPerPage, filterStudentId, filterStartDate, filterEndDate]);

  // Fetch students for filter
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchLogbooks = async () => {
    setLoading(true);
    try {
      const params = {
        per_page: itemsPerPage,
        page: currentPage,
      };
      
      if (filterStudentId) {
        params.student_id = filterStudentId;
      }
      
      if (filterStartDate) {
        params.start_date = filterStartDate;
      }
      
      if (filterEndDate) {
        params.end_date = filterEndDate;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await logbookService.getLogbooks(params);
      
      if (response.success) {
        setLogbooks(response.data || []);
        setTotalItems(response.meta?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching logbooks:', error);
      showErrorToast('Failed to load logbook entries');
      setLogbooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await userService.getUsers({ role: 'Student', per_page: 100 });
      if (response.success) {
        setStudents(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Close menus when clicking outside
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

  const handleEdit = (logbook) => {
    setEditingLogbook(logbook);
    setEditForm({
      notes: logbook.notes || '',
      summary: logbook.summary || '',
      dual_hours: logbook.dual_hours || 0,
      solo_hours: logbook.solo_hours || 0,
      pic_hours: logbook.pic_hours || 0,
      total_hours: logbook.total_hours || 0,
      landings_day: logbook.landings_day || 0,
      landings_night: logbook.landings_night || 0,
    });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (logbook) => {
    setOpenMenuId(null);
    
    const confirmed = await showDeleteConfirm(`logbook entry for ${logbook.student}`);
    if (!confirmed) return;

    try {
      const response = await logbookService.deleteLogbook(logbook.id);
      if (response.success) {
        showSuccessToast('Logbook entry deleted successfully');
        fetchLogbooks();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete logbook entry');
    }
  };

  const handleUpdateLogbook = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await logbookService.updateLogbook(editingLogbook.id, editForm);
      if (response.success) {
        showSuccessToast('Logbook entry updated successfully');
        setShowEditModal(false);
        setEditingLogbook(null);
        fetchLogbooks();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to update logbook entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
    fetchLogbooks();
  };

  const handleClearFilters = () => {
    setFilterStudentId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  if (loading && logbooks.length === 0) {
    return (
      <div className="p-3">
        <div className="border border-gray-200 bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading logbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="border border-gray-200 bg-white rounded-xl">
        {/* Header */}
        <div className="overflow-visible flex flex-col sm:flex-row justify-between gap-3 py-5 px-4 border-b border-[#F3F4F6]">
          <h2 className="text-xl font-semibold">Logbook</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm grow sm:grow-0">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg shadow-sm text-sm ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <MdFilterList className="w-5 h-5" />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative sort-container" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700"
              >
                <span>{sortBy}</span>
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
                        sortBy === option ? "text-blue-600 font-medium" : "text-gray-700"
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

        {/* Filters Section */}
        {showFilters && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Students</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto py-5 px-4">
          <table className="min-w-full border border-gray-200 text-sm relative">
            <thead className="bg-[#FAFAFA] text-[#090909] text-left">
              <tr>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Date</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Student</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Aircraft</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Lesson Type</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Total Hours</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Landings</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#3D3D3D] bg-[#FFFFFF]">
              {logbooks.length > 0 ? (
                logbooks.map((logbook) => (
                  <tr key={logbook.id} className="hover:bg-gray-50 relative">
                    <td className="py-2 px-3 border border-[#E5E1E6]">{logbook.flight_date_formatted}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{logbook.student}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{logbook.aircraft || 'N/A'}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{logbook.lesson_type || 'N/A'}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{logbook.total_hours.toFixed(2)}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">
                      D: {logbook.landings_day} / N: {logbook.landings_night}
                    </td>
                    <td className="py-2 px-3 border border-[#E5E1E6] text-center relative">
                      <div className="menu-container inline-block">
                        <HiDotsVertical
                          className="text-[#5C5F62] cursor-pointer"
                          onClick={() => setOpenMenuId(openMenuId === logbook.id ? null : logbook.id)}
                        />
                        {openMenuId === logbook.id && (
                          <div className="absolute right-5 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button
                              onClick={() => handleEdit(logbook)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              <FiEdit2 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(logbook)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <FiTrash2 size={14} />
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
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    No logbook entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden py-4 px-3">
          {logbooks.length > 0 ? (
            logbooks.map((logbook) => (
              <div key={logbook.id} className="border border-[#E5E7EB] rounded-xl p-4 bg-white shadow-sm relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium text-gray-900">{logbook.student}</h3>
                    <p className="text-xs text-[#797979] mt-1">{logbook.flight_date_formatted}</p>
                  </div>
                  <div className="menu-container relative">
                    <HiDotsVertical
                      className="text-[#5C5F62] cursor-pointer"
                      onClick={() => setOpenMenuId(openMenuId === logbook.id ? null : logbook.id)}
                    />
                    {openMenuId === logbook.id && (
                      <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <button
                          onClick={() => handleEdit(logbook)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(logbook)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600"><span className="font-medium">Aircraft:</span> {logbook.aircraft || 'N/A'}</p>
                  <p className="text-xs text-gray-600"><span className="font-medium">Lesson:</span> {logbook.lesson_type || 'N/A'}</p>
                  <p className="text-xs text-gray-600"><span className="font-medium">Hours:</span> {logbook.total_hours.toFixed(2)}</p>
                  <p className="text-xs text-gray-600"><span className="font-medium">Landings:</span> D: {logbook.landings_day} / N: {logbook.landings_night}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No logbook entries found
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
            totalItems={totalItems}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingLogbook && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Edit Logbook Entry</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLogbook(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateLogbook} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dual Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.dual_hours}
                      onChange={(e) => setEditForm({ ...editForm, dual_hours: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Solo Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.solo_hours}
                      onChange={(e) => setEditForm({ ...editForm, solo_hours: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PIC Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.pic_hours}
                      onChange={(e) => setEditForm({ ...editForm, pic_hours: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.total_hours}
                      onChange={(e) => setEditForm({ ...editForm, total_hours: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day Landings</label>
                    <input
                      type="number"
                      value={editForm.landings_day}
                      onChange={(e) => setEditForm({ ...editForm, landings_day: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Night Landings</label>
                    <input
                      type="number"
                      value={editForm.landings_night}
                      onChange={(e) => setEditForm({ ...editForm, landings_night: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                  <textarea
                    value={editForm.summary}
                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLogbook(null);
                  }}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logbook;
