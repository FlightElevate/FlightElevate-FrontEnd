


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
      status: user.status, 
    },
  ];
};


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


export const getOrganizationTitle = (user) => {
  return user?.organization?.name || 'Organization Details';
};

