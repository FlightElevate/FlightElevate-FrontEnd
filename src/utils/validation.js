/**
 * Validation utilities for form fields
 */

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @param {number} minLength - Minimum length (default: 6)
 * @returns {boolean} - True if valid
 */
export const isValidPassword = (password, minLength = 6) => {
  return password && password.length >= minLength;
};

/**
 * Validates user form data
 * @param {Object} formData - Form data to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Object with errors (empty if valid)
 */
export const validateUserForm = (formData, options = {}) => {
  const {
    requireUsername = false,
    requirePhone = false,
    minPasswordLength = 6,
  } = options;

  const errors = {};

  // Name validation
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  }

  // Email validation
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(formData.password, minPasswordLength)) {
    errors.password = `Password must be at least ${minPasswordLength} characters`;
  }

  // Username validation (if required)
  if (requireUsername && !formData.username?.trim()) {
    errors.username = 'Username is required';
  }

  // Phone validation (if required)
  if (requirePhone && !formData.phone?.trim()) {
    errors.phone = 'Phone number is required';
  }

  // Role validation
  if (!formData.role) {
    errors.role = 'Role is required';
  }

  // Organization name validation (required for Admin role)
  if (formData.role === 'Admin' && !formData.organization_name?.trim()) {
    errors.organization_name = 'Organization name is required when creating an Admin';
  }

  return errors;
};

/**
 * Clears validation errors for a specific field
 * @param {Object} errors - Current errors object
 * @param {string} fieldName - Field name to clear
 * @returns {Object} - New errors object without the field
 */
export const clearFieldError = (errors, fieldName) => {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
};

