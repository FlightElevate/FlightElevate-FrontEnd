import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiSearch, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../../api/services/userService";
import { organizationService } from "../../api/services/organizationService";
import Pagination from "../../components/Pagination";
import AddUserModal from "../../components/User/AddUserModal";
import { showDeleteConfirm, showSuccessToast, showErrorToast } from "../../utils/notifications";

/**
 * User Management Page - Super Admin View
 * Displays and manages users with filtering, search, and CRUD operations
 */
const UserManagement = () => {
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

  const roleFilters = ["Instructor", "Student", "Organization", "Admin"];

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
   * Fetches data from API with current filters
   * If "Organization" is selected, fetches organizations, otherwise fetches users
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;

      // If Organization tab is selected, fetch organizations
      if (selected === "Organization") {
        response = await organizationService.getOrganizations({
          page: currentPage,
          per_page: itemsPerPage,
          search: searchTerm,
          sort: 'created_at',
          order: 'desc'
        });
      } else {
        // Otherwise fetch users
        response = await userService.getUsers({
          page: currentPage,
          per_page: itemsPerPage,
          role: selected,
          search: searchTerm,
          sort: 'created_at',
          order: 'desc'
        });
      }

      if (response.success) {
        setUsers(response.data);
        setTotalItems(response.meta?.total || 0);
      } else {
        setError(`Failed to fetch ${selected === "Organization" ? "organizations" : "users"}`);
      }
    } catch (err) {
      console.error(`Error fetching ${selected === "Organization" ? "organizations" : "users"}:`, err);
      setError(`Error loading ${selected === "Organization" ? "organizations" : "users"}. Please try again.`);
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
  const handleRowClick = useCallback(async (item) => {
    if (selected === "Organization") {
      // For Organization, navigate directly with organization ID and type
      navigate(`/user-management/organization/${item.id}?type=organization`);
    } else if (selected === "Admin") {
      // For Admin, go to organization detail (user type)
      navigate(`/user-management/organization/${item.id}?type=user`);
    } else {
      // For other roles, go to user profile
      navigate(`/user-management/profile/${item.id}`);
    }
  }, [navigate, selected]);

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-inter font-semibold text-gray-800">
            User Management
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
                ⌘
              </span>
            </div>
            
            {/* Sort Button */}
            <button className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700">
              <MdFilterList className="w-[20px] h-[20px]" />
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
        <div className="px-4 py-3 border-b border-[#F3F4F6] flex gap-[16px] text-sm">
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
                <thead className="bg-[#F9FAFB] text-black font-inter font-medium">
                  <tr className="h-[44px]">
                    <th className="pl-6">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        aria-label="Select all users"
                      />
                    </th>
                    <th className="pl-5">Name</th>
                    {selected !== "Organization" && <th className="pl-5">Email</th>}
                    {selected === "Organization" && <th className="pl-5">Contact Email</th>}
                    {selected !== "Organization" && <th className="pl-5">Organization</th>}
                    {selected === "Organization" && <th className="pl-5">Users Count</th>}
                    {selected === "Organization" && <th className="pl-5">Aircraft Count</th>}
                    {selected !== "Organization" && <th className="pl-5">Role</th>}
                    <th className="pl-5">Joined Date</th>
                    {selected !== "Organization" && <th className="pl-5">Status</th>}
                    {selected === "Organization" && <th className="pl-5">Status</th>}
                    <th className="pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((item) => {
                      // If Organization tab, render organization row, otherwise user row
                      if (selected === "Organization") {
                        return (
                          <OrganizationRow
                            key={item.id}
                            organization={item}
                            isSelected={selectedIds.includes(item.id)}
                            onSelect={() => handleSelectOne(item.id)}
                            onRowClick={() => handleRowClick(item)}
                            isDropdownOpen={openDropdownId === item.id}
                            onDropdownToggle={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                            dropdownRef={(el) => (dropdownRefs.current[item.id] = el)}
                          />
                        );
                      }
                      return (
                        <SuperAdminUserRow
                          key={item.id}
                          user={item}
                          selectedRole={selected}
                          isSelected={selectedIds.includes(item.id)}
                          onSelect={() => handleSelectOne(item.id)}
                          onRowClick={() => handleRowClick(item)}
                          onBlock={() => handleBlockUser(item.id, item.name, item.status)}
                          isActionLoading={actionLoading === item.id}
                          isDropdownOpen={openDropdownId === item.id}
                          onDropdownToggle={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                          dropdownRef={(el) => (dropdownRefs.current[item.id] = el)}
                        />
                      );
                    })
                  ) : (
                    <tr className="h-[72px]">
                      <td colSpan={selected === "Organization" ? "7" : "8"} className="text-center text-gray-500 py-6">
                        No {selected === "Organization" ? "organizations" : selected.toLowerCase()} found
                      </td>
                    </tr>
                  )}
                  <tr className="h-[72px]">
                    <td colSpan="8" className="h-22"></td>
                  </tr>
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
 * Super Admin User Row Component - Includes Organization column
 */
const SuperAdminUserRow = React.memo(({
  user,
  selectedRole,
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
      bg: "bg-green-100",
      text: "text-green-600",
    },
    inactive: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
    },
    blocked: {
      bg: "bg-red-100",
      text: "text-red-600",
    },
  };

  const status = statusConfig[user.status] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
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
      <td className="p-6">{user.organization?.name || 'N/A'}</td>
      <td className="p-6">{user.roles?.[0] || selectedRole}</td>
      <td className="p-6">
        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
      </td>
      <td className="p-6">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
          {user.status || 'Active'}
        </span>
      </td>
      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
        {isActionLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <SuperAdminUserActionsDropdown
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

SuperAdminUserRow.displayName = 'SuperAdminUserRow';

/**
 * Super Admin User Actions Dropdown Component
 */
const SuperAdminUserActionsDropdown = React.forwardRef(({
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
          to={`/user-management/profile/${userId}`}
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

SuperAdminUserActionsDropdown.displayName = 'SuperAdminUserActionsDropdown';

/**
 * Organization Row Component
 * Displays organization information in the table
 */
const OrganizationRow = React.memo(({
  organization,
  isSelected,
  onSelect,
  onRowClick,
  isDropdownOpen,
  onDropdownToggle,
  dropdownRef,
}) => {
  const statusConfig = {
    active: {
      bg: "bg-green-100",
      text: "text-green-600",
    },
    inactive: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
    },
  };

  const status = statusConfig[organization.status] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
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
          aria-label={`Select ${organization.name}`}
        />
      </td>
      <td className="p-6 font-medium">{organization.name}</td>
      <td className="p-6">{organization.contact_email || 'N/A'}</td>
      <td className="p-6">
        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium">
          {organization.users_count || 0} Users
        </span>
      </td>
      <td className="p-6">
        <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs font-medium">
          {organization.aircraft_count || 0} Aircraft
        </span>
      </td>
      <td className="p-6">
        {organization.created_at ? new Date(organization.created_at).toLocaleDateString() : 'N/A'}
      </td>
      <td className="p-6">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
          {organization.status || 'Active'}
        </span>
      </td>
      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
        <OrganizationActionsDropdown
          organizationId={organization.id}
          organizationName={organization.name}
          isOpen={isDropdownOpen}
          onToggle={onDropdownToggle}
          ref={dropdownRef}
        />
      </td>
    </tr>
  );
});

OrganizationRow.displayName = 'OrganizationRow';

/**
 * Organization Actions Dropdown Component
 */
const OrganizationActionsDropdown = React.forwardRef(({
  organizationId,
  organizationName,
  isOpen,
  onToggle,
}, ref) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    // Navigate directly with organization ID
    navigate(`/user-management/organization/${organizationId}?type=organization`);
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={onToggle}
        className="text-gray-600 hover:text-black p-1"
        aria-label="Organization actions"
      >
        <HiDotsVertical className="w-5 h-5 text-gray-500" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
              onToggle();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
});

OrganizationActionsDropdown.displayName = 'OrganizationActionsDropdown';

export default UserManagement;
