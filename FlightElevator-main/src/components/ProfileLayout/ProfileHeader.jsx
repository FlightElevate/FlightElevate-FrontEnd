import React from 'react';

/**
 * Reusable Profile Header Component
 * @param {object} user - User data object
 * @param {string} profileImage - Profile image URL
 * @param {string} badgeText - Badge text (e.g., "Student Pilot")
 * @param {string} buttonText - Action button text
 * @param {function} onButtonClick - Action button click handler
 * @param {string} buttonColor - Button color classes
 * @param {React.Component} buttonIcon - Button icon component
 */
const ProfileHeader = ({
  user,
  profileImage,
  badgeText = 'Student Pilot',
  buttonText = 'Request Session',
  onButtonClick,
  buttonColor = 'bg-blue-600 text-white hover:bg-blue-700',
  buttonIcon,
}) => {
  return (
    <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200">
      <div className="flex items-center gap-4">
        <img
          src={profileImage}
          alt="User Avatar"
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.name || 'User Name'}
          </h1>
          <p className="text-gray-600 text-sm">
            {user?.email || 'user@example.com'}
          </p>
          <div className="mt-2 flex gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {badgeText}
            </span>
            <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
              Documents
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onButtonClick}
        className={`mt-4 sm:mt-0 px-5 py-2.5 flex items-center gap-2 rounded-lg transition ${buttonColor}`}
      >
        {buttonIcon && <img src={buttonIcon} alt="Icon" className="w-4 h-4" />}
        <span className="text-sm font-medium">{buttonText}</span>
      </button>
    </div>
  );
};

export default ProfileHeader;

