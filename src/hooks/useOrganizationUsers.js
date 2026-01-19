import { useState, useEffect, useCallback } from 'react';
import { userService } from '../api/services/userService';
import { showErrorToast } from '../utils/notifications';


export const useOrganizationUsers = (organizationId, role, page = 1, itemsPerPage = 10) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    if (!organizationId || !role) {
      setUsers([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userService.getUsers({
        page,
        per_page: itemsPerPage,
        role,
        organization_id: organizationId,
      });

      if (response.success) {
        setUsers(response.data || []);
        setTotal(response.meta?.total || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      const errorMessage = err.message || 'Error loading users';
      setError(errorMessage);
      showErrorToast(errorMessage);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [organizationId, role, page, itemsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    total,
    refetch: fetchUsers,
  };
};

