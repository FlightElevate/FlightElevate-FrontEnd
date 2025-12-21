import { useState, useEffect, useCallback } from 'react';
import { organizationService } from '../api/services/organizationService';
import { userService } from '../api/services/userService';
import { showErrorToast } from '../utils/notifications';

/**
 * Custom hook for fetching organization details
 * Can fetch by organization ID or by admin user ID
 * 
 * @param {number|string} id - Organization ID or Admin User ID
 * @param {string} type - 'organization' or 'user' (default: 'user')
 * @returns {Object} - { organization, adminUser, loading, error, refetch }
 */
export const useOrganizationDetails = (id, type = 'user') => {
  const [organization, setOrganization] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setOrganization(null);
      setAdminUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (type === 'organization') {
        // Fetch organization directly
        const orgResponse = await organizationService.getOrganization(id);
        
        if (orgResponse.success) {
          setOrganization(orgResponse.data);
          
          // Try to find admin user for this organization
          try {
            const usersResponse = await userService.getUsers({
              role: 'Admin',
              organization_id: id,
              per_page: 1,
            });
            
            if (usersResponse.success && usersResponse.data && usersResponse.data.length > 0) {
              setAdminUser(usersResponse.data[0]);
            }
          } catch (err) {
            // Admin not found is not a critical error
            console.warn('Admin user not found for organization:', err);
          }
        } else {
          throw new Error(orgResponse.message || 'Failed to fetch organization');
        }
      } else {
        // Fetch user first (assuming it's an admin)
        const userResponse = await userService.getUser(id);
        
        if (userResponse.success) {
          const user = userResponse.data;
          setAdminUser(user);
          
          // If user has organization_id, fetch organization details
          if (user.organization_id) {
            try {
              const orgResponse = await organizationService.getOrganization(user.organization_id);
              
              if (orgResponse.success) {
                setOrganization(orgResponse.data);
              }
            } catch (err) {
              console.warn('Organization not found:', err);
            }
          }
        } else {
          throw new Error(userResponse.message || 'Failed to fetch user details');
        }
      }
    } catch (err) {
      const errorMessage = err.message || 'Error loading organization details';
      setError(errorMessage);
      showErrorToast(errorMessage);
      setOrganization(null);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    organization,
    adminUser,
    loading,
    error,
    refetch: fetchData,
  };
};

