import { useState, useEffect, useCallback } from 'react';
import { userService } from '../api/services/userService';
import { showErrorToast } from '../utils/notifications';

/**
 * Custom hook for fetching user details
 * Provides loading state, error handling, and user data
 * 
 * @param {number|string} userId - User ID to fetch
 * @returns {Object} - { user, loading, error, refetch }
 */
export const useUserDetails = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userService.getUser(userId);

      if (response.success) {
        setUser(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch user details');
      }
    } catch (err) {
      const errorMessage = err.message || 'Error loading user details';
      setError(errorMessage);
      showErrorToast(errorMessage);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
};

