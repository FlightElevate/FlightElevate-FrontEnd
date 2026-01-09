import { FiGrid, FiUsers, FiCalendar, FiInbox, FiFileText, FiSettings, FiBookOpen, FiDollarSign, FiBook } from "react-icons/fi";
import {
  MdSecurity,
  MdCampaign,
  MdSupportAgent,
  MdEventNote,
  MdBook,
} from "react-icons/md";
import { normalizeRoleName } from "../utils/roleUtils";

/**
 * Navigation configuration with role-based access control
 * Each menu item can specify which roles can access it
 */

export const navigationItems = [
  {
    icon: FiGrid,
    label: "Dashboard",
    link: "/",
    roles: ["super admin", "admin", "instructor", "student"], // All roles
  },
  {
    icon: FiUsers,
    label: "User Management",
    link: "/user-management",
    roles: ["super admin"], // Super Admin only
  },
  {
    icon: FiUsers,
    label: "Users",
    link: "/users",
    roles: ["admin"], // Admin only
  },
  {
    icon: FiFileText,
    label: "User Logs",
    link: "/user-logs",
    roles: ["super admin"], // Super Admin only
  },
  
  {
    icon: FiUsers,
    label: "Instructors",
    link: "/instructors",
    roles: ["student"], // Student only
  },
  
  {
    icon: FiCalendar,
    label: "Calendar",
    link: "/calendar",
    roles: ["super admin", "admin", "instructor", "student"], // All roles
  },
  {
    icon: FiInbox,
    label: "Inbox",
    link: "/inbox",
    roles: ["super admin", "admin", "instructor", "student"], // All roles
  },
  {
    icon: MdSecurity,
    label: "Roles & Permissions",
    link: "/roles-permissions",
    roles: ["super admin", "admin"], // Super Admin and Admin
  },
  {
    icon: MdCampaign,
    label: "Announcements",
    link: "/announcements",
    roles: ["super admin"], // Super Admin only
  },
  {
    icon: FiBook,
    label: "Lessons",
    link: "/lessons",
    roles: ["instructor"], // Instructor only
  },
  {
    icon: MdBook,
    label: "Logbook",
    link: "/logbook",
    roles: ["instructor"], // Instructor only
  },
  {
    icon: FiDollarSign,
    label: "Billing",
    link: "/billing",
    roles: ["student"], // Student only
    badge: "Coming Soon",
    badgeColor: "bg-orange-500",
  },
  {
    icon: FiUsers,
    label: "User Management",
    link: "/user-management",
    roles: ["super admin"], // Super Admin only
  },
  {
    icon: FiUsers,
    label: "Users",
    link: "/users",
    roles: ["admin"], // Admin only
  },
  {
    icon: FiBookOpen,
    label: "My Lesson (Preview)",
    link: "/my-lessons",
    roles: ["student"], // Student only
  },
  {
    icon: FiUsers,
    label: "Instructors",
    link: "/instructors",
    roles: ["student"], // Student only
  },
  
  {
    icon: FiUsers,
    label: "Aircraft Profile",
    link: "/air-craft-profile",
    roles: ["admin", "instructor"], // Admin and Instructor only
  },
  {
    icon: MdSupportAgent,
    label: "Support",
    link: "/support",
    roles: ["super admin", "admin", "instructor", "student"], // All roles (second last)
  },
  {
    icon: FiSettings,
    label: "Settings",
    link: "/setting",
    roles: ["super admin", "admin", "instructor", "student"], // All roles (last)
  },
];

/**
 * Gets navigation items filtered by user role
 * @param {Array} userRoles - User's roles array
 * @returns {Array} - Filtered navigation items
 */
export const getNavigationItemsByRole = (userRoles = []) => {
  if (!userRoles || userRoles.length === 0) return [];

  // Normalize user roles once for efficiency
  const normalizedUserRoles = userRoles.map(role => normalizeRoleName(role));

  return navigationItems.filter(item => {
    // Show item if no role restriction
    if (!item.roles || item.roles.length === 0) return true;
    
    // Check if user has any of the required roles
    return item.roles.some(requiredRole => {
      const normalizedRequiredRole = normalizeRoleName(requiredRole);
      // Check if any normalized user role matches the normalized required role
      return normalizedUserRoles.includes(normalizedRequiredRole);
    });
  });
};

