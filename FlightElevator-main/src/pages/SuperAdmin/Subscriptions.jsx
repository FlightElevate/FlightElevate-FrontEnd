import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import userID from "../../data/userID";
import { Link } from "react-router-dom";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { CgAdd } from "react-icons/cg";
import Pagination from "../../components/Pagination";

const Subscription = () => {
  const [selected, setSelected] = useState("Subscribers");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const currentGroup = userID.find(
    (group) => group.role.toLowerCase() === selected.toLowerCase()
  );
  const currentUsers = currentGroup?.data || [];
  const [expandedPlans, setExpandedPlans] = useState(
    currentUsers.map((_, idx) => idx)
  );

  const togglePlan = (index) => {
    setExpandedPlans((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const buttons = ["Subscribers", "Subscription Plans"];
  const isAllSelected = selectedIds.length === currentUsers.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentUsers.map((user) => user.id).filter(Boolean));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const totalItems = currentUsers.length;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedUsers = currentUsers.slice(startIdx, endIdx);

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-inter font-semibold text-gray-800">
            Subscription management
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
                setCurrentPage(1);
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

        {selected === "Subscribers" && (
          <>
            <div className="overflow-x-auto shadow-lg rounded-xl mt-5">
              <table className="w-full text-sm text-left border-b border-gray-200">
                <thead className="bg-[#F9FAFB] text-[#475467] font-inter font-medium">
                  <tr>
                    <th className="pl-5 py-3">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded-md"
                      />
                    </th>
                    <th className="pl-5 py-3">User ID</th>
                    <th className="pl-5 py-3">Name</th>
                    <th className="pl-5 py-3">Organization</th>
                    <th className="pl-5 py-3">Plan Type</th>
                    <th className="pl-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#EAECF0] hover:bg-gray-50 transition-colors h-[72px]"
                      >
                        <td className="p-6">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={() => handleSelectOne(user.id)}
                            className="w-4 h-4 rounded-md"
                          />
                        </td>
                        <td className="p-6">{user.id}</td>
                        <td className="p-6">{user.name}</td>
                        <td className="p-6">{user.organization}</td>
                        <td className="p-6">{user.plan}</td>
                        <td className="p-6">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              user.status === "Active"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="h-[72px]">
                      <td colSpan="8" className="text-center text-gray-500 py-6">
                        No subscribers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > itemsPerPage && (
              <div className="py-2.5 gap-3 flex justify-center">
                <Pagination
                  page={currentPage}
                  setPage={setCurrentPage}
                  perPage={itemsPerPage}
                  setPerPage={setItemsPerPage}
                  totalItems={totalItems}
                  fullWidth={true}
                />
              </div>
            )}
          </>
        )}

        {selected === "Subscription Plans" && (
          <div className="py-5 text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
              {currentUsers.map((plan, index) => (
                <div
                  key={plan.id || `plan-${index}`}
                  className="border border-gray-200 rounded-lg shadow-sm flex flex-col justify-between"
                >
                  <div className="p-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {plan.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.description}
                    </p>
                    <p className="text-sm font-medium text-[#0A090B] mt-4">
                      {plan.aircraft}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-lg font-semibold text-[#4F4D55]">
                        {plan.price}
                      </span>
                      <button
                        onClick={() => togglePlan(index)}
                        className="ml-auto flex items-center gap-1 text-sm text-blue-600 font-medium"
                      >
                        {expandedPlans.includes(index) ? (
                          <>
                            Details <FiChevronUp />
                          </>
                        ) : (
                          <>
                            Details <FiChevronDown />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedPlans.includes(index) && (
                    <div className="border-t border-[#E6E6E6] p-4 animate-fadeIn">
                      <div className="flex items-center gap-2 pb-4 text-sm text-gray-600">
                        <span className="text-lg">
                          <CgAdd className="inline-block text-[#000000]" />
                          <span className="text-sm font-inter text-[#0A090B] pl-1">
                            One-time Setup Fee <br />
                            <span className="text-xs font-inter text-gray-500  pl-6">
                              {plan.para}
                              <span className="font-semibold font-inter text-[#000000]">
                                {plan.setupFee}
                              </span>
                            </span>
                          </span>
                        </span>
                      </div>
                      <div className="flex gap-3 px-4">
                        <Link
                          to={`/subscriptions/plans/${plan.id}`}
                          state={{ plan }}
                          className="px-5 py-2 bg-[#F6F6F6] rounded-lg text-sm text-[#505050] font-medium"
                        >
                          Edit Plan
                        </Link>
                        <button className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                          Delete Plan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
