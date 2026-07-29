import { FiGrid, FiUsers, FiCalendar, FiInbox, FiFileText, FiSettings, FiBookOpen, FiDollarSign, FiBook } from "react-icons/fi";
import {
  MdSecurity,
  MdCampaign,
  MdSupportAgent,
  MdEventNote,
  MdBook,
} from "react-icons/md";
import { normalizeRoleName } from "../utils/roleUtils";



export const navigationItems = [
  {
    icon: FiGrid,
    label: "Dashboard",
    link: "/dashboard",
    permission: "menu.dashboard",
    roles: ["super admin", "admin", "instructor", "student"], 
  },
  {
    icon: FiUsers,
    label: "User Management",
    link: "/user-management",
    permission: "menu.user_management",
    roles: ["super admin"], 
  },
  {
    icon: FiUsers,
    label: "Users",
    link: "/users",
    permission: "menu.users",
    roles: ["admin"], 
  },
  {
    icon: FiFileText,
    label: "User Logs",
    link: "/user-logs",
    permission: "menu.user_logs",
    roles: ["super admin"], 
  },
  {
    icon: FiUsers,
    label: "Instructors",
    link: "/instructors",
    permission: "menu.instructors",
    roles: ["student"], 
  },
  {
    icon: FiCalendar,
    label: "Calendar",
    link: "/calendar",
    permission: "menu.calendar",
    roles: ["super admin", "admin", "instructor", "student"], 
  },
  {
    icon: FiInbox,
    label: "Inbox",
    link: "/inbox",
    permission: "menu.inbox",
    roles: ["super admin", "admin", "instructor", "student"], 
  },
  {
    icon: MdSecurity,
    label: "Roles & Permissions",
    link: "/roles-permissions",
    permission: "menu.roles_permissions",
    roles: ["super admin", "admin"], 
  },
  {
    icon: MdCampaign,
    label: "Announcements",
    link: "/announcements",
    permission: "menu.announcements",
    roles: ["super admin", "admin"], 
  },
  {
    icon: FiBook,
    label: "Lessons & Reservations",
    link: "/lessons",
    permission: "menu.lessons",
    roles: ["instructor", "admin"], 
  },
  {
    icon: MdBook,
    label: "Logbook",
    link: "/logbook",
    permission: "menu.logbook",
    roles: ["admin", "instructor", "student"],
  },
  {
    icon: FiDollarSign,
    label: "Billing",
    link: "/billing",
    permission: "menu.billing",
    roles: ["student"], 
    badge: "Coming Soon",
    badgeColor: "bg-orange-500",
  },
  {
    icon: FiBookOpen,
    label: "My Lesson (Preview)",
    link: "/my-lessons",
    permission: "menu.my_lessons",
    roles: ["student"], 
  },
  {
    icon: FiUsers,
    label: "Aircraft Profile",
    link: "/air-craft-profile",
    permission: "menu.aircraft_profile",
    roles: ["admin", "instructor"], 
  },
  {
    icon: MdSupportAgent,
    label: "Support",
    link: "/support",
    permission: "menu.support",
    roles: ["super admin", "admin"], 
  },
  {
    icon: FiDollarSign,
    label: "Subscription Plans",
    link: "/subscription-plans",
    permission: "menu.subscription_plans",
    roles: ["super admin"],
  },
  {
    icon: FiDollarSign,
    label: "Subscription",
    link: "/subscription",
    permission: "menu.subscription",
    roles: ["admin"],
  },
  {
    icon: FiSettings,
    label: "Settings",
    link: "/setting",
    permission: "menu.settings",
    roles: ["super admin", "admin", "instructor", "student"],
  },
];


/**
 * Filter navigation items by user permissions (preferred — supports custom roles).
 * Falls back to role-based filtering if no menu.* permissions are present.
 */
export const getNavigationItemsByPermissions = (userPermissions = [], userRoles = []) => {
  const menuPerms = (userPermissions || []).filter(p => p.startsWith('menu.'));

  // If user has menu.* permissions, use them (this supports custom roles)
  if (menuPerms.length > 0) {
    return navigationItems.filter(item =>
      item.permission && menuPerms.includes(item.permission)
    );
  }

  // Fallback: use role-based filtering (for users whose permissions haven't been seeded yet)
  return getNavigationItemsByRole(userRoles);
};


export const getNavigationItemsByRole = (userRoles = []) => {
  if (!userRoles || userRoles.length === 0) return [];

  const normalizedUserRoles = userRoles.map(role => normalizeRoleName(role));
  
  // Check if user is ONLY a student (no other roles)
  const isOnlyStudent = normalizedUserRoles.length === 1 && normalizedUserRoles.includes('student');

  return navigationItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    
    if (isOnlyStudent) {
      return item.roles.some(requiredRole => {
        const normalizedRequiredRole = normalizeRoleName(requiredRole);
        return normalizedRequiredRole === 'student';
      });
    }
    
    return item.roles.some(requiredRole => {
      const normalizedRequiredRole = normalizeRoleName(requiredRole);
      return normalizedUserRoles.includes(normalizedRequiredRole);
    });
  });
};
