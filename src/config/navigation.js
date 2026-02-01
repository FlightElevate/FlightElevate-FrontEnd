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
    roles: ["super admin", "admin", "instructor", "student"], 
  },
  {
    icon: FiUsers,
    label: "User Management",
    link: "/user-management",
    roles: ["super admin"], 
  },
  {
    icon: FiUsers,
    label: "Users",
    link: "/users",
    roles: ["admin"], 
  },
  {
    icon: FiFileText,
    label: "User Logs",
    link: "/user-logs",
    roles: ["super admin"], 
  },
  
  {
    icon: FiUsers,
    label: "Instructors",
    link: "/instructors",
    roles: ["student"], 
  },
  
  {
    icon: FiCalendar,
    label: "Calendar",
    link: "/calendar",
    roles: ["super admin", "admin", "instructor", "student"], 
  },
  {
    icon: FiInbox,
    label: "Inbox",
    link: "/inbox",
    roles: ["super admin", "admin", "instructor", "student"], 
  },
  {
    icon: MdSecurity,
    label: "Roles & Permissions",
    link: "/roles-permissions",
    roles: ["super admin", "admin"], 
  },
  {
    icon: MdCampaign,
    label: "Announcements",
    link: "/announcements",
    roles: ["super admin", "admin"], 
  },
  {
    icon: FiBook,
    label: "Lessons & Reservations",
    link: "/lessons",
    roles: ["instructor", "admin"], 
  },
  {
    icon: MdBook,
    label: "Logbook",
    link: "/logbook",
    roles: ["admin", "instructor", "student"],
  },
  {
    icon: FiDollarSign,
    label: "Billing",
    link: "/billing",
    roles: ["student"], 
    badge: "Coming Soon",
    badgeColor: "bg-orange-500",
  },
  {
    icon: FiBookOpen,
    label: "My Lesson (Preview)",
    link: "/my-lessons",
    roles: ["student"], 
  },
  
  {
    icon: FiUsers,
    label: "Aircraft Profile",
    link: "/air-craft-profile",
    roles: ["admin", "instructor"], 
  },
  {
    icon: MdSupportAgent,
    label: "Support",
    link: "/support",
    roles: ["super admin", "admin", "instructor", "student"], 
  },
  {
    icon: FiSettings,
    label: "Settings",
    link: "/setting",
    roles: ["super admin", "admin", "instructor", "student"], 
  },
];


export const getNavigationItemsByRole = (userRoles = []) => {
  if (!userRoles || userRoles.length === 0) return [];

  
  const normalizedUserRoles = userRoles.map(role => normalizeRoleName(role));
  
  // Check if user is ONLY a student (no other roles)
  const isOnlyStudent = normalizedUserRoles.length === 1 && normalizedUserRoles.includes('student');

  return navigationItems.filter(item => {
    
    if (!item.roles || item.roles.length === 0) return true;
    
    // If user is ONLY a student, only show items that explicitly include "student" role
    if (isOnlyStudent) {
      return item.roles.some(requiredRole => {
        const normalizedRequiredRole = normalizeRoleName(requiredRole);
        return normalizedRequiredRole === 'student';
      });
    }
    
    // For users with multiple roles or non-student roles, use normal filtering
    return item.roles.some(requiredRole => {
      const normalizedRequiredRole = normalizeRoleName(requiredRole);
      
      return normalizedUserRoles.includes(normalizedRequiredRole);
    });
  });
};

