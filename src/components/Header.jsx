import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiMenu, FiX } from 'react-icons/fi';
import { HiBell } from 'react-icons/hi';
import { HiChevronDown } from 'react-icons/hi';
import { showConfirmDialog } from '../utils/notifications';
import { userService } from '../api/services/userService';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Search for users when query changes
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const searchUsersDebounced = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        if (isMounted) {
          setSearchUsers([]);
          setShowSearchResults(false);
        }
        return;
      }

      if (isMounted) {
        setSearchLoading(true);
      }

      try {
        const response = await userService.getUsers({
          page: 1,
          per_page: 8,
          search: searchQuery.trim()
        });

        // Only update state if component is still mounted
        if (isMounted && !abortController.signal.aborted) {
          if (response.success) {
            setSearchUsers(response.data || []);
            setShowSearchResults(response.data && response.data.length > 0);
          } else {
            setSearchUsers([]);
            setShowSearchResults(false);
          }
          setSearchLoading(false);
        }
      } catch (err) {
        // Only log and update state if component is still mounted
        if (isMounted && !abortController.signal.aborted) {
          // Suppress console errors for aborted requests and browser extension errors
          if (err.name !== 'AbortError' && 
              err.name !== 'CanceledError' &&
              !err.message?.includes('runtime.lastError') &&
              !err.message?.includes('message port closed')) {
            console.error('Error searching users:', err);
          }
          setSearchUsers([]);
          setShowSearchResults(false);
          setSearchLoading(false);
        }
      }
    };

    // Debounce search
    const timer = setTimeout(searchUsersDebounced, 300);
    
    return () => {
      isMounted = false;
      abortController.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      // Close search results when clicking outside
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      // Only close search on mobile when clicking outside, and not when clicking on search icon
      if (searchRef.current && !searchRef.current.contains(event.target) && 
          searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        // Check if the click is on the search icon button (to allow toggling)
        const searchButton = event.target.closest('button[aria-label="Search"]');
        if (!searchButton) {
          setSearchOpen(false);
          setShowSearchResults(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // Focus search input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [searchOpen]);

  const handleSearchClick = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setSearchQuery('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && searchUsers.length > 0) {
      // Navigate to first user's profile
      navigate(`/users/profile/${searchUsers[0].id}`);
      setSearchOpen(false);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (userId) => {
    navigate(`/users/profile/${userId}`);
    setSearchOpen(false);
    setSearchQuery('');
    setShowSearchResults(false);
  };

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
          <div className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 ${searchOpen ? 'flex-1 min-w-0' : 'flex-shrink-0 flex-1 min-w-0'}`}>
            {/* Sidebar Toggle Button - Visible on mobile and tablet, hidden on desktop */}
            <button 
              onClick={toggleSidebar}
              className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors p-2 rounded-lg flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={22} className="sm:w-6 sm:h-6" />
            </button>
            
            {/* Search - Desktop: Input always visible, Mobile: Icon button that opens search */}
            {/* Desktop Search - Always visible */}
            <div className="hidden md:flex flex-1 max-w-md relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="flex items-center border border-gray-300 bg-white rounded-lg px-3 py-2 shadow-sm min-h-[44px] hover:border-gray-400 transition-colors">
                  <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={18} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent min-w-0"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearchResults(false);
                        setSearchUsers([]);
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                      aria-label="Clear search"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </form>
              
              {/* Search Results Dropdown - Desktop */}
              {showSearchResults && (
                <div 
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto"
                >
                  <div className="py-2">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        Searching...
                      </div>
                    ) : searchUsers.length > 0 ? (
                      searchUsers.map((userItem) => (
                        <button
                          key={userItem.id}
                          onClick={() => handleSearchResultClick(userItem.id)}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center gap-3 min-h-[44px]"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0 text-xs">
                            {userItem.profile_image ? (
                              <img
                                src={userItem.profile_image}
                                alt={userItem.name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{userItem.name?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{userItem.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 truncate">{userItem.email || userItem.username}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No users found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Search - Toggle button */}
            {searchOpen ? (
              <div ref={searchRef} className="md:hidden flex-1 min-w-0 relative">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <div className="flex items-center border border-gray-300 bg-white rounded-lg px-2 sm:px-3 py-2 shadow-sm min-h-[44px]">
                    <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={18} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent min-w-0"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setShowSearchResults(false);
                          setSearchUsers([]);
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="Clear search"
                      >
                        <FiX size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          setShowSearchResults(false);
                          setSearchUsers([]);
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Close search"
                      >
                        <FiX size={18} />
                      </button>
                    )}
                  </div>
                </form>
                
                {/* Search Results Dropdown - Mobile */}
                {showSearchResults && (
                  <div 
                    ref={searchResultsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[60vh] overflow-y-auto"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <div className="py-2">
                      {searchLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Searching...
                        </div>
                      ) : searchUsers.length > 0 ? (
                        searchUsers.map((userItem) => (
                          <button
                            key={userItem.id}
                            onClick={() => handleSearchResultClick(userItem.id)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center gap-3 min-h-[44px]"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0 text-xs">
                              {userItem.profile_image ? (
                                <img
                                  src={userItem.profile_image}
                                  alt={userItem.name || 'User'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{userItem.name?.charAt(0).toUpperCase() || 'U'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{userItem.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 truncate">{userItem.email || userItem.username}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          No users found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={handleSearchClick}
                className="md:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                aria-label="Search"
              >
                <FiSearch size={20} />
              </button>
            )}
          </div>

          {/* Right side - Notifications and Profile - Hidden when mobile search is open */}
          <div className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0 ${searchOpen ? 'hidden md:flex' : 'flex'}`}>
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
