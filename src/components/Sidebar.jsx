import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNavigationItemsByRole } from "../config/navigation";
import { settingsService } from "../api/services/settingsService";
import { authService } from "../api/services/authService";
import { subscriptionPlanService } from "../api/services/subscriptionPlanService";
import { getImageUrl } from "../utils/imageUtils";
import { HiChevronDown } from "react-icons/hi";
import { FiDollarSign } from "react-icons/fi";
import logo from "../assets/SVG/logo.svg";
import { getTrialRemainingDays } from "../utils/organizationHelpers";


const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [organizationName, setOrganizationName] = useState(null);
  const [organizationLogo, setOrganizationLogo] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  
  // Memoize navigation items to prevent recalculation on every render
  const navLinks = useMemo(() => {
    if (!user?.roles) return [];
    
    // Check if subscription/trial has expired
    const hasActiveSub = !!user.has_active_subscription;
    const backendTrialActive = !!user.is_trial_active;
    const safeDateStr = user.trial_ends_at ? (user.trial_ends_at.includes('T') ? user.trial_ends_at : user.trial_ends_at.replace(' ', 'T') + 'Z') : null;
    const clientTrialActive = safeDateStr ? new Date(safeDateStr) > new Date() : false;
    const isTrialActive = backendTrialActive || clientTrialActive;
    const isExpired = !hasActiveSub && !isTrialActive;

    const isSuperAdmin = user.roles.some(r => {
      const roleName = (typeof r === 'string' ? r : r?.name || '').toLowerCase();
      return roleName === 'super admin' || roleName === 'super-admin';
    });

    if (isExpired && !isSuperAdmin) {
      // Keep only Subscription for expired accounts
      return [
        {
          icon: FiDollarSign,
          label: "Subscription",
          link: "/subscription",
        }
      ];
    }

    let items = getNavigationItemsByRole(user.roles);
    
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.link)) {
        return false;
      }
      seen.add(item.link);
      return true;
    });
  }, [user?.roles, user?.has_active_subscription, user?.is_trial_active, user?.trial_ends_at]);

  
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

    const checkSubscriptionStatus = async () => {
      if (user?.roles?.some(role => ['admin'].includes(role.toLowerCase()))) {
        try {
          const response = await subscriptionPlanService.getCurrentSubscription();
          if (response && response.success && response.data) {
            setHasActiveSubscription(true);
          } else {
            setHasActiveSubscription(false);
          }
        } catch (err) {
          console.error('Error fetching subscription in sidebar:', err);
          setHasActiveSubscription(false);
        }
      }
    };

    if (user?.id) {
      fetchOrganizationData();
      checkSubscriptionStatus();
    }
  }, [user?.id, user?.organization_id, user?.roles]); // Refresh when user's active org changes

  const handleOrgSwitch = async (orgId) => {
    if (orgId === user.organization_id) {
      setShowOrgSwitcher(false);
      return;
    }
    
    setSwitchingOrg(orgId);
    try {
      const response = await authService.switchOrganization(orgId);
      if (response.success) {
        // Full page reload to reset all states and context for the new organization
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch organization:', err);
    } finally {
      setSwitchingOrg(null);
      setShowOrgSwitcher(false);
    }
  };

  const activeMemberships = useMemo(() => {
    return user?.organization_memberships || [];
  }, [user?.organization_memberships]);

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
        <div className="border-b border-blue-600 relative">
          <button 
            onClick={() => activeMemberships.length > 1 && setShowOrgSwitcher(!showOrgSwitcher)}
            className={`w-full ps-5 p-4 text-left transition-colors ${activeMemberships.length > 1 ? 'hover:bg-blue-600 cursor-pointer' : 'cursor-default'}`}
          >
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
              <div className="text-white flex-1 min-w-0">
                <div className="text-lg font-bold truncate flex items-center gap-2">
                  {displayName}
                  {activeMemberships.length > 1 && (
                    <HiChevronDown size={16} className={`transition-transform flex-shrink-0 ${showOrgSwitcher ? 'rotate-180' : ''}`} />
                  )}
                </div>
                <div className="text-sm text-blue-200">FlightElevate</div>
              </div>
            </div>
          </button>

          {/* Org Switcher Dropdown */}
          {showOrgSwitcher && activeMemberships.length > 1 && (
            <div className="absolute top-full left-0 right-0 bg-blue-800 border-b border-blue-700 shadow-xl z-50">
              <div className="py-1">
                {activeMemberships.map((membership) => (
                  <button
                    key={membership.org_id}
                    onClick={() => handleOrgSwitch(membership.org_id)}
                    disabled={switchingOrg === membership.org_id}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors flex items-center justify-between hover:bg-blue-700 ${
                      user.organization_id === membership.org_id ? 'bg-blue-600 font-bold' : ''
                    }`}
                  >
                    <span className="truncate">{membership.org_name}</span>
                    {switchingOrg === membership.org_id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {user.organization_id === membership.org_id && !switchingOrg && (
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
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

          {/* Trial Status Badge */}
          {!hasActiveSubscription && !user?.roles?.some(role => ['super admin', 'student', 'instructor'].includes(role.toLowerCase())) && user?.organization_id && (
            <div className="mt-8 px-4">
              <div className="bg-blue-800 bg-opacity-50 rounded-lg p-3 border border-blue-500">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Trial Status</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-medium">
                    {user.is_trial_active ? 'Active' : 'Expired'}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold leading-none">
                      {user.trial_ends_at ? getTrialRemainingDays(user.trial_ends_at) : 0}
                    </p>
                    <p className="text-[10px] text-blue-300">Days Remaining</p>
                  </div>
                  <Link 
                    to="/subscription" 
                    className="text-[10px] bg-white text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-50 transition-colors"
                  >
                    Upgrade
                  </Link>
                </div>
                {user.trial_ends_at && (
                  <div className="w-full bg-blue-900 rounded-full h-1 mt-2">
                    <div 
                      className={`h-1 rounded-full ${getTrialRemainingDays(user.trial_ends_at) > 5 ? 'bg-blue-400' : 'bg-red-400'}`} 
                      style={{ width: `${Math.min(100, (getTrialRemainingDays(user.trial_ends_at) / 30) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
