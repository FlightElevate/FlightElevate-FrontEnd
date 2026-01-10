import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { announcementService } from '../../api/services/announcementService';
import { showSuccessToast, showErrorToast } from '../../utils/notifications';

const Compose = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [formData, setFormData] = useState({
    title: '',
    announcement: '',
    delivery_method: 'in_app',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchAnnouncement();
    }
  }, [id]);

  const fetchAnnouncement = async () => {
    setFetching(true);
    try {
      const response = await announcementService.getAnnouncement(id);
      if (response.success) {
        setFormData({
          title: response.data.title || '',
          announcement: response.data.announcement || '',
          delivery_method: response.data.delivery_method || 'in_app',
        });
      }
    } catch (err) {
      showErrorToast('Failed to load announcement');
      navigate('/announcements');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeliveryMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      delivery_method: method
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        const response = await announcementService.updateAnnouncement(id, formData);
        if (response.success) {
          showSuccessToast('Announcement updated successfully');
          navigate('/announcements');
        }
      } else {
        const response = await announcementService.createAnnouncement(formData);
        if (response.success) {
          showSuccessToast('Announcement created successfully');
          navigate('/announcements');
        }
      }
    } catch (err) {
      showErrorToast(isEditMode ? 'Failed to update announcement' : 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/announcements');
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="sm:flex-row items-start justify-between border-b border-gray-100">
      <div className="bg-white shadow-xs mt-3 px-4 py-5">
        <h2 className="text-xl font-semibold text-gray-800 mt-2 mb-2">
          {isEditMode ? 'Edit Announcements' : 'Add Announcements'}
        </h2>
      </div>
      <div className="bg-white shadow-xs mt-1 px-4 sm:px-6 py-4 sm:py-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4 sm:mb-6">
            <label className="block text-gray-700 font-inter text-sm mt-2 mb-2 sm:mb-3">
              Announcement Title
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter..."
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] text-sm sm:text-base"
            />
          </div>

          <div className="mb-4 sm:mb-6">
            <label className="block text-gray-700 font-inter text-sm mt-3 mb-2">
              Description
            </label>
            <textarea
              name="announcement"
              value={formData.announcement}
              onChange={handleChange}
              placeholder="Enter..."
              required
              rows="6"
              className="w-full border border-gray-300 rounded-md px-3 sm:px-4 pt-2 pb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-4">
            <button
              type="button"
              onClick={() => handleDeliveryMethodChange('in_app')}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg transition-colors min-h-[44px] w-full sm:w-auto ${
                formData.delivery_method === 'in_app'
                  ? 'border-[#1376CD] bg-blue-50 text-[#1376CD]'
                  : 'border-[#D0D5DD] text-black hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.delivery_method === 'in_app'}
                onChange={() => handleDeliveryMethodChange('in_app')}
                className="h-3 w-3 sm:h-3.5 sm:w-3.5 appearance-none border bg-[#FFFFFF] border-black rounded-full checked:bg-blue-700 checked:border-blue-700 flex-shrink-0"
                style={{ minWidth: '12px', minHeight: '12px', maxWidth: '14px', maxHeight: '14px' }}
              />
              <span className="text-sm sm:text-base whitespace-nowrap">In App</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeliveryMethodChange('email')}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg transition-colors min-h-[44px] w-full sm:w-auto ${
                formData.delivery_method === 'email'
                  ? 'border-[#1376CD] bg-blue-50 text-[#1376CD]'
                  : 'border-[#D0D5DD] text-black hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.delivery_method === 'email'}
                onChange={() => handleDeliveryMethodChange('email')}
                className="h-3 w-3 sm:h-3.5 sm:w-3.5 appearance-none border bg-[#FFFFFF] border-black rounded-full checked:bg-blue-700 checked:border-blue-700 flex-shrink-0"
                style={{ minWidth: '12px', minHeight: '12px', maxWidth: '14px', maxHeight: '14px' }}
              />
              <span className="text-sm sm:text-base whitespace-nowrap">Email</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeliveryMethodChange('both')}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg transition-colors min-h-[44px] w-full sm:w-auto ${
                formData.delivery_method === 'both'
                  ? 'border-[#1376CD] bg-blue-50 text-[#1376CD]'
                  : 'border-[#D0D5DD] text-black hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.delivery_method === 'both'}
                onChange={() => handleDeliveryMethodChange('both')}
                className="h-3 w-3 sm:h-3.5 sm:w-3.5 appearance-none border border-black bg-[#FFFFFF] rounded-full checked:bg-[#1376CD] checked:border-[#1376CD] flex-shrink-0"
                style={{ minWidth: '12px', minHeight: '12px', maxWidth: '14px', maxHeight: '14px' }}
              />
              <span className="text-sm sm:text-base whitespace-nowrap">Both</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-[#F6F6F6] text-black rounded-lg hover:bg-gray-200 transition min-h-[44px] text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-[#1376CD] text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Compose;

