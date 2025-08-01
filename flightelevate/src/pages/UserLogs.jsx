import React, { useState, useRef, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";
import { Link } from "react-router-dom";
import usersData from "../data/user";

const UserLogs = () => {
  const [selected, setSelected] = useState(usersData[0]?.role || "Instructor");
  const [selectedIds, setSelectedIds] = useState([]);

  const buttons = usersData.map((roleGroup) => roleGroup.role);

  const currentGroup = usersData.find((group) => group.role === selected);
  const currentUsers = currentGroup?.data || [];
  
  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-inter font-semibold text-gray-800">
            Activity Logs
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
                ⌘
              </span>
            </div>
            <button className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700">
              <MdFilterList className="w-[20px] h-[20px]" />
              <span className="whitespace-nowrap">Sort by</span>
            </button>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-[#F3F4F6] flex gap-[16px] text-sm">
          {buttons.map((label) => (
            <button
              key={label}
              onClick={() => {
                setSelected(label);
                setSelectedIds([]);
              }}
              className={`px-3 py-1 rounded ${
                selected === label
                  ? "bg-[#C6E4FF] text-black"
                  : "bg-white text-gray-700"
              } transition-colors duration-150`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto insect-shadow-sm shadow-lg rounded-xl">
          <table className="w-full text-sm text-left border-b border-gray-200 mt-4">
            <thead className="bg-[#F9FAFB] text-black font-inter font-medium">
              <tr className="h-[44px]">
                <th className="pl-5"> Date</th>
                <th className="pl-5">User</th>
                <th className="pl-5">Email</th>
                <th className="pl-5">Time</th>
                <th className="pl-5">Role</th>
                <th className="pl-5">Role Performed</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#EAECF0] hover:bg-gray-50 transition-colors h-[72px]"
                  >
                    <td className="p-6">{user.date}</td>
                    <td className="p-6">{user.user}</td>
                    <td className="p-6">{user.email}</td>
                    <td className="p-6">{user.time}</td>
                    <td className="p-6">{user.role}</td>
                    <td className="p-6">{user.performed}</td>
                    
                  </tr>
                ))
              ) : (
                <tr className="h-[72px]">
                  <td colSpan="8" className="text-center text-gray-500 py-6">
                    No users found for "{selected}"
                  </td>
                </tr>
              )}
              <tr className="h-[72px]">
                <td colSpan="8" className="h-22"></td>
              </tr>
            </tbody>
          </table>
        </div>
              

      </div>
    </div>
  );
};

export default UserLogs;
