import React, { useState } from 'react';
import { Menu, Bell, Search, ChevronDown } from 'lucide-react';
import profile from "../assets/SVG/img.svg";

const Header = ({ toggleSidebar }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  return (
    <header className="bg-white shadow-sm p-4 flex items-center justify-between w-full z-10 relative">

     
      <button className="md:hidden text-gray-700" onClick={toggleSidebar}>
        <Menu size={24} />
      </button>

    
      <div className="flex items-center gap-4 ml-auto">
        
        <button className="text-gray-600 hover:text-gray-800">
          <Search size={20} />
        </button>


        <button className="text-gray-600 hover:text-gray-800 relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>


        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 focus:outline-none"
          >
            <img
              src={profile}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-700 hidden md:inline">Profile</span>
            <ChevronDown className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Settings
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
