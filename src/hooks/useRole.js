import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  hasRole as checkRole,
  isSuperAdmin,
  isAdmin,
  isInstructor,
  isStudent,
  getPrimaryRole,
} from '../utils/roleUtils';


export const useRole = () => {
  const { user } = useAuth();

  const userRoles = useMemo(() => {
    return user?.roles || [];
  }, [user?.roles]);

  const roleChecks = useMemo(() => {
    return {
      hasRole: (role) => checkRole(userRoles, role),
      isSuperAdmin: () => isSuperAdmin(userRoles),
      isAdmin: () => isAdmin(userRoles),
      isInstructor: () => isInstructor(userRoles),
      isStudent: () => isStudent(userRoles),
      getPrimaryRole: () => getPrimaryRole(userRoles),
      userRoles,
    };
  }, [userRoles]);

  return roleChecks;
};

