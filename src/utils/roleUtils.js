


export const normalizeRoleName = (role) => {
  if (!role) return '';
  const roleName = typeof role === 'string' ? role : role?.name || '';
  return roleName.toLowerCase().trim();
};


export const hasRole = (userRoles = [], requiredRole) => {
  if (!userRoles || userRoles.length === 0) return false;
  if (!requiredRole) return false;

  const normalizedUserRoles = userRoles.map(normalizeRoleName);
  const requiredRoles = Array.isArray(requiredRole) 
    ? requiredRole.map(r => normalizeRoleName(r))
    : [normalizeRoleName(requiredRole)];

  return requiredRoles.some(role => normalizedUserRoles.includes(role));
};


export const isSuperAdmin = (userRoles = []) => {
  return hasRole(userRoles, ['super admin', 'super-admin', 'superadmin']);
};


export const isAdmin = (userRoles = []) => {
  return hasRole(userRoles, 'admin') && !isSuperAdmin(userRoles);
};


export const isInstructor = (userRoles = []) => {
  return hasRole(userRoles, 'instructor');
};


export const isStudent = (userRoles = []) => {
  return hasRole(userRoles, 'student');
};


export const getPrimaryRole = (userRoles = []) => {
  if (!userRoles || userRoles.length === 0) return null;
  
  
  const priority = ['super admin', 'super-admin', 'superadmin', 'admin', 'instructor', 'student'];
  
  const normalizedRoles = userRoles.map(normalizeRoleName);
  
  for (const role of priority) {
    if (normalizedRoles.includes(role)) {
      return userRoles.find(r => normalizeRoleName(r) === role) || role;
    }
  }
  
  
  return userRoles[0];
};

