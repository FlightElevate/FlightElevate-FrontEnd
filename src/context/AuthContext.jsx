import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { authService } from '../api/services/authService';
import { hasRole as checkRole, isSuperAdmin, isAdmin } from '../utils/roleUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  
  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();
    
    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  
  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Invalid credentials' 
      };
    }
  }, []);

  
  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      
      return { success: false, message: 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  }, []);

  
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.me();
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true, user: response.data };
      }
      return { success: false };
    } catch (error) {
      console.error('Refresh user error:', error);
      return { success: false, error };
    }
  }, []);

  
  const hasRole = useCallback((role) => {
    if (!user?.roles) return false;
    return checkRole(user.roles, role);
  }, [user?.roles]);

  
  const hasPermission = useCallback((permission) => {
    if (!user?.permissions) return false;
    const userPermissions = Array.isArray(user.permissions) 
      ? user.permissions 
      : [];
    return userPermissions.includes(permission);
  }, [user?.permissions]);

  
  const userIsSuperAdmin = useCallback(() => {
    return user?.roles ? isSuperAdmin(user.roles) : false;
  }, [user?.roles]);

  const userIsAdmin = useCallback(() => {
    return user?.roles ? isAdmin(user.roles) : false;
  }, [user?.roles]);

  // Memoize the context value to prevent infinite re-renders
  // Use user?.id as a stable reference instead of the entire user object
  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    hasPermission,
    isSuperAdmin: userIsSuperAdmin,
    isAdmin: userIsAdmin,
  }), [user, loading, isAuthenticated, login, register, logout, refreshUser, hasRole, hasPermission, userIsSuperAdmin, userIsAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

