/**
 * Organization Helper Utilities
 * Utility functions for organization-related operations
 */

/**
 * Gets status badge configuration
 * @param {string} status - User status
 * @returns {Object} - Status config with className and text
 */
export const getStatusConfig = (status) => {
  const statusMap = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
    blocked: {
      bg: 'bg-red-100',
      text: 'text-red-600',
    },
    inactive: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
    },
  };

  return statusMap[status] || statusMap.active;
};

/**
 * Formats user information for display in info cards
 * @param {Object} user - User object
 * @returns {Array} - Array of { label, value, bold, status } objects
 */
export const formatUserInfo = (user) => {
  if (!user) return [];

  return [
    { label: 'Name', value: user.name, bold: true },
    { label: 'Email', value: user.email },
    { label: 'Username', value: user.username || 'N/A' },
    { label: 'Phone', value: user.phone || 'N/A' },
    {
      label: 'Status',
      value: user.status || 'Active',
      status: user.status, // Pass status for component to render badge
    },
  ];
};

/**
 * Formats organization information for display in info cards
 * @param {Object} organization - Organization object
 * @param {Object} user - User object (for dates)
 * @returns {Array} - Array of { label, value, bold } objects
 */
export const formatOrganizationInfo = (organization, user) => {
  const items = [];

  if (organization) {
    items.push(
      { label: 'Organization Name', value: organization.name, bold: true },
      { label: 'Organization ID', value: organization.id?.toString() || 'N/A' }
    );
  }

  if (user) {
    items.push(
      {
        label: 'Joined Date',
        value: user.created_at
          ? new Date(user.created_at).toLocaleDateString()
          : 'N/A',
      },
      {
        label: 'Last Login',
        value: user.last_login_at
          ? new Date(user.last_login_at).toLocaleDateString()
          : 'Never',
      }
    );
  }

  return items;
};

/**
 * Gets the display title for organization detail page
 * @param {Object} user - User object with organization
 * @returns {string} - Display title
 */
export const getOrganizationTitle = (user) => {
  return user?.organization?.name || 'Organization Details';
};

