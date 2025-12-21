import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNavigationItemsByRole } from "../config/navigation";
import logo from "../assets/SVG/logo.svg";

/**
 * Sidebar Component with Role-Based Navigation
 * Displays navigation items based on user's role
 */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Get navigation items filtered by user role
  const navLinks = useMemo(() => {
    if (!user?.roles) return [];
    return getNavigationItemsByRole(user.roles);
  }, [user?.roles]);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-opacity-90 z-30 transition-opacity md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 bg-blue-700 text-white shadow-md
          h-screen transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:h-auto md:w-3/14`}
      >
        {/* Logo */}
        <div className="ps-5 p-4">
          <img src={logo} alt="Logo" />
        </div>

        {/* Navigation */}
        <div className="p-5">
          <nav className="flex flex-col gap-2">
            {navLinks.length > 0 ? (
              navLinks.map(({ icon: Icon, label, link }) => {
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
              })
            ) : (
              <div className="px-4 py-2 text-sm text-gray-300">
                No navigation items available
              </div>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
