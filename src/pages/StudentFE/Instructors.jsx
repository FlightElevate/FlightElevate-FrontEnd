import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiPlus, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { userService } from "../../api/services/userService";
import { showSuccessToast, showErrorToast, showDeleteConfirm } from "../../utils/notifications";
import photo from "../../assets/img/photo.jpg";

const Instructors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstructors();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenId !== null && menuRefs.current[menuOpenId] && !menuRefs.current[menuOpenId].contains(event.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId]);

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
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <FiPlus size={18} />
              Add Instructor
            </button>
            
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
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">⌘</span>
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-6 bg-[#FFFFFF]">
          {filteredInstructors.length > 0 ? (
            filteredInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="group relative cursor-pointer border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all"
              >
                <div onClick={() => handleInstructorClick(instructor.id)}>
                  <img
                    src={instructor.image || photo}
                    alt={instructor.name}
                    className="w-full h-[250px] object-cover"
                  />
                  <div className="px-3 py-2">
                    <p className="text-base fw5 leading-6 tracking-[0%] text-[#3D3D3D]">{instructor.name}</p>
                  </div>
                </div>
                
                {/* Action Menu */}
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
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm col-span-full py-10 text-center">
              No instructors found.
            </p>
          )}
        </div>
      )}

      {/* Add Instructor Modal */}
      {showModal && (
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
