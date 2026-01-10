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

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [dropdownOpen]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-2">
          {/* Left side - Sidebar Toggle & Search */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0">
            {/* Sidebar Toggle Button - Visible on mobile and tablet, hidden on desktop */}
            <button 
              onClick={toggleSidebar}
              className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors p-2 rounded-lg flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={22} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="Search"
            >
              <FiSearch size={20} />
            </button>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0">
            {/* Notification Bell - Hidden on very small screens, shown from 360px+ */}
            <button 
              className="hidden min-[360px]:flex text-gray-600 hover:text-gray-900 transition-colors relative min-w-[44px] min-h-[44px] items-center justify-center p-2 rounded-lg hover:bg-gray-100"
              aria-label="Notifications"
            >
              <HiBell size={20} />
              {/* You can add notification badge here if needed */}
            </button>

            {/* Separator - Hidden on very small screens, shown from 360px+ */}
            <div className="hidden min-[360px]:block h-6 w-px bg-gray-300 flex-shrink-0"></div>

            {/* Profile Dropdown */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 text-gray-700 hover:text-gray-900 transition-colors min-h-[44px] px-1 sm:px-2 rounded-lg hover:bg-gray-100"
                aria-label="Profile menu"
                aria-expanded={dropdownOpen}
              >
                {/* Profile Picture */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0 text-xs sm:text-sm">
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
                
                {/* Profile Text - Hidden on very small screens */}
                <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">Profile</span>
                
                {/* Dropdown Arrow - Hidden on very small screens */}
                <HiChevronDown
                  size={18}
                  className={`hidden sm:block transition-transform flex-shrink-0 ${dropdownOpen ? 'transform rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={handleProfile}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleSettings}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center"
                    >
                      Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center"
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
