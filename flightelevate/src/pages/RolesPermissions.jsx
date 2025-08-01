import React, { useState } from "react";
import { HiDotsVertical } from "react-icons/hi"; 
import { Link } from "react-router-dom";

const RolesPermissions = () => {
  const rolePermissions = [
    { role: "Administrator", permissions: ["All Access"] },
    {
      role: "Instructor",
      permissions: ["Aircraft", "Request", "Lessons", "Calendar"],
    },
    { role: "Student", permissions: ["Read Only"] },
  ];

  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-lg rounded-xl">
   
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 p-4">
          <h2 className="text-xl font-semibold text-gray-800">Roles</h2>
          <Link to="/roles-permissions/create" className="mt-2 sm:mt-0 px-4 py-2 bg-[#1376CD] text-white rounded-lg hover:bg-blue-700 transition">
            Add New Role
          </Link>
        </div>

        <div className="overflow-x-auto border-t border-gray-200">
          <table className="table-auto w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-1/4 px-4 py-3 text-sm sm:text-base">Role</th>
                <th className="w-3/4 px-4 py-3 text-sm sm:text-base">
                  Permissions 
                </th>
                <th className="w-10 text-right px-4 py-2"></th>
              </tr>
            </thead>

            <tbody>
              {rolePermissions.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50 relative"
                >
                
                  <td className="p-4 text-sm sm:text-base">
                    {item.role}
                  </td>

                 
                  <td className="px-4 py-3 space-x-2">
                    {item.permissions.map((perm, pIndex) => (
                      <span
                        key={pIndex}
                        className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm ${
                          perm === "All Access"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {perm}
                      </span>
                    ))}
                  </td>

              
                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() => toggleMenu(index)}
                      className="p-2 rounded-full hover:bg-gray-200"
                    >
                      <HiDotsVertical className="w-5 h-5 text-gray-500" />
                    </button>


                    {openMenu === index && (
                      <div className="absolute right-4 mt-1 mr-4 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => alert(`Edit ${item.role}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full text-left px-4 py-1 text-sm text-red-600 hover:bg-gray-100"
                          onClick={() => alert(`Delete ${item.role}`)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              <tr>
                <td colSpan="3" className="h-15"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;
