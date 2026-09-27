import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pin, PinOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getNavigationItemsByRole } from "../config/navigation";
import { settingsService } from "../api/services/settingsService";
import { getImageUrl } from "../utils/imageUtils";
import logo from "../assets/SVG/logo.svg";

const PIN_STORAGE_KEY = "sidebar_pinned";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [organizationName, setOrganizationName] = useState(null);
  const [organizationLogo, setOrganizationLogo] = useState(null);
  const [logoError, setLogoError] = useState(false);

  // Hover-to-expand + pin state (desktop only; mobile keeps the existing overlay drawer)
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const hoverTimeoutRef = useRef(null);

  const expanded = isPinned || isHovered;

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PIN_STORAGE_KEY, String(next));
      } catch {
        // ignore storage failures (private browsing, etc.)
      }
      return next;
    });
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // small delay avoids flicker when the cursor clips the edge
    hoverTimeoutRef.current = setTimeout(() => setIsHovered(false), 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const navLinks = useMemo(() => {
    if (!user?.roles) return [];
    const items = getNavigationItemsByRole(user.roles);

    const seen = new Set();
    return items.filter((item) => {
      if (seen.has(item.link)) {
        return false;
      }
      seen.add(item.link);
      return true;
    });
  }, [user?.roles]);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      // Use settings API to get organization data (same as settings page)
      try {
        const response = await settingsService.getSettings();
        if (response.success && response.data) {
          // Get organization from settings (same source as settings page)
          if (response.data.organization) {
            setOrganizationName(response.data.organization.name || "");
            setOrganizationLogo(response.data.organization.logo || null);
            setLogoError(false); // Reset error when new logo is set
          } else if (user?.organization) {
            // Fallback to user.organization if settings doesn't have it
            setOrganizationName(user.organization.name || "");
            setOrganizationLogo(user.organization.logo || null);
            setLogoError(false); // Reset error when new logo is set
          } else {
            setOrganizationName(null);
            setOrganizationLogo(null);
            setLogoError(false);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch organization from settings:", err);
        // Fallback to user.organization
        if (user?.organization) {
          setOrganizationName(user.organization.name || "");
          setOrganizationLogo(user.organization.logo || null);
        } else {
          setOrganizationName(null);
          setOrganizationLogo(null);
        }
      }
    };

    if (user?.id) {
      fetchOrganizationData();
    }
  }, [user?.id]); // Use user?.id instead of user object to prevent infinite loops

  const displayName = organizationName || "FlightElevate";

  return (
    <>
      {/* Mobile overlay — unchanged behavior, sidebar is full drawer on mobile */}
      <div
        className={`fixed inset-0 bg-opacity-90 z-30 transition-opacity md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 z-40 bg-blue-700 text-white shadow-md
          h-screen flex flex-col
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          w-4/5 sm:w-3/5
          md:static
          ${expanded ? "md:w-64" : "md:w-[68px]"}
          overflow-hidden`}
      >
        {/* Pin toggle — desktop only, fades in on hover/expand */}
        <button
          type="button"
          onClick={togglePin}
          title={isPinned ? "Unpin sidebar" : "Keep sidebar expanded"}
          className={`hidden md:flex absolute top-4 right-2.5 w-6 h-6 rounded-md
            items-center justify-center transition-opacity duration-150
            ${isPinned ? "bg-white text-blue-700" : "bg-white/15 text-white hover:bg-white/25"}
            ${expanded ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
        </button>

        {/* Header / org branding */}
        <div className="ps-5 p-4 border-b border-blue-600 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              {/* Default logo - always present, shown when no org logo */}
              <img
                src={logo}
                alt="Logo"
                className={`w-full h-full object-cover p-1.5 sm:p-2 default-logo absolute inset-0 ${
                  getImageUrl(organizationLogo) ? "hidden" : "block"
                }`}
              />
              {/* Organization logo - shown if available */}
              {getImageUrl(organizationLogo) && (
                <img
                  src={getImageUrl(organizationLogo)}
                  alt={displayName}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    e.target.style.display = "none";
                    const parent = e.target.parentElement;
                    if (parent) {
                      const defaultLogo = parent.querySelector(".default-logo");
                      if (defaultLogo) {
                        defaultLogo.classList.remove("hidden");
                        defaultLogo.classList.add("block");
                      }
                    }
                  }}
                  onLoad={(e) => {
                    const parent = e.target.parentElement;
                    if (parent) {
                      const defaultLogo = parent.querySelector(".default-logo");
                      if (defaultLogo) {
                        defaultLogo.classList.add("hidden");
                        defaultLogo.classList.remove("block");
                      }
                    }
                  }}
                />
              )}
            </div>
            <div
              className={`text-white whitespace-nowrap overflow-hidden transition-opacity duration-150
                ${expanded ? "opacity-100 delay-75" : "md:opacity-0 md:w-0"}`}
            >
              <div className="text-lg font-bold">{displayName}</div>
              <div className="text-sm text-blue-200">FlightElevate</div>
            </div>
          </div>
        </div>

        {/* Nav — scrolls independently so short/folded viewports still see every item */}
        <div className="p-3 md:px-2.5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:bg-white/25
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-track]:bg-transparent">
          <nav className="flex flex-col gap-1">
            {navLinks.length > 0 ? (
              navLinks.map(({ icon: Icon, label, link, badge, badgeColor }, index) => {
                const active =
                  location.pathname === link ||
                  location.pathname.startsWith(link + "/");
                const isDisabled = badge === "Coming Soon";
                const uniqueKey = `${link}-${index}`;

                const iconEl = <Icon size={18} className="flex-shrink-0" />;
                const labelEl = (
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-opacity duration-150
                      ${expanded ? "opacity-100 delay-75" : "md:opacity-0 md:w-0"}`}
                  >
                    {label}
                  </span>
                );
                const badgeEl = badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full text-white flex-shrink-0 ${
                      badgeColor || "bg-blue-500"
                    } ${expanded ? "" : "md:hidden"}`}
                  >
                    {badge}
                  </span>
                );

                if (isDisabled) {
                  return (
                    <div
                      key={uniqueKey}
                      title={!expanded ? label : undefined}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                        opacity-75 cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {iconEl}
                        {labelEl}
                      </div>
                      {badgeEl}
                    </div>
                  );
                }

                return (
                  <Link
                    key={uniqueKey}
                    to={link}
                    title={!expanded ? label : undefined}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                      ${active ? "bg-white text-blue-700" : "hover:bg-blue-600"}
                      transition-colors`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      {iconEl}
                      {labelEl}
                    </div>
                    {badgeEl}
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

