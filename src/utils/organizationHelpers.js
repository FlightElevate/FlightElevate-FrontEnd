


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
      { label: 'Organization ID', value: organization.id?.toString() || 'N/A' },
      { 
        label: 'Verification Status', 
        value: organization.verification_status?.toUpperCase() || 'PENDING',
        status: organization.verification_status === 'verified' ? 'active' : (organization.verification_status === 'rejected' ? 'blocked' : 'inactive')
      },
      { 
        label: 'Trial Ends At', 
        value: organization.trial_ends_at ? new Date(organization.trial_ends_at).toLocaleDateString() : 'No Trial' 
      },
      {
        label: 'Account Status',
        value: organization.status?.toUpperCase() || 'ACTIVE',
        status: organization.status
      }
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


export const getTrialRemainingDays = (trialEndsAt) => {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};


export const getOrganizationTitle = (user) => {
  return user?.organization?.name || 'Organization Details';
};

