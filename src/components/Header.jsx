import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu } from 'react-icons/fi';
import { HiBell } from 'react-icons/hi';
import { HiChevronDown } from 'react-icons/hi';
import { showConfirmDialog } from '../utils/notifications';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      'Yes, logout'
    );
    
    if (confirmed) {
      await logout();
      navigate('/login');
    }
  };

  const handleSettings = () => {
    setDropdownOpen(false);
    navigate('/setting');
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    // Navigate to user's own profile page
    if (user?.id) {
      navigate(`/users/profile/${user.id}`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Sidebar Toggle & Search */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Sidebar Toggle Button - Visible on mobile and tablet, hidden on desktop */}
            <button 
              onClick={toggleSidebar}
              className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors p-2 rounded-lg flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={22} className="sm:w-6 sm:h-6" />
            </button>
            <button className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors p-2 rounded-lg">
              <FiSearch size={20} />
            </button>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="text-gray-600 hover:text-gray-900 transition-colors relative">
              <HiBell size={20} />
              {/* You can add notification badge here if needed */}
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                {/* Profile Picture */}
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {user?.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user?.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                
                {/* Profile Text */}
                <span className="text-sm font-medium">Profile</span>
                
                {/* Dropdown Arrow */}
                <HiChevronDown
                  size={18}
                  className={`transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={handleSettings}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
