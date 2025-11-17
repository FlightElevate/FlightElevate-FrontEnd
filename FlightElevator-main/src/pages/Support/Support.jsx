import React, { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";
import SupportDetail from "../../data/SupportDetail";
import Pagination from "../../components/Pagination";
import { useNavigate } from "react-router-dom";

const Support = () => {
  const [selected, setSelected] = useState("All");
  const [sortOption, setSortOption] = useState("Newest");
  const [menuOpen, setMenuOpen] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const sortMenuRef = useRef(null); 
  const navigate = useNavigate();
  const allTickets = SupportDetail[0]?.data || [];
  const buttons = ["All", "Open", "Resolved"];

  const filteredTickets =
    selected === "All"
      ? allTickets
      : selected === "Open"
      ? allTickets.filter((t) => t.status === "Open")
      : allTickets.filter((t) => t.status === "Ongoing");

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortOption === "Newest") return b.id.localeCompare(a.id);
    if (sortOption === "Oldest") return a.id.localeCompare(b.id);
    return 0;
  });

  const totalItems = sortedTickets.length;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedTickets = sortedTickets.slice(startIdx, endIdx);

  const getStatusClass = (status) => {
    switch (status) {
      case "Open":
        return "bg-[#E1FAEA] text-[#016626]";
      case "Closed":
        return "bg-[#FFE3E3] text-[#961616]";
      case "Ongoing":
        return "bg-[#EBF0FB] text-[#113B98]";
      default:
        return "bg-[#E1FDFD] text-[#3E77B0]";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        if (menuOpen === "sort") setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-xl rounded-lg px-4 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-inter font-semibold text-[#101828]">
            Support
          </h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
            </div>

            <div className="relative" ref={sortMenuRef}>
              <button
                className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700"
                onClick={() => setMenuOpen(menuOpen === "sort" ? null : "sort")}
              >
                <MdFilterList className="w-[20px] h-[20px]" />
                <span>Sort by: {sortOption}</span>
              </button>

              {menuOpen === "sort" && (
                <div className="absolute right-0 mt-2 bg-white shadow-lg border border-gray-200 rounded-md w-32 z-10">
                  {["Newest", "Oldest"].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortOption(option);
                        setMenuOpen(null);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm ${
                        sortOption === option
                          ? "bg-gray-100 text-[#2563eb]"
                          : "hover:bg-gray-50 text-gray-700"
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

        <div className="px-4 py-3 border-b border-[#F3F4F6] flex gap-[16px] text-sm">
          {buttons.map((label) => (
            <button
              key={label}
              onClick={() => setSelected(label)}
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

        <div className="overflow-x-auto shadow-lg rounded-xl mt-5">
          <table className="w-full text-sm text-left border-b border-gray-200">
            <thead className="bg-[#F9FAFB] text-[#475467] font-inter font-medium">
              <tr className="h-[44px]">
                <th className="pl-4">Ticket ID</th>
                <th className="pl-3">Title</th>
                <th className="pl-3">Username</th>
                <th className="pl-4">Email</th>
                <th className="pl-4">Status</th>
                <th className="pl-8 text-right pr-8">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length > 0 ? (
                paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-[#EAECF0] hover:bg-gray-50 transition-colors h-[72px]"
                  >
                    <td className="p-4">{ticket.id}</td>
                    <td className="p-3">{ticket.title}</td>
                    <td className="p-3">{ticket.username}</td>
                    <td className="p-4">{ticket.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-md ${getStatusClass(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td className="px-9 text-right relative">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === ticket.id ? null : ticket.id)
                        }
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <HiOutlineDotsVertical size={18} />
                      </button>

                      {menuOpen === ticket.id && (
                        <div
                          className="absolute w-[140px] bg-white rounded-md z-10 top-full right-4"
                          style={{ boxShadow: "0px 0px 3px 0px #00000033" }}
                        >
                          <button className="px-4 py-2 hover:bg-[#3a64e2] hover:text-white w-full text-left text-sm">
                            View Detail
                          </button>
                          <button
                            className="px-4 py-2 hover:bg-[#3a64e2] hover:text-white w-full text-left text-sm"
                            onClick={() => {
                              setMenuOpen(null);
                              navigate("/support/chatsupport");
                            }}
                          >
                            Chat Support
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="h-[72px]">
                  <td colSpan="8" className="text-center text-gray-500 py-6">
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="py-2.5 gap-3 flex justify-center">
          <Pagination
            page={currentPage}
            setPage={setCurrentPage}
            perPage={itemsPerPage}
            setPerPage={setItemsPerPage}
            totalItems={totalItems}
          />
        </div>
      </div>
    </div>
  );
};

export default Support;
