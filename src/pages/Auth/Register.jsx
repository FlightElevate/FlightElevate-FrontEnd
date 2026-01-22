import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showErrorToast, showSuccessToast } from '../../utils/notifications';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    role: 'Student',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ level: '', text: '', color: '' });
  
  const navigate = useNavigate();
  const { register, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const checkPasswordStrength = (password) => {
    if (!password) {
      return { level: '', text: '', color: '' };
    }

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;
    
    // Contains number
    if (/[0-9]/.test(password)) strength++;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      return { level: 'weak', text: 'Weak', color: 'text-red-600' };
    } else if (strength <= 4) {
      return { level: 'medium', text: 'Medium', color: 'text-yellow-600' };
    } else {
      return { level: 'strong', text: 'Strong', color: 'text-green-600' };
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Check password strength when password field changes
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      showErrorToast('First name and last name are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      showErrorToast('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      showErrorToast('Password must be at least 6 characters long');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      showErrorToast('You must agree to the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      // Combine first and last name into name field (backend expects 'name')
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      const result = await register({
        name: fullName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword, // Required for Laravel password.confirmed validation
        organization_name: formData.organizationName || null,
        role: formData.role || 'Student',
      });
      
      if (result.success) {
        showSuccessToast('Registration successful! Welcome to FlightElevate.');
        navigate('/dashboard');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
        showErrorToast(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      showErrorToast('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-700 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-4">Join FlightElevate</h1>
          <p className="text-blue-100 text-lg mb-8">
            Create your account and start managing your flight school operations with ease.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Easy Setup & Onboarding</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Comprehensive Training Tools</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>24/7 Support & Resources</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:hidden mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">FlightElevate</h2>
          </div>
          
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-700 hover:text-blue-600">
                Sign in
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm transition-colors"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm transition-colors"
                  placeholder="john.doe@example.com"
                />
              </div>

              {/* Organization Name */}
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name (Optional)
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm transition-colors"
                  placeholder="Your Flight School"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  I am a
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm transition-colors"
                >
                  <option value="Student">Student</option>
                  <option value="Instructor">Instructor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 sm:text-sm transition-colors"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.level === 'weak' ? 'bg-red-500 w-1/3' :
                          passwordStrength.level === 'medium' ? 'bg-yellow-500 w-2/3' :
                          passwordStrength.level === 'strong' ? 'bg-green-500 w-full' : 'w-0'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use 8+ characters with a mix of letters, numbers & symbols
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 sm:text-sm transition-colors"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-700 focus:ring-blue-700 border-gray-300 rounded"
                />
              </div>
              <div className="ml-2 text-sm">
                <label htmlFor="agreeToTerms" className="text-gray-700">
                  I agree to the{' '}
                  <Link to="/user-policy" className="font-medium text-blue-700 hover:text-blue-600">
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/user-policy" className="font-medium text-blue-700 hover:text-blue-600">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white ${
                  loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700'
                } transition-colors shadow-sm`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link to="/" className="text-sm text-blue-700 hover:text-blue-600">
                ← Back to home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
