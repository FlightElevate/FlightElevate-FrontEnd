import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/SVG/logo.svg";
import { FiGrid, FiUsers, FiCalendar, FiInbox } from "react-icons/fi";
import {
  MdSecurity,
  MdCampaign,
  MdSubscriptions,
  MdSupportAgent,
} from "react-icons/md";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user is Super Admin
  const isSuperAdmin = user?.roles?.some(role => {
    // Handle both string and object roles (Spatie returns objects with 'name' property)
    const roleName = typeof role === 'string' ? role : role?.name || '';
    const lowerRole = roleName.toLowerCase();
    return lowerRole === 'super admin' || 
           lowerRole === 'super-admin' ||
           lowerRole === 'admin' ||
           lowerRole === 'administrator';
  }) || false;

  const navLinks = [
    { icon: FiGrid, label: "Dashboard", link: "/" },
    { icon: FiUsers, label: "User Management", link: "/user-management" },
    { icon: FiUsers, label: "Users", link: "/users" },
    { icon: FiUsers, label: "My Lessons", link: "/my-lessons" },
    { icon: FiUsers, label: "Instructors", link: "/instructors" },
    { icon: FiUsers, label: "User Logs", link: "/user-logs" },
    { icon: FiCalendar, label: "Calendar", link: "/calendar" },
    { icon: FiInbox, label: "Inbox", link: "/inbox" },
    // Only show Roles & Permissions for Super Admin
    ...(isSuperAdmin ? [{
      icon: MdSecurity,
      label: "Roles & Permissions",
      link: "/roles-permissions",
    }] : []),
    { icon: MdCampaign, label: "Announcements", link: "/announcements" },
    { icon: MdSubscriptions, label: "Subscriptions", link: "/subscriptions" },
    { icon: MdSupportAgent, label: "Support", link: "/support" },
    {
      icon: MdSupportAgent,
      label: "Air Craft Profile",
      link: "/air-craft-profile",
    },
    { icon: MdSupportAgent, label: "Setting", link: "/setting" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-opacity-90 z-30 transition-opacity md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 z-40 bg-blue-700 text-white shadow-md
          h-screen transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:h-auto md:w-3/14`}
      >
        <div className="ps-5 p-4">
          <img src={logo} alt="Logo" />
        </div>

        <div className="p-5">
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ icon: Icon, label, link }) => {
              const active =
                location.pathname === link ||
                location.pathname.startsWith(link + "/");
              return (
                <Link
                  key={link}
                  to={link}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              ${active ? "bg-white text-blue-700" : "hover:bg-blue-600"}
              transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
