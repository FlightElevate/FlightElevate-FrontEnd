import React from 'react';

/**
 * Reusable Profile Tabs Component
 * @param {string} activeTab - Currently active tab
 * @param {function} setActiveTab - Function to change active tab
 * @param {array} tabs - Array of tab objects [{id, label}]
 */
const ProfileTabs = ({ activeTab, setActiveTab, tabs = [] }) => {
  const defaultTabs = [
    { id: 'profile', label: 'Profile Details' },
    { id: 'documents', label: 'Documents' },
  ];

  const tabsToRender = tabs.length > 0 ? tabs : defaultTabs;

  return (
    <div className="border-b border-gray-200">
      <div className="px-6 flex gap-2">
        {tabsToRender.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTabs;

