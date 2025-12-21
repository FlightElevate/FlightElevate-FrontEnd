import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { validateUserForm, clearFieldError } from '../utils/validation';

/**
 * Custom hook for managing user form state and validation
 * @param {Object} initialData - Initial form data
 * @param {Object} options - Validation options
 * @returns {Object} - Form state and handlers
 */
export const useUserForm = (initialData = {}, options = {}) => {
  // Base default data (never changes)
  const baseDefaultData = useMemo(() => ({
    name: '',
    email: '',
    password: '',
    username: '',
    phone: '',
    role: '',
    status: 'active',
    organization_name: '',
  }), []);

  // Use ref to track initialData to prevent unnecessary re-renders
  const initialDataRef = useRef(initialData);
  
  // Update ref when initialData changes
  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // Initialize form data with base defaults merged with initialData
  const [formData, setFormData] = useState(() => ({
    ...baseDefaultData,
    ...initialData,
  }));

  const [formErrors, setFormErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Updates a single field value
   * @param {string} name - Field name
   * @param {*} value - Field value
   */
  const updateField = useCallback((name, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      setIsDirty(true);
      
      // Clear error for this field when user starts typing
      if (prev[name] !== value) {
        setFormErrors((prevErrors) => {
          if (prevErrors[name]) {
            return clearFieldError(prevErrors, name);
          }
          return prevErrors;
        });
      }
      
      return newData;
    });
  }, []); // No dependencies - use functional updates

  /**
   * Handles input change events
   * @param {React.ChangeEvent} e - Change event
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    updateField(name, value);
  }, [updateField]);

  /**
   * Validates the entire form
   * @returns {boolean} - True if form is valid
   */
  const validate = useCallback(() => {
    const errors = validateUserForm(formData, options);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, options]);

  /**
   * Resets form to initial state
   */
  const reset = useCallback(() => {
    setFormData({
      ...baseDefaultData,
      ...initialDataRef.current,
    });
    setFormErrors({});
    setIsDirty(false);
  }, [baseDefaultData]); // Only depend on baseDefaultData (stable)

  /**
   * Sets form errors (useful for API error responses)
   * @param {Object} errors - Errors object
   */
  const setErrors = useCallback((errors) => {
    setFormErrors(errors);
  }, []);

  /**
   * Updates multiple fields at once
   * @param {Object} data - Fields to update
   */
  const updateFields = useCallback((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setIsDirty(true);
  }, []);

  return {
    formData,
    formErrors,
    isDirty,
    handleChange,
    updateField,
    updateFields,
    validate,
    reset,
    setErrors,
    setFormData,
  };
};
