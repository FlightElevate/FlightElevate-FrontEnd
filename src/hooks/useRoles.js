import { useRolesContext } from '../context/RolesContext';

/**
 * Custom hook for fetching and managing roles
 * Uses RolesContext for global state management and caching
 * 
 * @param {boolean} autoFetch - Whether to fetch roles automatically (deprecated - roles are auto-fetched via context)
 * @returns {Object} - Roles state and fetch function
 * 
 * @example
 * const { roles, loading, fetchRoles } = useRoles();
 */
export const useRoles = (autoFetch = false) => {
  try {
    const context = useRolesContext();
    return context;
  } catch (error) {
    // Fallback if context is not available (should not happen in normal flow)
    console.warn('RolesContext not available, returning empty state');
    return {
      roles: [],
      loading: false,
      error: null,
      fetchRoles: async () => [],
      refetch: async () => [],
      isCacheValid: false,
    };
  }
};

