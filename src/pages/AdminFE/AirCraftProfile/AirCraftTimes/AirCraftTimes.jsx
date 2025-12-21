import React, { useState, useRef, useEffect } from "react";
import Maintenance from "./Maintenance";
import Squawks from "./Squawks";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";

const AirCraftTimes = ({ aircraftId }) => {
  const [activeTab, setActiveTab] = useState("maintenance");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");

  const sortRef = useRef(null);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm relative">
      {/* Tabs */}
      <div className="flex items-center justify-start gap-2 border-b border-[#F3F4F6]">
        {["maintenance", "squawks"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center justify-center text-sm font-medium px-3 py-3 gap-2 border-b transition-all ${
              activeTab === tab
                ? "text-[#1376CD] border-[#1376CD]"
                : "text-[#8A8A8A] border-transparent"
            }`}
          >
            {tab === "maintenance" ? "Maintenance Schedule" : "Squawks"}
          </button>
        ))}
      </div>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 relative">
        <h2 className="text-lg font-semibold text-gray-800">
          {activeTab === "maintenance" ? "Maintenance Schedule" : "Squawks"}
        </h2>

        <div className="flex items-center gap-3 w-full sm:w-auto relative">
          {/* Search bar */}
          <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-[250px]">
            <FiSearch className="text-gray-400 mr-2" size={16} />
            <input
              type="text"
              placeholder="Search"
              className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
              ⌘
            </span>
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700"
            >
              <MdFilterList className="w-5 h-5" />
              <span className="whitespace-nowrap">Sort by</span>
            </button>

            {sortOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                {["Newest", "Oldest"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setSortOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      sortBy === option
                        ? "text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeTab === "maintenance" ? (
          <Maintenance aircraftId={aircraftId} searchTerm={searchTerm} sortBy={sortBy} />
        ) : (
          <Squawks aircraftId={aircraftId} searchTerm={searchTerm} sortBy={sortBy} />
        )}
      </div>
    </div>
  );
};

export default AirCraftTimes;
