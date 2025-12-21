import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";
import Pagination from "../../components/Pagination";
import { useNavigate } from "react-router-dom";
import { supportService } from "../../api/services/supportService";
import { toast } from "react-toastify";

const Support = () => {
  const [selected, setSelected] = useState("All");
  const [sortOption, setSortOption] = useState("Newest");
  const [menuOpen, setMenuOpen] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
  });
  const [formErrors, setFormErrors] = useState({});
  const sortMenuRef = useRef(null);
  const navigate = useNavigate();
  const buttons = ["All", "Open", "Resolved"];

  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
          sort: 'created_at',
          order: sortOption === "Newest" ? "desc" : "asc",
        };

        // Add status filter
        if (selected === "Open") {
          params.status = "open";
        } else if (selected === "Resolved") {
          params.status = "closed";
        }

        // Add search
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const response = await supportService.getTickets(params);

        if (response.success) {
          setTickets(response.data || []);
          setTotalItems(response.meta?.total || 0);
        } else {
          toast.error("Failed to load tickets");
          setTickets([]);
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentPage, itemsPerPage, selected, sortOption, searchTerm]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page on search
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "open":
        return "bg-[#E1FAEA] text-[#016626]";
      case "closed":
        return "bg-[#FFE3E3] text-[#961616]";
      case "ongoing":
        return "bg-[#EBF0FB] text-[#113B98]";
      default:
        return "bg-[#E1FDFD] text-[#3E77B0]";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (status) => {
    setSelected(status);
    setCurrentPage(1); // Reset to first page when changing status
  };

  const handleSortChange = (sort) => {
    setSortOption(sort);
    setMenuOpen(null);
    setCurrentPage(1); // Reset to first page when changing sort
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setCreating(true);
    try {
      const response = await supportService.createTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
      });

      if (response.success) {
        toast.success("Support ticket created successfully");
        setShowCreateModal(false);
        setFormData({
          title: "",
          description: "",
          priority: "normal",
        });
        setFormErrors({});
        // Refresh tickets list
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
          sort: 'created_at',
          order: sortOption === "Newest" ? "desc" : "asc",
        };

        if (selected === "Open") {
          params.status = "open";
        } else if (selected === "Resolved") {
          params.status = "closed";
        }

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const refreshResponse = await supportService.getTickets(params);
        if (refreshResponse.success) {
          setTickets(refreshResponse.data || []);
          setTotalItems(refreshResponse.meta?.total || 0);
        }
      } else {
        toast.error(response.message || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      const errorMessage = error.response?.data?.message || "Failed to create ticket";
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({
      title: "",
      description: "",
      priority: "normal",
    });
    setFormErrors({});
  };

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-xl rounded-lg px-4 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-inter font-semibold text-[#101828]">
            Support
          </h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <FiPlus size={18} />
              Create Ticket
            </button>
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
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
                      onClick={() => handleSortChange(option)}
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
              onClick={() => handleStatusChange(label)}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
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
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-[#EAECF0] hover:bg-gray-50 transition-colors h-[72px]"
                    >
                      <td className="p-4">
                        {ticket.ticket_number || `#${ticket.id}`}
                      </td>
                      <td className="p-3">{ticket.title || "No title"}</td>
                      <td className="p-3">
                        {ticket.user?.name || "Unknown"}
                      </td>
                      <td className="p-4">{ticket.user?.email || "N/A"}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-md ${getStatusClass(
                            ticket.status
                          )}`}
                        >
                          {formatStatus(ticket.status)}
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
                            <button
                              className="px-4 py-2 hover:bg-[#3a64e2] hover:text-white w-full text-left text-sm"
                              onClick={() => {
                                setMenuOpen(null);
                                navigate(`/support/chatsupport/${ticket.id}`);
                              }}
                            >
                              View Detail
                            </button>
                            <button
                              className="px-4 py-2 hover:bg-[#3a64e2] hover:text-white w-full text-left text-sm"
                              onClick={() => {
                                setMenuOpen(null);
                                navigate(`/support/chatsupport/${ticket.id}`);
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
                    <td colSpan="6" className="text-center text-gray-500 py-6">
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-800">Create Support Ticket</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="p-6">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter ticket title"
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.title ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your issue in detail"
                    rows={6}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      formErrors.description ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
