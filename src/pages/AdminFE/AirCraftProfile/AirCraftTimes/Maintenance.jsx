import React, { useState, useEffect } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FiX, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { maintenanceService } from "../../../../api/services/maintenanceService";
import { showSuccessToast, showErrorToast, showDeleteConfirm } from "../../../../utils/notifications";

const getStatusStyle = (status) => {
  switch (status) {
    case "ongoing":
      return "bg-[#EBF0FB] text-[#113B98]";
    case "open":
      return "bg-[#E1FAEA] text-[#016626]";
    case "closed":
      return "bg-[#FFE3E3] text-[#961616]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getStatusDisplay = (status) => {
  const statusMap = {
    'open': 'Open',
    'ongoing': 'Ongoing',
    'closed': 'Closed'
  };
  return statusMap[status] || status;
};

const Maintenance = ({ aircraftId, searchTerm, sortBy }) => {
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [formData, setFormData] = useState({
    template_name: '',
    status: 'open',
    days_remaining: '',
    hours_remaining: '',
    cycles_remaining: '',
    reference_no: '',
    last_resolved: '',
  });

  useEffect(() => {
    if (aircraftId) {
      fetchMaintenance();
    }
  }, [aircraftId, searchTerm, sortBy]);

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const params = {
        aircraft_id: aircraftId,
        per_page: 100,
        search: searchTerm || undefined,
        sort: 'created_at',
        order: sortBy === 'Newest' ? 'desc' : 'asc',
      };
      const response = await maintenanceService.getMaintenance(params);
      if (response.success) {
        const maintenanceList = Array.isArray(response.data) ? response.data : [];
        setMaintenanceData(maintenanceList);
      }
    } catch (error) {
      console.error('Error fetching maintenance:', error);
      showErrorToast('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({
      template_name: '',
      status: 'open',
      days_remaining: '',
      hours_remaining: '',
      cycles_remaining: '',
      reference_no: '',
      last_resolved: '',
    });
    setShowModal(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      template_name: record.template_name || '',
      status: record.status || 'open',
      days_remaining: record.days_remaining || '',
      hours_remaining: record.hours_remaining || '',
      cycles_remaining: record.cycles_remaining || '',
      reference_no: record.reference_no || '',
      last_resolved: record.last_resolved || '',
    });
    setOpenMenuId(null);
    setShowModal(true);
  };

  const handleDelete = async (record, e) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    
    const confirmed = await showDeleteConfirm(`"${record.template_name}"`);
    if (!confirmed) return;

    try {
      const response = await maintenanceService.deleteMaintenance(record.id);
      if (response.success) {
        showSuccessToast('Maintenance record deleted successfully');
        fetchMaintenance();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete maintenance record');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        aircraft_id: aircraftId,
        template_name: formData.template_name,
        status: formData.status,
        days_remaining: formData.days_remaining ? parseInt(formData.days_remaining) : null,
        hours_remaining: formData.hours_remaining ? parseFloat(formData.hours_remaining) : null,
        cycles_remaining: formData.cycles_remaining ? parseInt(formData.cycles_remaining) : null,
        reference_no: formData.reference_no || null,
        last_resolved: formData.last_resolved || null,
      };

      if (editingRecord) {
        const response = await maintenanceService.updateMaintenance(editingRecord.id, data);
        if (response.success) {
          showSuccessToast('Maintenance record updated successfully');
          setShowModal(false);
          fetchMaintenance();
        }
      } else {
        const response = await maintenanceService.createMaintenance(data);
        if (response.success) {
          showSuccessToast('Maintenance record created successfully');
          setShowModal(false);
          fetchMaintenance();
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to save maintenance record');
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

  const formatHours = (hours) => {
    if (hours === null || hours === undefined || hours === '') return '--';
    return `${parseFloat(hours).toFixed(2)} hours`;
  };

  const formatDays = (days) => {
    if (days === null || days === undefined || days === '') return '--';
    return days.toString();
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
          Add Maintenance Record
        </button>
      </div>

      {}
      <div className="overflow-x-auto">
        <table className="text-sm text-[#3D3D3D] border-collapse w-full">
          <thead className="bg-[#FAFAFA] text-left">
            <tr>
              <th className="py-2 px-3 border border-gray-300">Aircraft Number</th>
              <th className="py-2 px-3 border border-gray-300">Status</th>
              <th className="py-2 px-3 border border-gray-300">Template Name</th>
              <th className="py-2 px-3 border border-gray-300">Days Remaining</th>
              <th className="py-2 px-3 border border-gray-300">Hours Remaining</th>
              <th className="py-2 px-3 border border-gray-300">Cycles Remaining</th>
              <th className="py-2 px-3 border border-gray-300">Reference No.</th>
              <th className="py-2 px-3 border border-gray-300">Last Resolved</th>
              <th className="py-2 px-3 border border-gray-300 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {maintenanceData.length > 0 ? (
              maintenanceData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 bg-white relative">
                  <td className="py-2 px-3 border border-gray-300">{item.aircraft_name || 'N/A'}</td>
                  <td className="py-2 px-3 border border-gray-300">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(item.status)}`}>
                      {getStatusDisplay(item.status)}
                    </span>
                  </td>
                  <td className="py-2 px-3 border border-gray-300">{item.template_name}</td>
                  <td className="py-2 px-3 border border-gray-300">{formatDays(item.days_remaining)}</td>
                  <td
                    className={`py-2 px-3 border border-gray-300 ${
                      item.hours_remaining && parseFloat(item.hours_remaining) < 10 ? "text-[#CF0000] font-medium" : ""
                    }`}
                  >
                    {formatHours(item.hours_remaining)}
                  </td>
                  <td className="py-2 px-3 border border-gray-300">{formatDays(item.cycles_remaining)}</td>
                  <td className="py-2 px-3 border border-gray-300">{item.reference_no || '--'}</td>
                  <td className="py-2 px-3 border border-gray-300">{formatDate(item.last_resolved)}</td>
                  <td className="py-2 px-3 border border-gray-300 text-center relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <HiDotsVertical className="text-gray-500" />
                    </button>
                    {openMenuId === item.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
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
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  No maintenance records found.
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
                {editingRecord ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                <input
                  type="text"
                  required
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Days Remaining</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.days_remaining}
                    onChange={(e) => setFormData({ ...formData, days_remaining: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours Remaining</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hours_remaining}
                    onChange={(e) => setFormData({ ...formData, hours_remaining: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cycles Remaining</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cycles_remaining}
                    onChange={(e) => setFormData({ ...formData, cycles_remaining: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference No.</label>
                <input
                  type="text"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Resolved</label>
                <input
                  type="date"
                  value={formData.last_resolved}
                  onChange={(e) => setFormData({ ...formData, last_resolved: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {editingRecord ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
