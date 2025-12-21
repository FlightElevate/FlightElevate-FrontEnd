import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { roleService } from '../api/services/roleService';
import { showErrorToast } from '../utils/notifications';

/**
 * Roles Context
 * Provides global roles state with caching to prevent unnecessary API calls
 * 
 * Features:
 * - 5-minute cache duration
 * - Prevents duplicate simultaneous requests using ref
 * - Auto-fetches on mount
 * - Memoized values to prevent re-renders
 * - Uses refs to avoid dependency issues
 * - Error handling with no retry on failure
 */
const RolesContext = createContext(null);

export const RolesProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use refs to track state without causing re-renders
  const lastFetchedRef = useRef(null);
  const isFetchingRef = useRef(false);
  const rolesRef = useRef([]);
  const errorRef = useRef(null);
  const lastErrorTimeRef = useRef(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;
  // Error retry cooldown: 30 seconds (prevent rapid retries on error)
  const ERROR_COOLDOWN = 30 * 1000;

  /**
   * Check if cache is still valid
   */
  const isCacheValid = useCallback(() => {
    if (!lastFetchedRef.current || rolesRef.current.length === 0) return false;
    const now = Date.now();
    return (now - lastFetchedRef.current) < CACHE_DURATION;
  }, [CACHE_DURATION]);

  /**
   * Check if we should retry after error
   */
  const shouldRetryAfterError = useCallback(() => {
    if (!lastErrorTimeRef.current) return true;
    const now = Date.now();
    return (now - lastErrorTimeRef.current) > ERROR_COOLDOWN;
  }, [ERROR_COOLDOWN]);

  /**
   * Fetch roles from API
   * Prevents multiple simultaneous calls using ref
   * Handles errors gracefully without retrying
   */
  const fetchRoles = useCallback(async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      if (import.meta.env.DEV) {
        console.log('[RolesContext] Using cached roles');
      }
      return rolesRef.current;
    }

    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      if (import.meta.env.DEV) {
        console.log('[RolesContext] Fetch already in progress, skipping...');
      }
      return rolesRef.current;
    }

    // If we have an error and it's too soon, don't retry
    if (errorRef.current && !forceRefresh && !shouldRetryAfterError()) {
      if (import.meta.env.DEV) {
        console.log('[RolesContext] Error cooldown active, skipping retry...');
      }
      return rolesRef.current;
    }

    // Mark as fetching
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    errorRef.current = null;

    try {
      if (import.meta.env.DEV) {
        console.log('[RolesContext] Fetching roles from API...');
      }
      const response = await roleService.getRoles();

      if (!response) {
        throw new Error('No response received from server');
      }

      let rolesData = [];

      if (response.success && Array.isArray(response.data)) {
        rolesData = response.data;
      } else if (Array.isArray(response)) {
        rolesData = response;
      } else {
        throw new Error(response.message || 'Failed to fetch roles');
      }

      // Update both state and ref
      setRoles(rolesData);
      rolesRef.current = rolesData;
      lastFetchedRef.current = Date.now();
      lastErrorTimeRef.current = null; // Clear error time on success
      
      if (import.meta.env.DEV) {
        console.log('[RolesContext] Roles fetched successfully:', rolesData.length);
      }
      return rolesData;
    } catch (err) {
      const errorMessage =
        err.message || err.response?.data?.message || err.response?.data?.errors?.message || 'Failed to load roles';
      
      // Store error in ref and state
      errorRef.current = errorMessage;
      lastErrorTimeRef.current = Date.now();
      setError(errorMessage);
      
      // Only show toast if we have no cached data
      if (rolesRef.current.length === 0) {
        showErrorToast(errorMessage);
      } else {
        // If we have cached data, just log the error
        if (import.meta.env.DEV) {
          console.warn('[RolesContext] Error fetching roles, using cached data:', errorMessage);
        }
      }
      
      console.error('[RolesContext] Error fetching roles:', err);
      
      // Return existing roles on error (don't clear cache)
      return rolesRef.current.length > 0 ? rolesRef.current : [];
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isCacheValid, shouldRetryAfterError]);

  /**
   * Initialize roles on mount if not cached
   * Only runs once on component mount
   */
  useEffect(() => {
    let isMounted = true;

    const initializeRoles = async () => {
      if (!isCacheValid()) {
        await fetchRoles();
      } else {
        if (import.meta.env.DEV) {
          console.log('[RolesContext] Using existing cached roles on mount');
        }
      }
    };

    if (isMounted) {
      initializeRoles();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * Sync refs when roles state changes
   */
  useEffect(() => {
    rolesRef.current = roles;
  }, [roles]);

  /**
   * Sync error ref when error state changes
   */
  useEffect(() => {
    if (error) {
      errorRef.current = error;
    }
  }, [error]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const value = useMemo(() => {
    const cacheValid = isCacheValid();
    return {
      roles,
      loading,
      error,
      fetchRoles,
      refetch: () => fetchRoles(true), // Force refresh
      isCacheValid: cacheValid,
    };
  }, [roles, loading, error, fetchRoles, isCacheValid]);

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>;
};

/**
 * Hook to use roles context
 */
export const useRolesContext = () => {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error('useRolesContext must be used within RolesProvider');
  }
  return context;
};
