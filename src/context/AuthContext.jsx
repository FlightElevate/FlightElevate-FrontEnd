import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services/authService';
import { hasRole as checkRole, isSuperAdmin, isAdmin } from '../utils/roleUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();
    
    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
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
  };

  // Register function
  const register = async (userData) => {
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
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Check if user has specific role (handles both string and object formats)
  const hasRole = (role) => {
    if (!user?.roles) return false;
    return checkRole(user.roles, role);
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    const userPermissions = Array.isArray(user.permissions) 
      ? user.permissions 
      : [];
    return userPermissions.includes(permission);
  };

  // Helper functions for common role checks
  const userIsSuperAdmin = () => {
    return user?.roles ? isSuperAdmin(user.roles) : false;
  };

  const userIsAdmin = () => {
    return user?.roles ? isAdmin(user.roles) : false;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
    isSuperAdmin: userIsSuperAdmin,
    isAdmin: userIsAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

