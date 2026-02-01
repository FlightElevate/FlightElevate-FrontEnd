import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { validateUserForm, clearFieldError } from '../utils/validation';


export const useUserForm = (initialData = {}, options = {}) => {
  
  const baseDefaultData = useMemo(() => ({
    name: '',
    email: '',
    password: '',
    username: '',
    phone: '',
    role: '',
    status: 'active',
    organization_name: '',
    certificate_level: '',
  }), []);

  // Normalize initialData to ensure role is always a string
  const normalizeInitialData = useCallback((data) => {
    const normalized = { ...data };
    // If role is an object with id and name, extract the name
    if (normalized.role && typeof normalized.role === 'object' && normalized.role.name) {
      normalized.role = normalized.role.name;
    }
    return normalized;
  }, []);

  
  const initialDataRef = useRef(normalizeInitialData(initialData));
  
  
  useEffect(() => {
    initialDataRef.current = normalizeInitialData(initialData);
  }, [initialData, normalizeInitialData]);

  
  const [formData, setFormData] = useState(() => ({
    ...baseDefaultData,
    ...normalizeInitialData(initialData),
  }));

  const [formErrors, setFormErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  
  const updateField = useCallback((name, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      setIsDirty(true);
      
      
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
  }, []); 

  
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    updateField(name, value);
  }, [updateField]);

  
  const validate = useCallback(() => {
    const errors = validateUserForm(formData, options);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, options]);

  
  const reset = useCallback(() => {
    setFormData({
      ...baseDefaultData,
      ...normalizeInitialData(initialDataRef.current),
    });
    setFormErrors({});
    setIsDirty(false);
  }, [baseDefaultData, normalizeInitialData]); 

  
  const setErrors = useCallback((errors) => {
    setFormErrors(errors);
  }, []);

  
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
