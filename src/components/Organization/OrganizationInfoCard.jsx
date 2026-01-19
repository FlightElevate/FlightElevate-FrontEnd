import React from 'react';
import { getStatusConfig } from '../../utils/organizationHelpers';


export const OrganizationInfoCard = ({ title, items = [], className = '' }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const renderValue = (item) => {
    
    if (item.status !== undefined) {
      const statusConfig = getStatusConfig(item.status);
      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
        >
          {item.value || 'Active'}
        </span>
      );
    }

    
    return (
      <p className={`text-gray-800 font-medium`}>
        {item.value || 'N/A'}
      </p>
    );
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-6 border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">
              {item.label}:
            </span>
            {renderValue(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

