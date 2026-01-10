import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiSearch, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiDotsVertical, HiChevronDown } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../../../api/services/userService";
import Pagination from "../../../components/Pagination";
import AddUserModal from "../../../components/User/AddUserModal";
import { showDeleteConfirm, showSuccessToast, showErrorToast } from "../../../utils/notifications";

/**
 * Users Management Page - Admin View
 * Displays and manages users with filtering, search, and CRUD operations
 */
const Users = () => {
  const navigate = useNavigate();
  
  // Filter and selection state
  const [selected, setSelected] = useState("Instructor");
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const dropdownRefs = useRef({});
  const sortDropdownRef = useRef(null);
  
  // Sort state
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const roleFilters = ["Instructor", "Student", "Admin"];

  /**
   * Fetches users from API with current filters
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUsers({
        page: currentPage,
        per_page: itemsPerPage,
        role: selected,
        search: searchTerm,
        sort: sortField,
        order: sortOrder
      });
      if (response.success) {
        setUsers(response.data);
        setTotalItems(response.meta?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error loading users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, selected, searchTerm, sortField, sortOrder]);

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openDropdownId !== null &&
        dropdownRefs.current[openDropdownId] &&
        !dropdownRefs.current[openDropdownId].contains(event.target)
      ) {
        setOpenDropdownId(null);
      }
      
      // Close sort dropdown
      if (
        sortDropdownOpen &&
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId, sortDropdownOpen]);

  /**
   * Handles role filter change
   */
  const handleRoleFilterChange = useCallback((role) => {
    setSelected(role);
    setSelectedIds([]);
    setCurrentPage(1);
  }, []);

  /**
   * Handles sort field change
   */
  const handleSortChange = useCallback((field) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc order
      setSortField(field);
      setSortOrder('desc');
    }
    setSortDropdownOpen(false);
    setCurrentPage(1);
  }, [sortField]);

  /**
   * Handles select all checkbox
   */
  const isAllSelected = selectedIds.length === users.length && users.length > 0;
  const handleSelectAll = useCallback(() => {
    setSelectedIds(isAllSelected ? [] : users.map((user) => user.id));
  }, [isAllSelected, users]);

  /**
   * Handles individual checkbox selection
   */
  const handleSelectOne = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  /**
   * Handles blocking/unblocking a user
   */
  const handleBlockUser = useCallback(async (userId, userName, currentStatus) => {
    const action = currentStatus === 'blocked' ? 'unblock' : 'block';
    const confirmed = await showDeleteConfirm(
      `${action} ${userName}`,
      `Are you sure you want to ${action} this user?`,
      `Yes, ${action} user`
    );
    if (!confirmed) return;

    setActionLoading(userId);
    setOpenDropdownId(null);
    try {
      const response = await userService.blockUser(userId);
      if (response.success) {
        showSuccessToast(response.data.message || `User ${action}ed successfully`);
        fetchUsers();
      }
    } catch (err) {
      showErrorToast(`Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  }, [fetchUsers]);

  /**
   * Handles user creation success
   */
  const handleUserCreated = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Handles row click navigation
   */
  const handleRowClick = useCallback((userId) => {
    navigate(`/users/profile/${userId}`);
  }, [navigate]);

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-inter font-semibold text-gray-800">Users</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-[250px] min-h-[44px]">
              <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full min-w-0"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:inline">⌘</span>
            </div>
            
            {/* Sort Button */}
            <div className="relative w-full sm:w-auto" ref={sortDropdownRef}>
              <button 
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700 min-h-[44px] whitespace-nowrap hover:bg-gray-50 transition-colors"
              >
                <MdFilterList className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Sort by</span>
                <HiChevronDown 
                  size={16} 
                  className={`transition-transform flex-shrink-0 ${sortDropdownOpen ? 'transform rotate-180' : ''}`}
                />
              </button>

              {/* Sort Dropdown */}
              {sortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-48 md:w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => handleSortChange('name')}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                        sortField === 'name' ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Name</span>
                      {sortField === 'name' && (
                        <span className="text-xs text-gray-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSortChange('email')}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                        sortField === 'email' ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Email</span>
                      {sortField === 'email' && (
                        <span className="text-xs text-gray-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSortChange('created_at')}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                        sortField === 'created_at' ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Joined Date</span>
                      {sortField === 'created_at' && (
                        <span className="text-xs text-gray-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSortChange('status')}
                      className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                        sortField === 'status' ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Status</span>
                      {sortField === 'status' && (
                        <span className="text-xs text-gray-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Add User Button */}
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px] whitespace-nowrap"
            >
              <FiPlus size={18} className="flex-shrink-0" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Role Filters */}
        <div className="border-b border-[#F3F4F6] text-sm">
          <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex gap-0.5 sm:gap-4 px-1 sm:px-4 py-1 sm:py-3 min-w-max sm:min-w-0">
              {roleFilters.map((label) => (
                <button
                  key={label}
                  onClick={() => handleRoleFilterChange(label)}
                  className={`py-1 sm:py-1 rounded transition-colors duration-150 whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-0 flex items-center justify-center text-sm font-medium ${
                    selected === label
                      ? "bg-[#C6E4FF] text-black px-0 sm:px-4"
                      : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 px-0 sm:px-4"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative m-4">
            {error}
            <button onClick={fetchUsers} className="ml-4 underline font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Users Table - Horizontal Scrolling on Mobile */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto insect-shadow-sm shadow-lg rounded-xl mt-4 -mx-4 sm:mx-0 px-4 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="inline-block min-w-full align-middle">
                <table className="w-full text-sm text-left border-b border-gray-200" style={{ minWidth: '600px' }}>
                  <thead className="bg-[rgb(249,250,251)] text-black font-inter font-medium">
                    <tr className="h-11">
                      <th className="pl-6 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          aria-label="Select all users"
                          className="min-w-[44px] min-h-[44px]"
                        />
                      </th>
                      <th className="pl-5 whitespace-nowrap">Name</th>
                      <th className="pl-5 whitespace-nowrap">Email</th>
                      <th className="pl-5 whitespace-nowrap">Joined Date</th>
                      <th className="pl-5 whitespace-nowrap">Status</th>
                      <th className="pr-5 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          isSelected={selectedIds.includes(user.id)}
                          onSelect={() => handleSelectOne(user.id)}
                          onRowClick={() => handleRowClick(user.id)}
                          onBlock={() => handleBlockUser(user.id, user.name, user.status)}
                          isActionLoading={actionLoading === user.id}
                          isDropdownOpen={openDropdownId === user.id}
                          onDropdownToggle={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                          dropdownRef={(el) => (dropdownRefs.current[user.id] = el)}
                        />
                      ))
                    ) : (
                      <tr className="h-[72px]">
                        <td colSpan="6" className="text-center text-gray-500 py-6">
                          No users found for "{selected}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="py-2.5 gap-3 flex justify-center">
              <Pagination
                page={currentPage}
                setPage={setCurrentPage}
                perPage={itemsPerPage}
                setPerPage={setItemsPerPage}
                totalItems={totalItems}
              />
            </div>
          </>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={handleUserCreated}
      />
    </div>
  );
};

/**
 * User Row Component - Extracted for reusability and performance
 */
const UserRow = React.memo(({
  user,
  isSelected,
  onSelect,
  onRowClick,
  onBlock,
  isActionLoading,
  isDropdownOpen,
  onDropdownToggle,
  dropdownRef,
}) => {
  const statusConfig = {
    active: {
      bg: "bg-[#E1FAEA]",
      text: "text-[#016626]",
      dot: "bg-[#019939]",
    },
    blocked: {
      bg: "bg-[#FFE3E3]",
      text: "text-[#961616]",
      dot: "bg-[#E12121]",
    },
    inactive: {
      bg: "bg-[#F1F1F1]",
      text: "text-[#4F4D55]",
      dot: "bg-[#18181C]",
    },
  };

  const status = statusConfig[user.status] || {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    dot: "bg-yellow-500",
  };

  return (
    <tr
      onClick={onRowClick}
      className="border-b border-[#EAECF0] hover:bg-blue-50 transition-colors h-[72px] cursor-pointer"
    >
      <td className="p-6" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          aria-label={`Select ${user.name}`}
        />
      </td>
      <td className="p-6 whitespace-nowrap">
        <div className="truncate max-w-[200px]" title={user.name}>
          {user.name}
        </div>
      </td>
      <td className="p-6 whitespace-nowrap">
        <div className="truncate max-w-[250px]" title={user.email}>
          {user.email}
        </div>
      </td>
      <td className="p-6 whitespace-nowrap">
        <div>
          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
        </div>
      </td>
      <td className="p-6">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
          {user.status}
        </span>
      </td>
      <td className="p-4 items-center" onClick={(e) => e.stopPropagation()}>
        {isActionLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <UserActionsDropdown
            userId={user.id}
            userName={user.name}
            status={user.status}
            isOpen={isDropdownOpen}
            onToggle={onDropdownToggle}
            onBlock={onBlock}
            ref={dropdownRef}
          />
        )}
      </td>
    </tr>
  );
});

UserRow.displayName = 'UserRow';

/**
 * User Actions Dropdown Component
 */
const UserActionsDropdown = React.forwardRef(({
  userId,
  userName,
  status,
  isOpen,
  onToggle,
  onBlock,
}, ref) => (
  <div className="relative inline-block" ref={ref}>
    <button
      onClick={onToggle}
      className="text-gray-600 hover:text-black p-1"
      aria-label="User actions"
    >
      <HiDotsVertical className="w-5 h-5 text-gray-500" />
    </button>
    {isOpen && (
      <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
        <Link
          to={`/users/profile/${userId}`}
          onClick={(e) => e.stopPropagation()}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Profile
        </Link>
        <button
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            status === 'blocked' ? 'text-green-600' : 'text-red-600'
          }`}
          onClick={onBlock}
        >
          {status === 'blocked' ? 'Unblock' : 'Block'}
        </button>
      </div>
    )}
  </div>
));

UserActionsDropdown.displayName = 'UserActionsDropdown';

export default Users;
