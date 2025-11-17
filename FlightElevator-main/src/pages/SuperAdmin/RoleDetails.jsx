import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSearch, FiArrowLeft } from "react-icons/fi";
import { roleService } from "../../api/services/roleService";
import { showSuccessToast, showErrorToast } from "../../utils/notifications";

const RoleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingPermissions, setUpdatingPermissions] = useState({});

  useEffect(() => {
    fetchRoleData();
  }, [id]);

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const [roleResponse, permissionsResponse] = await Promise.all([
        roleService.getRole(id),
        roleService.getPermissions(),
      ]);

      if (roleResponse.success) {
        setRole(roleResponse.data);
      }
      if (permissionsResponse.success) {
        setPermissions(permissionsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching role data:', err);
      showErrorToast('Failed to load role details');
      navigate('/roles-permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (permissionName, isChecked) => {
    if (!role) return;

    const key = permissionName;
    setUpdatingPermissions(prev => ({ ...prev, [key]: true }));

    try {
      const currentPermissions = role.permissions || [];
      let updatedPermissions;

      if (isChecked) {
        // Add permission
        updatedPermissions = [...currentPermissions, permissionName];
      } else {
        // Remove permission
        updatedPermissions = currentPermissions.filter(p => p !== permissionName);
      }

      const response = await roleService.updateRolePermissions(role.id, updatedPermissions);
      if (response.success) {
        showSuccessToast('Permission updated successfully');
        // Update local state
        setRole({ ...role, permissions: updatedPermissions });
      }
    } catch (err) {
      showErrorToast('Failed to update permission');
    } finally {
      setUpdatingPermissions(prev => ({ ...prev, [key]: false }));
    }
  };

  const hasPermission = (permissionName) => {
    if (!role || !role.permissions) return false;
    return role.permissions.includes(permissionName);
  };

  const filteredPermissions = permissions.filter((perm) =>
    perm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-12">
          <p className="text-center text-gray-500">Role not found</p>
          <button
            onClick={() => navigate('/roles-permissions')}
            className="mt-4 mx-auto block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Roles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/roles-permissions')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {role.name} - Permissions
            </h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
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
        <div className="p-4">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Permissions</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-700 text-center w-24">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPermissions.length > 0 ? (
                  filteredPermissions.map((permission, permIndex) => {
                    const isChecked = hasPermission(permission);
                    const isUpdating = updatingPermissions[permission];

                    return (
                      <tr
                        key={permIndex}
                        className={`border-b border-gray-200 ${
                          permIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                          {permission}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isUpdating ? (
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                handlePermissionToggle(permission, e.target.checked)
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center text-gray-500 py-6">
                      {searchQuery ? "No permissions found matching your search" : "No permissions available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDetails;

