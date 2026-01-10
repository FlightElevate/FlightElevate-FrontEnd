import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HiDotsVertical } from "react-icons/hi";
import { FiSearch, FiX } from "react-icons/fi";
import { roleService } from "../../api/services/roleService";
import { useRolesContext } from "../../context/RolesContext";
import { showSuccessToast, showErrorToast, showConfirmDialog } from "../../utils/notifications";
import { useAuth } from "../../context/AuthContext";
import { getNavigationItemsByRole } from "../../config/navigation";
import { isSuperAdmin } from "../../utils/roleUtils";

const RolesPermissions = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { roles: contextRoles, fetchRoles: refetchRoles } = useRolesContext();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]); // Store all permissions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingPermissions, setUpdatingPermissions] = useState({});
  const dropdownRefs = useRef({});
  const [viewMode, setViewMode] = useState("detailed"); // "summary" or "detailed"
  
  // Check if current user is super admin
  const userIsSuperAdmin = useMemo(() => {
    return user?.roles ? isSuperAdmin(user.roles) : false;
  }, [user?.roles]);
  
  // Get admin's accessible navigation items (excluding Super Admin only items)
  const adminNavItems = useMemo(() => {
    if (userIsSuperAdmin || !user?.roles) return [];
    // Get all navigation items for admin
    const allNavItems = getNavigationItemsByRole(user.roles);
    // Filter out Super Admin only items
    const superAdminOnlyLabels = [
      "User Logs",
      "Announcements", 
      "User Management",
      "Subscriptions"
    ];
    return allNavItems.filter(item => !superAdminOnlyLabels.includes(item.label));
  }, [user?.roles, userIsSuperAdmin]);
  
  // Map navigation labels to permission patterns (based on actual permission names from backend)
  const navLabelToPermissionPattern = (label) => {
    const mapping = {
      "Dashboard": ["dashboard"], // Dashboard permissions if any
      "Calendar": ["calendar", "events"], // view calendar, create events, edit events, delete events
      "Inbox": ["messages", "message"], // view messages, send messages, delete messages
      "Users": ["users", "user"], // view users, create users, edit users, delete users
      "User Management": ["users", "user", "organizations"], // All user and org management
      "Support": ["support tickets", "support", "ticket"], // view support tickets, create support tickets, etc.
      "Settings": ["setting", "settings"], // Settings permissions if any
      "Air Craft Profile": ["aircraft"], // view aircraft, create aircraft, edit aircraft, delete aircraft
      "Announcements": ["announcements", "announcement"], // view announcements, create announcements, etc.
      "Roles & Permissions": ["roles", "role", "permissions", "permission"], // view roles, create roles, etc.
      "Subscriptions": ["subscriptions", "subscription"], // view subscriptions, create subscriptions, etc.
      "User Logs": ["activity logs", "activity", "log"], // view activity logs
      "Lessons": ["lessons", "lesson"], // view lessons, create lessons, etc.
      "Billing": ["billing", "payment"], // Billing related permissions if any
    };
    
    return mapping[label] || [label.toLowerCase().replace(/\s+/g, ' ')];
  };
  
  // Filter permissions based on admin's accessible navigation items
  const filteredPermissionsForAdmin = useMemo(() => {
    if (userIsSuperAdmin || !allPermissions.length || !adminNavItems.length) {
      return allPermissions; // Super admin sees all, or return all if no filter needed
    }
    
    // Get all permission patterns from accessible nav items
    const allowedPatterns = adminNavItems.flatMap(item => 
      navLabelToPermissionPattern(item.label)
    );
    
    // Remove duplicates and normalize
    const uniquePatterns = [...new Set(allowedPatterns.map(p => p.toLowerCase()))];
    
    // Filter permissions that match any of the patterns
    // Permission names are like "view users", "create aircraft", "view support tickets", etc.
    return allPermissions.filter(permission => {
      const permLower = permission.toLowerCase();
      return uniquePatterns.some(pattern => 
        permLower.includes(pattern) || permLower.startsWith(pattern) || permLower.endsWith(pattern)
      );
    });
  }, [allPermissions, adminNavItems, userIsSuperAdmin]);
  
  // Modal states
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount, use context roles

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu !== null && dropdownRefs.current[openMenu] && !dropdownRefs.current[openMenu].contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use context roles directly (they're already cached and loaded)
      // Don't fetch roles again if we have them in context
      let rolesData = contextRoles;
      
      // Only fetch from API if context has no roles
      if (!rolesData || rolesData.length === 0) {
        if (import.meta.env.DEV) {
          console.log('[RolesPermissions] No roles in context, fetching...');
        }
        rolesData = await refetchRoles();
      } else {
        if (import.meta.env.DEV) {
          console.log('[RolesPermissions] Using roles from context');
        }
      }
      
      // Debug: Log raw roles data
      if (import.meta.env.DEV) {
        console.log('[RolesPermissions] Raw roles data:', {
          count: rolesData?.length || 0,
          roles: rolesData?.map(r => ({ 
            id: r.id, 
            name: r.name, 
            admin_identify_id: r.admin_identify_id,
            admin_identify_id_type: typeof r.admin_identify_id
          })) || [],
          userOrgId: user?.organization_id,
          userOrgIdType: typeof user?.organization_id,
          userIsSuperAdmin
        });
      }

      // Filter roles for Admin users
      if (!userIsSuperAdmin && rolesData && rolesData.length > 0) {
        // For Admin: Exclude Super Admin and Admin, show only Instructor, Student, and admin-created roles
        rolesData = rolesData.filter(role => {
          const roleName = role.name?.toLowerCase() || '';
          
          // Exclude Super Admin and Admin roles
          if (roleName === 'super admin' || roleName === 'super-admin' || roleName === 'admin') {
            return false;
          }
          
          // IMPORTANT: Check admin-created roles FIRST (before Instructor/Student check)
          // If admin_identify_id is NOT null, it means this role was created by an admin
          // Only show it to the admin whose organization_id matches admin_identify_id
          if (role.admin_identify_id !== null && role.admin_identify_id !== undefined) {
            // This is an admin-created role - only show to the admin who created it
            if (user?.organization_id) {
              const roleOrgId = Number(role.admin_identify_id);
              const userOrgId = Number(user.organization_id);
              
              // Debug logging
              if (import.meta.env.DEV) {
                console.log('[RolesPermissions] Checking admin-created role:', {
                  roleName: role.name,
                  roleId: role.id,
                  roleAdminId: roleOrgId,
                  userOrgId: userOrgId,
                  match: roleOrgId === userOrgId
                });
              }
              
              // Only show if admin_identify_id matches current admin's organization_id
              if (roleOrgId === userOrgId) {
                return true; // Show this admin-created role
              }
            }
            // Don't show admin-created roles to other admins
            return false;
          }
          
          // Include Instructor and Student roles (system roles with null admin_identify_id)
          // Either system roles (null admin_identify_id) OR organization-specific versions
          if (roleName === 'instructor' || roleName === 'student') {
            // System role (null admin_identify_id) - show to all admins
            if (role.admin_identify_id === null || role.admin_identify_id === undefined) {
              return true;
            }
            // Organization-specific role - only show if it matches current admin's organization
            // (This case is already handled above in admin_identify_id check)
            return false;
          }
          
          // If admin_identify_id is null and it's not Instructor/Student, it's another system role
          // Don't show other system roles to regular admins
          return false;
        });
        
        if (import.meta.env.DEV) {
          console.log('[RolesPermissions] Filtered roles for Admin:', {
            totalRoles: contextRoles?.length || 0,
            filteredRoles: rolesData.length,
            userOrgId: user?.organization_id,
            roles: rolesData.map(r => ({ name: r.name, admin_identify_id: r.admin_identify_id }))
          });
        }
      }

      // Fetch permissions (separate endpoint, no caching needed here)
      const permissionsResponse = await roleService.getPermissions();

      // Always set roles, even if empty array (to clear previous state)
      setRoles(rolesData || []);
      
      if (import.meta.env.DEV) {
        console.log('[RolesPermissions] Setting roles to state:', {
          count: rolesData?.length || 0,
          roles: rolesData?.map(r => ({ id: r.id, name: r.name, admin_identify_id: r.admin_identify_id })) || []
        });
      }
      
      // Store all permissions
      let allPerms = [];
      if (permissionsResponse && permissionsResponse.success) {
        allPerms = permissionsResponse.data;
      } else if (permissionsResponse && Array.isArray(permissionsResponse)) {
        // Handle case where response is directly an array
        allPerms = permissionsResponse;
      }
      
      setAllPermissions(allPerms);
      // Filtered permissions will be set via useMemo
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.message || 'Error loading data';
      console.error('[RolesPermissions] Error fetching data:', err);
      setError(errorMessage);
      
      // Only show toast if we have no cached roles
      if (!contextRoles || contextRoles.length === 0) {
        showErrorToast('Failed to load roles and permissions');
      } else {
        // If we have cached roles, just show error for permissions
        showErrorToast('Failed to load permissions');
      }
      
      // Don't clear roles if we have cached ones
      if (contextRoles && contextRoles.length > 0) {
        setRoles(contextRoles);
      } else {
        setRoles([]);
      }
      setAllPermissions([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [contextRoles, refetchRoles, userIsSuperAdmin, user?.organization_id]);
  
  // Update filtered permissions when allPermissions or adminNavItems change
  useEffect(() => {
    if (userIsSuperAdmin) {
      setPermissions(allPermissions);
    } else {
      setPermissions(filteredPermissionsForAdmin);
    }
  }, [allPermissions, filteredPermissionsForAdmin, userIsSuperAdmin]);

  // Check if role can be deleted (only admin-created roles can be deleted)
  const canDeleteRole = (role) => {
    // Super Admin can delete any role (except Super Admin itself)
    if (userIsSuperAdmin) {
      const roleName = role.name?.toLowerCase() || '';
      return roleName !== 'super admin' && roleName !== 'super-admin';
    }
    
    // Admin can only delete roles they created (admin_identify_id matches their organization_id)
    if (user?.organization_id && role.admin_identify_id) {
      return role.admin_identify_id === user.organization_id;
    }
    
    // System roles (Instructor, Student) cannot be deleted
    return false;
  };

  const handleDelete = async (id, roleName) => {
    const role = roles.find(r => r.id === id);
    if (!role) return;

    // Check if role can be deleted
    if (!canDeleteRole(role)) {
      showErrorToast('This role cannot be deleted');
      return;
    }

    const confirmed = await showConfirmDialog(
      `Delete ${roleName}`,
      `Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`,
      'Yes, delete'
    );
    if (!confirmed) return;

    setActionLoading(id);
    setOpenMenu(null);
    try {
      const response = await roleService.deleteRole(id);
      if (response.success) {
        showSuccessToast('Role deleted successfully');
        fetchData();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete role');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermissionToggle = async (roleId, permissionName, isChecked) => {
    const key = `${roleId}-${permissionName}`;
    setUpdatingPermissions(prev => ({ ...prev, [key]: true }));

    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      const currentPermissions = role.permissions || [];
      let updatedPermissions;

      if (isChecked) {
        // Add permission
        updatedPermissions = [...currentPermissions, permissionName];
      } else {
        // Remove permission
        updatedPermissions = currentPermissions.filter(p => p !== permissionName);
      }

      const response = await roleService.updateRolePermissions(roleId, updatedPermissions);
      if (response.success) {
        showSuccessToast('Permission updated successfully');
        
        // If backend created a new organization-specific role, update the role ID
        const updatedRoleId = response.data?.id || roleId;
        
        // Update local state - handle case where role ID might have changed (org-specific copy created)
        if (updatedRoleId !== roleId && response.data) {
          // New organization-specific role was created, replace the old one
          setRoles(prevRoles => {
            const filtered = prevRoles.filter(r => r.id !== roleId);
            return [...filtered, {
              id: response.data.id,
              name: response.data.name,
              permissions: response.data.permissions || updatedPermissions,
              admin_identify_id: response.data.admin_identify_id
            }];
          });
        } else {
          // Same role, just update permissions
          setRoles(prevRoles =>
            prevRoles.map(r =>
              r.id === roleId
                ? { 
                    ...r, 
                    permissions: response.data?.permissions || updatedPermissions,
                    admin_identify_id: response.data?.admin_identify_id || r.admin_identify_id
                  }
                : r
            )
          );
        }
        
        // Refetch roles to ensure we have the latest data (especially if org-specific copy was created)
        await fetchData();
        
        // If this was Instructor/Student role and org-specific copy was created,
        // users were migrated - refresh current user data to get updated roles
        const role = roles.find(r => r.id === roleId);
        const roleName = role?.name?.toLowerCase() || '';
        if ((roleName === 'instructor' || roleName === 'student') && updatedRoleId !== roleId) {
          // Refresh user data to get updated roles (if current user is affected)
          if (refreshUser) {
            await refreshUser();
          }
        }
      }
    } catch (err) {
      showErrorToast('Failed to update permission');
    } finally {
      setUpdatingPermissions(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  const handleRowClick = (role) => {
    navigate(`/roles-permissions/${role.id}`);
  };

  const handleAddRoleClick = () => {
    setNewRoleName("");
    setSelectedPermissions([]);
    setShowAddRoleModal(true);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      showErrorToast('Please enter role name');
      return;
    }

    setSavingRole(true);
    try {
      const response = await roleService.createRole({
        name: newRoleName,
        permissions: selectedPermissions,
      });

      if (response.success) {
        showSuccessToast('Role created successfully');
        setShowAddRoleModal(false);
        setNewRoleName("");
        setSelectedPermissions([]);
        fetchData();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to create role');
    } finally {
      setSavingRole(false);
    }
  };

  const handlePermissionSelect = (permission) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const hasPermission = (roleId, permissionName) => {
    const role = roles.find(r => r.id === roleId);
    if (!role || !role.permissions) return false;
    return role.permissions.includes(permissionName);
  };

  const filteredPermissions = permissions.filter((perm) =>
    perm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermissionDisplay = (role) => {
    if (!role.permissions || role.permissions.length === 0) {
      return <span className="text-gray-400 text-sm">No permissions</span>;
    }

    // Check if has "All Access" or similar
    const hasAllAccess = role.permissions.some(p => 
      p.toLowerCase().includes('all') || p.toLowerCase() === 'all access'
    );

    if (hasAllAccess) {
      return <span className="text-blue-600 font-medium">All Access</span>;
    }

    // Show first few permissions as tags
    const displayPerms = role.permissions.slice(0, 4);
    return (
      <div className="flex flex-wrap gap-2">
        {displayPerms.map((perm, idx) => (
          <span
            key={idx}
            className="inline-block px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
          >
            {perm}
          </span>
        ))}
        {role.permissions.length > 4 && (
          <span className="text-gray-400 text-xs">+{role.permissions.length - 4} more</span>
        )}
      </div>
    );
  };

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        {/* Header */}
        <div className="mb-1 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">Roles</h2>
              {!userIsSuperAdmin && adminNavItems.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing permissions for: {adminNavItems.map(item => item.label).join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={handleAddRoleClick}
              className="ml-4 px-4 py-2 bg-[#1376CD] text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
            >
              Add New Role
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="px-4 py-2 border-b border-gray-200 flex gap-2">
          <button
            onClick={() => setViewMode("summary")}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === "summary"
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode("detailed")}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === "detailed"
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Permissions
          </button>
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
            <button onClick={fetchData} className="ml-4 underline font-semibold">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary View */}
            {viewMode === "summary" && (
              <div className="overflow-x-auto border-t border-gray-200">
                <table className="table-auto w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-sm font-medium text-gray-700">Role</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-700">Permissions</th>
                      <th className="w-10 text-right px-4 py-2"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {roles.length > 0 ? (
                      roles.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 hover:bg-gray-50 relative cursor-pointer"
                          onClick={() => handleRowClick(item)}
                        >
                          <td className="p-4 text-sm font-medium text-gray-800">{item.name}</td>
                          <td className="px-4 py-3">{getPermissionDisplay(item)}</td>
                          <td className="px-4 py-3 text-right relative" onClick={(e) => e.stopPropagation()}>
                            {actionLoading === item.id ? (
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              <div ref={(el) => (dropdownRefs.current[index] = el)}>
                                <button
                                  onClick={() => toggleMenu(index)}
                                  className="p-2 rounded-full hover:bg-gray-200"
                                >
                                  <HiDotsVertical className="w-5 h-5 text-gray-500" />
                                </button>

                                {openMenu === index && (
                                  <div className="absolute right-4 mt-1 mr-4 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <button
                                      onClick={() => {
                                        setOpenMenu(null);
                                        handleRowClick(item);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    >
                                      View Permissions
                                    </button>
                                    {canDeleteRole(item) && (
                                      <button
                                        className="block w-full text-left px-4 py-1 text-sm text-red-600 hover:bg-gray-100"
                                        onClick={() => handleDelete(item.id, item.name)}
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-gray-500 py-6">
                          No roles found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Detailed Permissions View */}
            {viewMode === "detailed" && (
              <div className="p-4">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search Permission"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Permissions Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Permissions</th>
                        {roles.map((role) => (
                          <th
                            key={role.id}
                            className="px-4 py-3 text-xs font-medium text-gray-700 text-center"
                          >
                            {role.name}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPermissions.length > 0 ? (
                        filteredPermissions.map((permission, permIndex) => (
                          <tr
                            key={permIndex}
                            className={`border-b border-gray-200 ${
                              permIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                              {permission}
                            </td>
                            {roles.map((role) => {
                              const isChecked = hasPermission(role.id, permission);
                              const key = `${role.id}-${permission}`;
                              const isUpdating = updatingPermissions[key];

                              return (
                                <td key={role.id} className="px-4 py-3 text-center">
                                  {isUpdating ? (
                                    <div className="flex justify-center">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    </div>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) =>
                                        handlePermissionToggle(role.id, permission, e.target.checked)
                                      }
                                      className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                      style={{ minWidth: '12px', minHeight: '12px', maxWidth: '14px', maxHeight: '14px' }}
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={roles.length + 1} className="text-center text-gray-500 py-6">
                            {searchQuery ? "No permissions found matching your search" : "No permissions available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Add New Role</h3>
              <button
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleName("");
                  setSelectedPermissions([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Permissions
                </label>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {permissions.length > 0 ? (
                    <div className="p-2 space-y-2">
                      {permissions.map((permission, idx) => (
                        <div
                          key={idx}
                          className="flex items-center p-3 hover:bg-gray-50 rounded border border-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission)}
                            onChange={() => handlePermissionSelect(permission)}
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer flex-shrink-0"
                            style={{ minWidth: '12px', minHeight: '12px', maxWidth: '14px', maxHeight: '14px' }}
                          />
                          <label className="ml-3 text-sm text-gray-700 cursor-pointer flex-1">
                            {permission}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm p-4 text-center">No permissions available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleName("");
                  setSelectedPermissions([]);
                }}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={savingRole || !newRoleName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingRole ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
