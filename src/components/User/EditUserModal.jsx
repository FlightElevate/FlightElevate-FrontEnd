import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { useUserForm } from '../../hooks/useUserForm';
import { useRoles } from '../../hooks/useRoles';
import { userService } from '../../api/services/userService';
import { locationService } from '../../api/services/locationService';
import { showSuccessToast, showErrorToast } from '../../utils/notifications';
import { useAuth } from '../../context/AuthContext';

/* ---------- helpers ---------- */

const norm = (v) => (v == null ? '' : String(v).trim());
const roleName = (r) => (r && typeof r === 'object' ? r.name : r);
const idList = (list) =>
  (Array.isArray(list) ? list : [])
    .map((x) => Number(x && typeof x === 'object' ? x.id : x))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
const sameIds = (a, b) => JSON.stringify(idList(a)) === JSON.stringify(idList(b));
const parseCerts = (value) => norm(value).split(',').map((s) => s.trim()).filter(Boolean);

// Laravel returns { field: ["msg", ...] }; the form wants { field: "msg" }.
const flattenErrors = (errs) =>
  Object.fromEntries(Object.entries(errs || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

const EditUserModal = ({ isOpen, onClose, onSuccess, initialData = {} }) => {
  const { user: currentUser } = useAuth();
  const { formData, formErrors, handleChange, validate, reset, setErrors, updateField } =
    useUserForm(initialData, { requirePassword: false });
  const { roles, loading: loadingRoles } = useRoles();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);

  const isSelf = String(initialData?.id) === String(currentUser?.id);

  // Re-initialise only when the modal opens or a different user is loaded.
  // Depending on the whole `initialData` object (default `{}` is a new object every
  // render) would wipe the form whenever the parent re-renders.
  useEffect(() => {
    if (isOpen) reset({ ...initialData, roles: initialData.roles || [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isOpen) return;
      try {
        const r = await locationService.getLocations();
        if (!cancelled && r.success && Array.isArray(r.data)) {
          setLocationOptions(r.data.filter((l) => l.id != null && l.id !== ''));
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  /**
   * Build a payload containing ONLY what the user actually changed (plus name/email).
   * Sending the whole form caused the errors: untouched optional fields went out as
   * null/'' (e.g. username, phone -> "must be a string"), unchanged unique fields
   * (username/email) could trip unique rules, and a blank password_confirmation was sent.
   */
  const buildPayload = () => {
    const payload = {
      name: norm(formData.name),
      email: norm(formData.email),
    };

    const newRole = roleName(formData.role) || roleName(formData.roles?.[0]);
    const oldRole = roleName(initialData.role) || roleName(initialData.roles?.[0]);
    if (newRole && norm(newRole) !== norm(oldRole)) payload.role = newRole;

    if (norm(formData.status) !== norm(initialData.status) && formData.status) {
      payload.status = formData.status;
    }

    ['username', 'phone'].forEach((key) => {
      if (norm(formData[key]) !== norm(initialData[key])) {
        payload[key] = norm(formData[key]) || null; // null = user deliberately cleared it
      }
    });

    if (norm(formData.certificate_level) !== norm(initialData.certificate_level)) {
      payload.certificate_level = norm(formData.certificate_level) || null;
    }

    if (!isSelf) {
      if (norm(formData.default_location_id) !== norm(initialData.default_location_id)) {
        const n = parseInt(formData.default_location_id, 10);
        payload.default_location_id = Number.isNaN(n) ? null : n;
      }
      if (!sameIds(formData.calendar_location_ids, initialData.calendar_location_ids)) {
        payload.calendar_location_ids = idList(formData.calendar_location_ids);
      }
    }

    if (formData.password) {
      payload.password = formData.password;
      payload.password_confirmation = formData.password_confirmation || '';
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await userService.updateUser(initialData.id, buildPayload());
      if (response?.success) {
        showSuccessToast('User updated successfully');
        onSuccess?.(response.data);
        onClose();
      } else {
        showErrorToast(response?.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      const data = err?.response?.data;
      const fieldErrors =
        data?.errors && typeof data.errors === 'object' ? flattenErrors(data.errors) : null;

      if (fieldErrors) setErrors(fieldErrors); // was crashing when err.response was undefined

      const firstFieldError = fieldErrors ? Object.values(fieldErrors)[0] : null;
      showErrorToast(firstFieldError || data?.message || err?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCertificate = (cert, checked) => {
    let current = parseCerts(formData.certificate_level);
    if (checked) {
      if (!current.includes(cert)) current.push(cert);
    } else {
      current = current.filter((c) => c !== cert);
    }
    updateField('certificate_level', current.join(', '));
  };

  const closeModal = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = (field) =>
    `w-full border ${formErrors[field] ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500`;
  const fieldError = (field) =>
    formErrors[field] ? <p className="mt-1 text-sm text-red-500">{formErrors[field]}</p> : null;

  const certChecklist = (title, options, accent) => (
    <div>
      <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
      <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white space-y-2">
        {options.map((cert) => (
          <label key={cert} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={parseCerts(formData.certificate_level).includes(cert)}
              onChange={(e) => toggleCertificate(cert, e.target.checked)}
              className={`h-4 w-4 ${accent} border-gray-300 rounded`}
            />
            <span className="text-sm text-gray-700">{cert}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange}
                  className={inputClass('name')} placeholder="John Doe" />
                {fieldError('name')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange}
                  className={inputClass('email')} placeholder="john@example.com" />
                {fieldError('email')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
                <input type="text" name="username" value={formData.username || ''} onChange={handleChange}
                  className={inputClass('username')} placeholder="johndoe123" />
                {fieldError('username')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange}
                  className={inputClass('phone')} placeholder="(555) 000-0000" />
                {fieldError('phone')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select name="role" value={formData.role || roleName(formData.roles?.[0]) || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={loadingRoles}
                >
                  <option value="">Select a role</option>
                  {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                {fieldError('role')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status || 'active'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  {!isSelf && <option value="blocked">Blocked</option>}
                </select>
                {fieldError('status')}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Certificate Level / Ratings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certChecklist('Pilot Certificate', ['Student', 'Private', 'Commercial', 'ATP'], 'text-blue-600 focus:ring-blue-500')}
                {certChecklist('Flight Instructor Certificate', ['CFI', 'CFII', 'MEI'], 'text-fuchsia-600 focus:ring-fuchsia-500')}
              </div>
              {fieldError('certificate_level')}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Password (Leave blank to keep current)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password || ''}
                      onChange={handleChange} autoComplete="new-password"
                      className={inputClass('password')} placeholder="Enter new password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {fieldError('password')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type={showPassword ? 'text' : 'password'} name="password_confirmation"
                    value={formData.password_confirmation || ''} onChange={handleChange} autoComplete="new-password"
                    className={inputClass('password_confirmation')} placeholder="Confirm new password" />
                  {fieldError('password_confirmation')}
                </div>
              </div>
            </div>

            {!isSelf && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Location</label>
                    <select name="default_location_id" value={formData.default_location_id || ''} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- No Default Location --</option>
                      {locationOptions.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    {fieldError('default_location_id')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Locations</label>
                    <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white max-h-[150px] overflow-y-auto space-y-2">
                      {locationOptions.length === 0 ? (
                        <p className="text-sm text-gray-500">No locations available</p>
                      ) : (
                        locationOptions.map((l) => (
                          <label key={l.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={idList(formData.calendar_location_ids).includes(Number(l.id))}
                              onChange={(e) => {
                                const current = idList(formData.calendar_location_ids);
                                updateField(
                                  'calendar_location_ids',
                                  e.target.checked
                                    ? [...new Set([...current, Number(l.id)])]
                                    : current.filter((id) => id !== Number(l.id))
                                );
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{l.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {fieldError('calendar_location_ids')}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={closeModal} disabled={submitting}
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
    </div>,
    document.body
  );
};

export default EditUserModal;
