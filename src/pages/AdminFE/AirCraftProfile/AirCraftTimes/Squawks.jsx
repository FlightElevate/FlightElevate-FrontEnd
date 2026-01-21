import React, { useState, useEffect, useRef } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FiX, FiPlus, FiEdit2, FiTrash2, FiCheckCircle } from "react-icons/fi";
import { squawkService } from "../../../../api/services/squawkService";
import { showSuccessToast, showErrorToast, showDeleteConfirm, showConfirmDialog } from "../../../../utils/notifications";

const getStatusStyle = (status) => {
  switch (status) {
    case "awaiting_review":
      return "bg-[#FEE4E2] text-[#B42318]";
    case "in_progress":
      return "bg-[#EBF0FB] text-[#113B98]";
    case "resolved":
      return "bg-[#E1FAEA] text-[#016626]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getStatusDisplay = (status) => {
  const statusMap = {
    'awaiting_review': 'Awaiting Review',
    'in_progress': 'In Progress',
    'resolved': 'Resolved'
  };
  return statusMap[status] || status;
};

const Squawks = ({ aircraftId, searchTerm, sortBy }) => {
  const [squawksData, setSquawksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSquawk, setEditingSquawk] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState({});
  const menuRefs = useRef({});
  const [formData, setFormData] = useState({
    squawk: '',
    description: '',
    status: 'awaiting_review',
    reference_no: '',
  });

  useEffect(() => {
    if (aircraftId) {
      fetchSquawks();
    }
  }, [aircraftId, searchTerm, sortBy]);

  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (Object.values(menuRefs.current).every((ref) => !ref?.contains(e.target))) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSquawks = async () => {
    setLoading(true);
    try {
      const params = {
        aircraft_id: aircraftId,
        per_page: 100,
        search: searchTerm || undefined,
        sort: 'created_at',
        order: sortBy === 'Newest' ? 'desc' : 'asc',
      };
      const response = await squawkService.getSquawks(params);
      if (response.success) {
        const squawksList = Array.isArray(response.data) ? response.data : [];
        setSquawksData(squawksList);
      }
    } catch (error) {
      console.error('Error fetching squawks:', error);
      showErrorToast('Failed to load squawks');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSquawk(null);
    setFormData({
      squawk: '',
      description: '',
      status: 'awaiting_review',
      reference_no: '',
    });
    setShowModal(true);
  };

  const handleEdit = (squawk) => {
    setEditingSquawk(squawk);
    setFormData({
      squawk: squawk.squawk || '',
      description: squawk.description || '',
      status: squawk.status || 'awaiting_review',
      reference_no: squawk.reference_no || '',
    });
    setOpenMenuId(null);
    setShowModal(true);
  };

  const handleDelete = async (squawk, e) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    
    const confirmed = await showDeleteConfirm(`"${squawk.squawk}"`);
    if (!confirmed) return;

    try {
      const response = await squawkService.deleteSquawk(squawk.id);
      if (response.success) {
        showSuccessToast('Squawk deleted successfully');
        fetchSquawks();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete squawk');
    }
  };

  const handleResolve = async (squawk, e) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    
    const confirmed = await showConfirmDialog(
      'Resolve Squawk',
      `Are you sure you want to resolve "${squawk.squawk}"?`,
      'Yes, resolve it'
    );
    if (!confirmed) return;

    try {
      const response = await squawkService.resolveSquawk(squawk.id);
      if (response.success) {
        showSuccessToast('Squawk resolved successfully');
        fetchSquawks();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to resolve squawk');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        aircraft_id: aircraftId,
        squawk: formData.squawk,
        description: formData.description,
        status: formData.status,
        reference_no: formData.reference_no || null,
      };

      if (editingSquawk) {
        const response = await squawkService.updateSquawk(editingSquawk.id, data);
        if (response.success) {
          showSuccessToast('Squawk updated successfully');
          setShowModal(false);
          fetchSquawks();
        }
      } else {
        const response = await squawkService.createSquawk(data);
        if (response.success) {
          showSuccessToast('Squawk created successfully');
          setShowModal(false);
          fetchSquawks();
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to save squawk');
    }
  };

  const handleMenuToggle = (id) => {
    if (openMenuId === id) return setOpenMenuId(null);

    const ref = menuRefs.current[id];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      const direction = window.innerHeight - rect.bottom < 120 ? "top" : "bottom";
      setMenuDirection((prev) => ({ ...prev, [id]: direction }));
      setOpenMenuId(id);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {}
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus size={18} />
          Add Squawk
        </button>
      </div>

      {}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full text-sm text-gray-700 border-collapse relative">
          <thead className="bg-[#FAFAFA] text-left">
            <tr>
              <th className="py-2 px-3 border border-gray-300">Created</th>
              <th className="py-2 px-3 border border-gray-300">Squawk</th>
              <th className="py-2 px-3 border border-gray-300">Status</th>
              <th className="py-2 px-3 border border-gray-300">Reference No.</th>
              <th className="py-2 px-3 border border-gray-300 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {squawksData.length > 0 ? (
              squawksData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 bg-white relative">
                  <td className="py-2 px-3 border border-gray-300">{formatDate(item.created_at)}</td>
                  <td className="py-2 px-3 border border-gray-300">{item.squawk}</td>
                  <td className="py-2 px-3 border border-gray-300">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(item.status)}`}>
                      {getStatusDisplay(item.status)}
                    </span>
                  </td>
                  <td className="py-2 px-3 border border-gray-300">{item.reference_no || '--'}</td>
                  <td className="py-2 px-3 border border-gray-300 text-center relative" ref={(el) => (menuRefs.current[item.id] = el)}>
                    <button
                      onClick={() => handleMenuToggle(item.id)}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <HiDotsVertical className="text-gray-600 text-lg" />
                    </button>

                    {openMenuId === item.id && (
                      <div
                        className={`absolute right-0 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-50 ${
                          menuDirection[item.id] === "top" ? "bottom-full mb-1" : "top-full mt-1"
                        }`}
                      >
                        {item.status !== 'resolved' && (
                          <button
                            onClick={(e) => handleResolve(item, e)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-green-600 flex items-center gap-2"
                          >
                            <FiCheckCircle size={14} />
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDelete(item, e)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No squawks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingSquawk ? 'Edit Squawk' : 'Add Squawk'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Squawk *</label>
                <input
                  type="text"
                  required
                  value={formData.squawk}
                  onChange={(e) => setFormData({ ...formData, squawk: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter squawk title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter detailed description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="awaiting_review">Awaiting Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference No.</label>
                <input
                  type="text"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional reference number"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingSquawk ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Squawks;
