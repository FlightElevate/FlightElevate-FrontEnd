import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNavigationItemsByRole } from "../config/navigation";
import { settingsService } from "../api/services/settingsService";
import { getImageUrl } from "../utils/imageUtils";
import logo from "../assets/SVG/logo.svg";


const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [organizationName, setOrganizationName] = useState(null);
  const [organizationLogo, setOrganizationLogo] = useState(null);
  const [logoError, setLogoError] = useState(false);

  
  const navLinks = useMemo(() => {
    if (!user?.roles) return [];
    const items = getNavigationItemsByRole(user.roles);
    
    const seen = new Set();
    return items.filter(item => {
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
            setOrganizationName(response.data.organization.name || '');
            setOrganizationLogo(response.data.organization.logo || null);
            setLogoError(false); // Reset error when new logo is set
          } else if (user?.organization) {
            // Fallback to user.organization if settings doesn't have it
            setOrganizationName(user.organization.name || '');
            setOrganizationLogo(user.organization.logo || null);
            setLogoError(false); // Reset error when new logo is set
          } else {
            setOrganizationName(null);
            setOrganizationLogo(null);
            setLogoError(false);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch organization from settings:', err);
        // Fallback to user.organization
        if (user?.organization) {
          setOrganizationName(user.organization.name || '');
          setOrganizationLogo(user.organization.logo || null);
        } else {
          setOrganizationName(null);
          setOrganizationLogo(null);
        }
      }
    };

    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  
  const displayName = organizationName || "FlightElevate";

  return (
    <>
      {}
      <div
        className={`fixed inset-0 bg-opacity-90 z-30 transition-opacity md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {}
      <aside
        className={`fixed top-0 left-0 z-40 bg-blue-700 text-white shadow-md
          h-screen transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:h-auto md:w-3/14`}
      >
        {}
        <div className="ps-5 p-4 border-b border-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              {/* Default logo - always present, shown when no org logo */}
              <img 
                src={logo} 
                alt="Logo" 
                className={`w-full h-full object-cover p-1.5 sm:p-2 default-logo absolute inset-0 ${getImageUrl(organizationLogo) ? 'hidden' : 'block'}`}
              />
              {/* Organization logo - shown if available */}
              {getImageUrl(organizationLogo) && (
                <img 
                  src={getImageUrl(organizationLogo)} 
                  alt={displayName} 
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    // Hide organization image on error and show default logo
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent) {
                      const defaultLogo = parent.querySelector('.default-logo');
                      if (defaultLogo) {
                        defaultLogo.classList.remove('hidden');
                        defaultLogo.classList.add('block');
                      }
                    }
                  }}
                  onLoad={(e) => {
                    // Hide default logo when organization logo loads successfully
                    const parent = e.target.parentElement;
                    if (parent) {
                      const defaultLogo = parent.querySelector('.default-logo');
                      if (defaultLogo) {
                        defaultLogo.classList.add('hidden');
                        defaultLogo.classList.remove('block');
                      }
                    }
                  }}
                />
              )}
            </div>
            <div className="text-white">
              <div className="text-lg font-bold">{displayName}</div>
              <div className="text-sm text-blue-200">FlightElevate</div>
            </div>
          </div>
        </div>

        {}
        <div className="p-5">
          <nav className="flex flex-col gap-2">
            {navLinks.length > 0 ? (
              navLinks.map(({ icon: Icon, label, link, badge, badgeColor }, index) => {
                const active =
                  location.pathname === link ||
                  location.pathname.startsWith(link + "/");
                const isDisabled = badge === "Coming Soon";
                
                const uniqueKey = `${link}-${index}`;
                
                
                if (isDisabled) {
                  return (
                    <div
                      key={uniqueKey}
                      className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        opacity-75 cursor-not-allowed
                        transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={18} />
                        {label}
                      </div>
                      {badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${badgeColor || 'bg-blue-500'}`}>
                          {badge}
                        </span>
                      )}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={uniqueKey}
                    to={link}
                    className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      ${active ? "bg-white text-blue-700" : "hover:bg-blue-600"}
                      transition-colors`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} />
                      {label}
                    </div>
                    {badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${badgeColor || 'bg-blue-500'}`}>
                        {badge}
                      </span>
                    )}
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
