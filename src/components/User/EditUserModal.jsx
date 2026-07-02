import React, { useEffect, useState } from 'react';
import { FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { useUserForm } from '../../hooks/useUserForm';
import { useRoles } from '../../hooks/useRoles';
import { userService } from '../../api/services/userService';
import { locationService } from '../../api/services/locationService';
import { showSuccessToast, showErrorToast } from '../../utils/notifications';

const EditUserModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialData = {}
}) => {
  const { formData, formErrors, handleChange, validate, reset, setErrors, updateField } = useUserForm(initialData);
  const { roles, loading: loadingRoles } = useRoles();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Re-initialize when opened
      const data = { ...initialData };
      if (!data.roles) {
        data.roles = initialData.roles || [];
      }
      reset(data);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    let c = false;
    (async () => {
      if (!isOpen) return;
      try {
        const r = await locationService.getLocations();
        if (!c && r.success && Array.isArray(r.data)) {
          setLocationOptions(r.data.filter((l) => l.id != null && l.id !== ''));
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { c = true; };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.certificate_level === '' || payload.certificate_level == null) delete payload.certificate_level;
      if (payload.default_location_id === '' || payload.default_location_id == null) delete payload.default_location_id;
      else payload.default_location_id = parseInt(payload.default_location_id, 10);
      
      if (!Array.isArray(payload.calendar_location_ids) || payload.calendar_location_ids.length === 0) {
        delete payload.calendar_location_ids;
      } else {
        payload.calendar_location_ids = payload.calendar_location_ids.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
      }

      if (!payload.password) delete payload.password; // Don't update password if empty

      const response = await userService.updateUser(initialData.id, payload);
      if (response.success) {
        showSuccessToast('User updated successfully');
        reset();
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error updating user:', err.response);
      const errorMessage = err.response?.data?.errors?.message || err.message || 'Failed to update user';
      showErrorToast(errorMessage);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
          <button onClick={() => { reset(); onClose(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange}
                  className={`w-full border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500`}
                  placeholder="John Doe"
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange}
                  className={`w-full border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500`}
                  placeholder="john@example.com"
                />
                {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
                <input type="text" name="username" value={formData.username || ''} onChange={handleChange}
                  className={`w-full border ${formErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500`}
                  placeholder="johndoe123"
                />
                {formErrors.username && <p className="mt-1 text-sm text-red-500">{formErrors.username}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select name="role" value={formData.role || formData.roles?.[0] || 'Student'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={loadingRoles}
                >
                  <option value="">Select a role</option>
                  {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                {formErrors.role && <p className="mt-1 text-sm text-red-500">{formErrors.role}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status || 'active'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Password (Leave blank to keep current)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password || ''} onChange={handleChange}
                      className={`w-full border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter new password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {formErrors.password && <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password_confirmation" value={formData.password_confirmation || ''} onChange={handleChange}
                      className={`w-full border ${formErrors.password_confirmation ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500`}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {formErrors.password_confirmation && <p className="mt-1 text-sm text-red-500">{formErrors.password_confirmation}</p>}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Location</label>
                  <select name="default_location_id" value={formData.default_location_id || ''} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- No Default Location --</option>
                    {locationOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Locations</label>
                  <select multiple name="calendar_location_ids" value={(formData.calendar_location_ids || []).map(String)} 
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((o) => parseInt(o.value, 10));
                      updateField('calendar_location_ids', selected);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white min-h-[100px]"
                  >
                    {locationOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Ctrl/Cmd+click for multiple.</p>
                </div>
              </div>
            </div>

          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={() => { reset(); onClose(); }} disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
