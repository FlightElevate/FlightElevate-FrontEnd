import { useRolesContext } from '../context/RolesContext';


export const useRoles = (autoFetch = false) => {
  try {
    const context = useRolesContext();
    return context;
  } catch (error) {
    
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

