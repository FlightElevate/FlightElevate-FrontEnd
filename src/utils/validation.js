


export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


export const isValidPassword = (password, minLength = 6) => {
  return password && password.length >= minLength;
};


export const validateUserForm = (formData, options = {}) => {
  const {
    requireUsername = false,
    requirePhone = false,
    minPasswordLength = 6,
  } = options;

  const errors = {};

  
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  }

  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(formData.password, minPasswordLength)) {
    errors.password = `Password must be at least ${minPasswordLength} characters`;
  }

  
  if (requireUsername && !formData.username?.trim()) {
    errors.username = 'Username is required';
  }

  
  if (requirePhone && !formData.phone?.trim()) {
    errors.phone = 'Phone number is required';
  }

  
  if (!formData.role) {
    errors.role = 'Role is required';
  }

  
  if (formData.role === 'Admin' && !formData.organization_name?.trim()) {
    errors.organization_name = 'Organization name is required when creating an Admin';
  }

  return errors;
};


export const clearFieldError = (errors, fieldName) => {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
};

