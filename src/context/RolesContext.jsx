import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { roleService } from '../api/services/roleService';
import { showErrorToast } from '../utils/notifications';
import { useAuth } from './AuthContext';


const RolesContext = createContext(null);

export const RolesProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  
  const lastFetchedRef = useRef(null);
  const isFetchingRef = useRef(false);
  const rolesRef = useRef([]);
  const errorRef = useRef(null);
  const lastErrorTimeRef = useRef(null);

  
  const CACHE_DURATION = 5 * 60 * 1000;
  
  const ERROR_COOLDOWN = 30 * 1000;

  
  const isCacheValid = useCallback(() => {
    if (!lastFetchedRef.current || rolesRef.current.length === 0) return false;
    const now = Date.now();
    return (now - lastFetchedRef.current) < CACHE_DURATION;
  }, [CACHE_DURATION]);

  
  const shouldRetryAfterError = useCallback(() => {
    if (!lastErrorTimeRef.current) return true;
    const now = Date.now();
    return (now - lastErrorTimeRef.current) > ERROR_COOLDOWN;
  }, [ERROR_COOLDOWN]);

  
  const fetchRoles = useCallback(async (forceRefresh = false) => {
    
    if (!isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('[RolesContext] User not authenticated, skipping roles fetch');
      }
      return [];
    }

    
    if (!forceRefresh && isCacheValid()) {
      if (import.meta.env.DEV) {
        console.log('[RolesContext] Using cached roles');
      }
      return rolesRef.current;
    }

    
    if (isFetchingRef.current) {
      if (import.meta.env.DEV) {
        console.log('[RolesContext] Fetch already in progress, skipping...');
      }
      return rolesRef.current;
    }

    
    if (errorRef.current && !forceRefresh && !shouldRetryAfterError()) {
      if (import.meta.env.DEV) {
        console.log('[RolesContext] Error cooldown active, skipping retry...');
      }
      return rolesRef.current;
    }

    
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    errorRef.current = null;

    try {
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

      
      setRoles(rolesData);
      rolesRef.current = rolesData;
      lastFetchedRef.current = Date.now();
      lastErrorTimeRef.current = null; 
      
      return rolesData;
    } catch (err) {
      const errorMessage =
        err.message || err.response?.data?.message || err.response?.data?.errors?.message || 'Failed to load roles';
      
      
      errorRef.current = errorMessage;
      lastErrorTimeRef.current = Date.now();
      setError(errorMessage);
      
      
      if (rolesRef.current.length === 0) {
        showErrorToast(errorMessage);
      } else {
        
        if (import.meta.env.DEV) {
          console.warn('[RolesContext] Error fetching roles, using cached data:', errorMessage);
        }
      }
      
      console.error('[RolesContext] Error fetching roles:', err);
      
      
      return rolesRef.current.length > 0 ? rolesRef.current : [];
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAuthenticated, isCacheValid, shouldRetryAfterError]);

  
  useEffect(() => {
    let isMounted = true;

    
    if (authLoading) {
      return;
    }

    const initializeRoles = async () => {
      
      if (!isAuthenticated) {
        
        if (rolesRef.current.length > 0) {
          setRoles([]);
          rolesRef.current = [];
          lastFetchedRef.current = null;
        }
        return;
      }

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
    
  }, [isAuthenticated, authLoading]); 

  
  useEffect(() => {
    rolesRef.current = roles;
  }, [roles]);

  
  useEffect(() => {
    if (error) {
      errorRef.current = error;
    }
  }, [error]);

  
  const value = useMemo(() => {
    const cacheValid = isCacheValid();
    return {
      roles,
      loading,
      error,
      fetchRoles,
      refetch: () => fetchRoles(true), 
      isCacheValid: cacheValid,
    };
  }, [roles, loading, error, fetchRoles, isCacheValid]);

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>;
};


export const useRolesContext = () => {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error('useRolesContext must be used within RolesProvider');
  }
  return context;
};
