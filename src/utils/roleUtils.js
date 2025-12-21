/**
 * Role utility functions for checking user roles and permissions
 * Handles different role formats (string, object with name property)
 */

/**
 * Normalizes role name from different formats
 * @param {string|Object} role - Role as string or object with name property
 * @returns {string} - Normalized role name in lowercase
 */
export const normalizeRoleName = (role) => {
  if (!role) return '';
  const roleName = typeof role === 'string' ? role : role?.name || '';
  return roleName.toLowerCase().trim();
};

/**
 * Checks if user has a specific role
 * @param {Array} userRoles - User's roles array
 * @param {string|Array} requiredRole - Role(s) to check for
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (userRoles = [], requiredRole) => {
  if (!userRoles || userRoles.length === 0) return false;
  if (!requiredRole) return false;

  const normalizedUserRoles = userRoles.map(normalizeRoleName);
  const requiredRoles = Array.isArray(requiredRole) 
    ? requiredRole.map(r => normalizeRoleName(r))
    : [normalizeRoleName(requiredRole)];

  return requiredRoles.some(role => normalizedUserRoles.includes(role));
};

/**
 * Checks if user is Super Admin
 * @param {Array} userRoles - User's roles array
 * @returns {boolean} - True if user is Super Admin
 */
export const isSuperAdmin = (userRoles = []) => {
  return hasRole(userRoles, ['super admin', 'super-admin', 'superadmin']);
};

/**
 * Checks if user is Admin (but not Super Admin)
 * @param {Array} userRoles - User's roles array
 * @returns {boolean} - True if user is Admin
 */
export const isAdmin = (userRoles = []) => {
  return hasRole(userRoles, 'admin') && !isSuperAdmin(userRoles);
};

/**
 * Checks if user is Instructor
 * @param {Array} userRoles - User's roles array
 * @returns {boolean} - True if user is Instructor
 */
export const isInstructor = (userRoles = []) => {
  return hasRole(userRoles, 'instructor');
};

/**
 * Checks if user is Student
 * @param {Array} userRoles - User's roles array
 * @returns {boolean} - True if user is Student
 */
export const isStudent = (userRoles = []) => {
  return hasRole(userRoles, 'student');
};

/**
 * Gets the primary role of the user (first role or most important)
 * @param {Array} userRoles - User's roles array
 * @returns {string|null} - Primary role name or null
 */
export const getPrimaryRole = (userRoles = []) => {
  if (!userRoles || userRoles.length === 0) return null;
  
  // Priority order: Super Admin > Admin > Instructor > Student
  const priority = ['super admin', 'super-admin', 'superadmin', 'admin', 'instructor', 'student'];
  
  const normalizedRoles = userRoles.map(normalizeRoleName);
  
  for (const role of priority) {
    if (normalizedRoles.includes(role)) {
      return userRoles.find(r => normalizeRoleName(r) === role) || role;
    }
  }
  
  // Return first role if no priority match
  return userRoles[0];
};

