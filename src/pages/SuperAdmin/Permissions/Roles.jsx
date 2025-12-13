import React, { useState } from "react";
import { Link } from "react-router-dom";

const Roles = () => {
  const initialRoles = [
    {
      role: "Administrator",
      permissions: [
        "All Access",
        "Lessons",
        "Payments",
        "User Profiles",
        "Requests",
        "Reservations",
      ],
    },
    {
      role: "Instructor",
      permissions: ["Lessons", "User Profiles", "Requests"],
    },
    {
      role: "Student",
      permissions: ["Lessons", "Requests", "Reservations"],
    },
  ];

  const allPermissions = [
    "All Access",
    "Lessons",
    "Payments",
    "User Profiles",
    "Requests",
    "Reservations",
  ];

  const [roles, setRoles] = useState(initialRoles);
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggle = (roleName, permission) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.role === roleName) {
          const hasPerm = r.permissions.includes(permission);
          return {
            ...r,
            permissions: hasPerm
              ? r.permissions.filter((p) => p !== permission)
              : [...r.permissions, permission],
          };
        }
        return r;
      })
    );
  };

  const filteredPermissions = allPermissions.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white inset-shadow-sm shadow rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[#EAECF0]">
          <h2 className="text-xl font-semibold text-gray-800">Roles</h2>
          <Link className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Add New Role
          </Link>
        </div>
      <div className="mx-4">
          <table className="w-full border-collapse">
          <thead className=" border-b border-[#EAECF0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium">
                Permissions
              </th>
              {roles.map((role) => (
                <th
                  key={role.role}
                  className="px-4 py-3 text-xs font-medium text-center"
                >
                  {role.role}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="border-b border-[#EAECF0]">
              <td className="px-4 py-5">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Permission"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-none outline-none text-sm w-full"
                  />
                </div>
              </td>
              {roles.map((role) => (
                <td
                  key={role.role}
                  className="text-center px-4 py-3 text-gray-400"
                ></td>
              ))}
            </tr>

            <tr className="bg-[#F2F1FF]">
              <td className=""></td>
              {roles.map((role) => (
                <td key={role.role} className="text-center px-4 py-4">
                  <span className="text-gray-400">–</span>
                </td>
              ))}
            </tr>

            {filteredPermissions.map((permission) => (
              <tr
                key={permission}
                className="border-b border-[#EAECF0] hover:bg-gray-50 transition"
              >
                <td className="px-4 py-5 text-sm text-[#475467]">
                  {permission}
                </td>

                {roles.map((role) => (
                  <td key={role.role} className="text-center px-4 py-3">
                    <input
                      type="checkbox"
                      checked={role.permissions.includes(permission)}
                      onChange={() => handleToggle(role.role, permission)}
                      className="
                        w-5 h-5 
                        appearance-none 
                        border border-[#1376CD] 
                        rounded-[6px] 
                        bg-white
                        checked:bg-[#F5F5FF] 
                        checked:border-[#1376CD]
                        checked:after:content-['✔'] 
                        checked:after:text-[#1376CD] 
                        checked:after:text-[12px] 
                        checked:after:flex 
                        checked:after:items-center 
                        checked:after:justify-center"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default Roles;
