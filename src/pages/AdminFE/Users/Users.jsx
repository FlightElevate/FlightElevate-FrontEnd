import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiSearch, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";
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
  const dropdownRefs = useRef({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const roleFilters = ["Instructor", "Student", "Admin"];

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage, selected, searchTerm]);

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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

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
        sort: 'created_at',
        order: 'desc'
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
  }, [currentPage, itemsPerPage, selected, searchTerm]);

  /**
   * Handles role filter change
   */
  const handleRoleFilterChange = useCallback((role) => {
    setSelected(role);
    setSelectedIds([]);
    setCurrentPage(1);
  }, []);

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
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm grow sm:grow-0 sm:w-[250px]">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">⌘</span>
            </div>
            
            {/* Sort Button */}
            <button className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700">
              <MdFilterList className="w-5 h-5" />
              <span className="whitespace-nowrap">Sort by</span>
            </button>
            
            {/* Add User Button */}
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <FiPlus size={18} />
              <span className="whitespace-nowrap">Add User</span>
            </button>
          </div>
        </div>

        {/* Role Filters */}
        <div className="px-4 py-3 border-b border-[#F3F4F6] flex gap-4 text-sm">
          {roleFilters.map((label) => (
            <button
              key={label}
              onClick={() => handleRoleFilterChange(label)}
              className={`px-3 py-1 rounded transition-colors duration-150 ${
                selected === label
                  ? "bg-[#C6E4FF] text-black"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
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

        {/* Users Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto insect-shadow-sm shadow-lg rounded-xl">
              <table className="w-full text-sm text-left border-b border-gray-200 mt-4">
                <thead className="bg-[rgb(249,250,251)] text-black font-inter font-medium">
                  <tr className="h-11">
                    <th className="pl-6">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        aria-label="Select all users"
                      />
                    </th>
                    <th className="pl-5">Name</th>
                    <th className="pl-5">Email</th>
                    <th className="pl-5">Joined Date</th>
                    <th className="pl-5">Status</th>
                    <th className="pr-5">Action</th>
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
      <td className="p-6">{user.name}</td>
      <td className="p-6">{user.email}</td>
      <td className="p-6">
        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
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
