import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiPlus, FiX, FiEdit2, FiTrash2, FiGrid, FiList } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { userService } from "../../api/services/userService";
import { showSuccessToast, showErrorToast, showDeleteConfirm } from "../../utils/notifications";
import { useAuth } from "../../context/AuthContext";
import { useRole } from "../../hooks/useRole";
import photo from "../../assets/img/photo.jpg";

const Instructors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [listMenuOpenId, setListMenuOpenId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    status: 'active',
  });
  const sortRef = useRef(null);
  const menuRefs = useRef({});
  const listMenuRefs = useRef({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStudent } = useRole();

  // Calculate years of experience from created_at date
  const getYearsOfExperience = (createdAt) => {
    if (!createdAt) return "N/A";
    const createdDate = new Date(createdAt);
    const now = new Date();
    const years = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24 * 365));
    return `${years} Years`;
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenId !== null && menuRefs.current[menuOpenId] && !menuRefs.current[menuOpenId].contains(event.target)) {
        setMenuOpenId(null);
      }
      if (listMenuOpenId !== null && listMenuRefs.current[listMenuOpenId] && !listMenuRefs.current[listMenuOpenId].contains(event.target)) {
        setListMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId, listMenuOpenId]);

  // Generate dummy profile picture URL based on instructor ID
  const getInstructorImage = (instructor) => {
    if (instructor.avatar || instructor.image || instructor.profile_image) {
      return instructor.avatar || instructor.image || instructor.profile_image;
    }
    // Generate consistent dummy image based on instructor ID
    const imageIds = [1, 5, 8, 12, 15, 20, 25, 33, 47, 51, 68, 70];
    const imageId = imageIds[instructor.id % imageIds.length] || 1;
    return `https://i.pravatar.cc/300?img=${imageId}`;
  };

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers({
        role: 'Instructor',
        per_page: 100,
      });
      if (response.success) {
        const instructorsList = Array.isArray(response.data) ? response.data : [];
        setInstructors(instructorsList);
      }
    } catch (err) {
      console.error('Error fetching instructors:', err);
      showErrorToast('Failed to load instructors');
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search
  const filteredInstructors = instructors.filter((instructor) =>
    instructor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInstructorClick = (id) => {
    navigate(`/instructors/instructorprofile/${id}`);
  };

  const handleAdd = () => {
    setEditingInstructor(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      phone: '',
      password: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEdit = (instructor, e) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingInstructor(instructor);
    setFormData({
      name: instructor.name || '',
      email: instructor.email || '',
      username: instructor.username || '',
      phone: instructor.phone || '',
      password: '', // Don't pre-fill password
      status: instructor.status || 'active',
    });
    setMenuOpenId(null);
    setShowModal(true);
  };

  const handleDelete = async (instructor, e) => {
    if (e) {
      e.stopPropagation();
    }
    setMenuOpenId(null);
    
    const confirmed = await showDeleteConfirm(instructor.name || 'this instructor');
    if (!confirmed) return;

    try {
      const response = await userService.deleteUser(instructor.id);
      if (response.success) {
        showSuccessToast('Instructor deleted successfully');
        fetchInstructors();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete instructor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...formData,
        role: 'Instructor',
      };
      
      // Remove password if editing and password is empty
      if (editingInstructor && !data.password) {
        delete data.password;
      }

      if (editingInstructor) {
        const response = await userService.updateUser(editingInstructor.id, data);
        if (response.success) {
          showSuccessToast('Instructor updated successfully');
          setShowModal(false);
          setEditingInstructor(null);
          fetchInstructors();
        }
      } else {
        const response = await userService.createUser(data);
        if (response.success) {
          showSuccessToast('Instructor created successfully');
          setShowModal(false);
          fetchInstructors();
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || `Failed to ${editingInstructor ? 'update' : 'create'} instructor`);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="flex flex-col gap-5">
      <div className="border border-[#F3F4F6] bg-white">
        <div className="flex justify-between gap-3 py-5 px-4 border-b border-[#F3F4F6] flex-wrap">
          <h2 className="text-xl font-semibold">Instructors</h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View Toggle Buttons */}
            <div className="flex items-center border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 transition ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Grid View"
              >
                <FiGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 transition border-l border-gray-200 ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="List View"
              >
                <FiList size={18} />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm grow sm:grow-0 w-full">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
            </div>

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700"
              >
                <MdFilterList className="w-5 h-5" />
                <span className="whitespace-nowrap">Sort by</span>
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {["Newest", "Oldest"].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setSortOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === option ? "text-blue-600 font-medium" : "text-gray-700"
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
      </div>


      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === "grid" ? (
        // Grid View (Current View)
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-6 bg-[#FFFFFF]">
          {filteredInstructors.length > 0 ? (
            filteredInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="group relative cursor-pointer border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all"
              >
                <div onClick={() => handleInstructorClick(instructor.id)}>
                  <img
                    src={getInstructorImage(instructor)}
                    alt={instructor.name}
                    className="w-full h-[250px] object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-[250px] bg-blue-500 flex items-center justify-center text-white text-4xl font-bold';
                      fallback.textContent = instructor.name ? instructor.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'IN';
                      parent.insertBefore(fallback, e.target);
                    }}
                  />
                  <div className="px-3 py-2">
                    <p className="text-base fw5 leading-6 tracking-[0%] text-[#3D3D3D]">{instructor.name}</p>
                  </div>
                </div>
                
                {/* Action Menu - Only show for non-students */}
                {!isStudent && (
                  <div 
                    className="action-menu-container absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative" ref={(el) => (menuRefs.current[instructor.id] = el)}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === instructor.id ? null : instructor.id);
                        }}
                        className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    
                    {menuOpenId === instructor.id && (
                      <div 
                        className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleEdit(instructor, e)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDelete(instructor, e)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm col-span-full py-10 text-center">
              No instructors found.
            </p>
          )}
        </div>
      ) : (
        // List View (Table View)
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Instructor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Certificates held
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.length > 0 ? (
                  filteredInstructors.map((instructor) => (
                    <tr
                      key={instructor.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => handleInstructorClick(instructor.id)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                            <img
                              src={getInstructorImage(instructor)}
                              alt={instructor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                const fallback = document.createElement('div');
                                fallback.className = 'w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold';
                                fallback.textContent = instructor.name ? instructor.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'IN';
                                parent.appendChild(fallback);
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {instructor.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {getYearsOfExperience(instructor.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        {isStudent ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstructorClick(instructor.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </button>
                        ) : (
                          <div 
                            className="relative" 
                            ref={(el) => (listMenuRefs.current[instructor.id] = el)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setListMenuOpenId(listMenuOpenId === instructor.id ? null : instructor.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition"
                            >
                              <HiDotsVertical className="text-gray-600" size={18} />
                            </button>
                          {listMenuOpenId === instructor.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInstructorClick(instructor.id);
                                  setListMenuOpenId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                View Details
                              </button>
                              {!isStudent && (
                                <>
                                  <button
                                    onClick={(e) => handleEdit(instructor, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <FiEdit2 size={14} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(instructor, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <FiTrash2 size={14} />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-10 text-gray-500 text-sm">
                      No instructors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Instructor Modal - Only for non-students */}
      {showModal && !isStudent && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInstructor(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter instructor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {!editingInstructor && '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingInstructor}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={editingInstructor ? "Leave blank to keep current password" : "Enter password (min 6 characters)"}
                    minLength={editingInstructor ? 0 : 6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingInstructor(null);
                  }}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting 
                    ? (editingInstructor ? 'Updating...' : 'Creating...') 
                    : (editingInstructor ? 'Update Instructor' : 'Create Instructor')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instructors;
