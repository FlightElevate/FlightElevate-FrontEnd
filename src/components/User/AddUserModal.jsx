import React, { useEffect, useState } from 'react';
import { FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { useUserForm } from '../../hooks/useUserForm';
import { useRoles } from '../../hooks/useRoles';
import { userService } from '../../api/services/userService';
import { showSuccessToast, showErrorToast } from '../../utils/notifications';


const AddUserModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialData = {}
}) => {
  const { formData, formErrors, handleChange, validate, reset, setErrors } = useUserForm(initialData);
  const { roles, loading: loadingRoles, isCacheValid } = useRoles();
  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = useState(false);

  
  useEffect(() => {
    if (isOpen) {
      reset();
    }
    
  }, [isOpen]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.certificate_level === '' || payload.certificate_level == null) {
        delete payload.certificate_level;
      }
      const response = await userService.createUser(payload);
      if (response.success) {
        showSuccessToast('User created successfully');
        reset();
        onSuccess?.();
        onClose();
      }
    } catch (err) {

      console.error('Error creating user:', err.response);
      const errorMessage = err.response?.data?.errors?.message || err.message || 'Failed to create user';
      showErrorToast(errorMessage);
      
      
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <FiX size={24} />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {}
            <FormField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              required
              placeholder="Enter full name"
            />

            {}
            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              required
              placeholder="Enter email address"
            />

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password (min 6 characters)"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {}
              <FormField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={formErrors.username}
                placeholder="Enter username (optional)"
              />

              {}
              <FormField
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={formErrors.phone}
                placeholder="Enter phone number (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                {loadingRoles ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-500">Loading roles...</span>
                  </div>
                ) : (
                  <select
                    name="role"
                    value={typeof formData.role === 'object' && formData.role?.name ? formData.role.name : (formData.role || '')}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.role && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.role}</p>
                )}
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Level
                </label>
                <select
                  name="certificate_level"
                  value={formData.certificate_level || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  <option value="Student">Student</option>
                  <option value="Private">Private</option>
                  <option value="Commercial">Commercial</option>
                  <option value="ATP">ATP</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Used for Acting PIC default (Student → Instructor PIC; Private+ → Student PIC)</p>
              </div>
            </div>

            {}
            {formData.role === 'Admin' && (
              <FormField
                label="Organization Name"
                name="organization_name"
                value={formData.organization_name || ''}
                onChange={handleChange}
                error={formErrors.organization_name}
                required
                placeholder="Enter organization name (will create new organization)"
              />
            )}
          </div>

          {}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  ...props
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-500">{error}</p>
    )}
  </div>
);

export default AddUserModal;

