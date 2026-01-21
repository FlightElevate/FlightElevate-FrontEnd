import React from 'react';
import { FiUsers, FiBookOpen, FiUser } from 'react-icons/fi';


export const OrganizationTabs = ({ activeTab, onTabChange, tabCounts = {} }) => {
  const tabs = [
    { id: 'admins', label: 'Admins', icon: FiUsers, count: tabCounts.admins || 0 },
    { id: 'instructors', label: 'Instructors', icon: FiBookOpen, count: tabCounts.instructors || 0 },
    { id: 'students', label: 'Students', icon: FiUser, count: tabCounts.students || 0 },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
              aria-selected={isActive}
              role="tab"
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

