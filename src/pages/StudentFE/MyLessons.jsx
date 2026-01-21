import React, { useState, useRef, useEffect } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import Pagination from "../../components/Pagination";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRole } from "../../hooks/useRole";
import { lessonService } from "../../api/services/lessonService";
import { showSuccessToast, showErrorToast, showDeleteConfirm } from "../../utils/notifications";


const getStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-600";
  
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'pending':
      return "bg-[#FFF1DA] text-[#C47E0A]";
    case 'ongoing':
      return "bg-[#EBF0FB] text-[#113B98]";
    case 'completed':
      return "bg-[#E1FAEA] text-[#016626]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};


const formatStatus = (status) => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const MyLessons = ({ showReadyButton = false }) => {
  const { user } = useAuth();
  const { isAdmin: isAdminFn, isSuperAdmin: isSuperAdminFn } = useRole();
  const isAdmin = isAdminFn();
  const isSuperAdmin = isSuperAdminFn();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState("Newest");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lessonTemplateForm, setLessonTemplateForm] = useState({
    lesson_number: '',
    lesson_title: '',
    tasks: [{ title: '', description: '' }],
  });
  const [submitting, setSubmitting] = useState(false);

  const sortRef = useRef(null);

  const handleViewClick = (lessonId) => {
    // Navigate to lesson detail page with source parameter
    navigate(`/my-lessons/${lessonId}?from=lessons`);
  };

  // Handle edit lesson
  const handleEdit = async (lessonId) => {
    setOpenMenuId(null);
    
    // Only Admin and Super Admin can edit lessons
    if (!isAdmin && !isSuperAdmin) {
      showErrorToast('Only Admin and Super Admin can edit lessons');
      return;
    }
    
    try {
      const response = await lessonService.getLesson(lessonId);
      if (response.success) {
        const lesson = response.data;
        setEditingLessonId(lessonId);
        setLessonTemplateForm({
          lesson_number: lesson.lesson_number || '',
          lesson_title: lesson.lesson_title || '',
          tasks: lesson.lesson_content && Array.isArray(lesson.lesson_content) && lesson.lesson_content.length > 0
            ? lesson.lesson_content
            : [{ title: '', description: '' }],
        });
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      showErrorToast('Failed to load lesson details');
    }
  };

  // Handle delete lesson
  const handleDelete = async (lessonId) => {
    setOpenMenuId(null);
    
    // Only Admin and Super Admin can delete lessons
    if (!isAdmin && !isSuperAdmin) {
      showErrorToast('Only Admin and Super Admin can delete lessons');
      return;
    }
    
    const confirmed = await showDeleteConfirm('this lesson');
    if (!confirmed) return;

    try {
      const response = await lessonService.deleteLesson(lessonId);
      if (response.success) {
        showSuccessToast('Lesson deleted successfully');
        // Refresh lessons list
        const refreshResponse = await lessonService.getLessons({
          per_page: itemsPerPage,
          page: currentPage,
        });
        if (refreshResponse.success) {
          const lessonTemplates = (refreshResponse.data || []).filter((lesson) => {
            const hasLessonInfo = lesson.lesson_title || lesson.lesson_number;
            const isNotReservation = !lesson.lesson_date && !lesson.lesson_time && !lesson.date && !lesson.time && !lesson.full_date && !lesson.full_time;
            return hasLessonInfo && isNotReservation;
          });
          
          const transformedLessons = lessonTemplates.map((lesson) => ({
            id: lesson.id,
            lesson_title: lesson.lesson_title || null,
            lesson_number: lesson.lesson_number || null,
            lesson_content: lesson.lesson_content || [],
            tasks_count: lesson.tasks_count || (Array.isArray(lesson.lesson_content) ? lesson.lesson_content.length : 0),
            status: lesson.status || 'Pending',
            created_at: lesson.created_at,
          }));
          
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete lesson');
    }
  };

  // Handle task management
  const handleAddTask = () => {
    setLessonTemplateForm(prev => ({
      ...prev,
      tasks: [...prev.tasks, { title: '', description: '' }]
    }));
  };

  const handleRemoveTask = (index) => {
    setLessonTemplateForm(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const handleTaskChange = (index, field, value) => {
    setLessonTemplateForm(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const handleLessonTemplateFormChange = (e) => {
    const { name, value } = e.target;
    setLessonTemplateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save lesson (create or update)
  const handleSaveLesson = async () => {
    // Only Admin and Super Admin can create/update lessons
    if (!isAdmin && !isSuperAdmin) {
      showErrorToast('Only Admin and Super Admin can create or update lessons');
      return;
    }
    
    if (!lessonTemplateForm.lesson_title) {
      showErrorToast('Please enter lesson title');
      return;
    }

    setSubmitting(true);
    try {
      const validTasks = lessonTemplateForm.tasks.filter(
        task => task.title.trim() !== '' || task.description.trim() !== ''
      );

      const lessonData = {
        lesson_number: lessonTemplateForm.lesson_number || null,
        lesson_title: lessonTemplateForm.lesson_title,
        lesson_content: validTasks.length > 0 ? validTasks : [],
      };

      let response;
      if (editingLessonId) {
        response = await lessonService.updateLesson(editingLessonId, lessonData);
      } else {
        response = await lessonService.createLesson(lessonData);
      }

      if (response.success) {
        showSuccessToast(editingLessonId ? 'Lesson updated successfully' : 'Lesson created successfully');
        setShowEditModal(false);
        setEditingLessonId(null);
        setLessonTemplateForm({
          lesson_number: '',
          lesson_title: '',
          tasks: [{ title: '', description: '' }],
        });
        
        // Refresh lessons list
        const refreshResponse = await lessonService.getLessons({
          per_page: itemsPerPage,
          page: currentPage,
        });
        if (refreshResponse.success) {
          const lessonTemplates = (refreshResponse.data || []).filter((lesson) => {
            const hasLessonInfo = lesson.lesson_title || lesson.lesson_number;
            const isNotReservation = !lesson.lesson_date && !lesson.lesson_time && !lesson.date && !lesson.time && !lesson.full_date && !lesson.full_time;
            return hasLessonInfo && isNotReservation;
          });
          
          const transformedLessons = lessonTemplates.map((lesson) => ({
            id: lesson.id,
            lesson_title: lesson.lesson_title || null,
            lesson_number: lesson.lesson_number || null,
            lesson_content: lesson.lesson_content || [],
            tasks_count: lesson.tasks_count || (Array.isArray(lesson.lesson_content) ? lesson.lesson_content.length : 0),
            status: lesson.status || 'Pending',
            created_at: lesson.created_at,
          }));
          
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setSubmitting(false);
    }
  };

  
  
  
  
  
  

  
  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch lesson templates (not reservations) for students
        const response = await lessonService.getLessons({
          per_page: itemsPerPage,
          page: currentPage,
        });
        
        if (response.success) {
          // The backend getLessons endpoint should already filter for lesson templates only
          // But we add an extra safety filter on frontend to ensure no reservations slip through
          const lessonTemplates = (response.data || []).filter((lesson) => {
            // Must have lesson_title or lesson_number (lesson template identifier)
            const hasLessonInfo = lesson.lesson_title || lesson.lesson_number;
            // Must NOT have lesson_date, lesson_time, date, or time (those are reservations)
            const isNotReservation = !lesson.lesson_date && !lesson.lesson_time && !lesson.date && !lesson.time && !lesson.full_date && !lesson.full_time;
            // Also check that it doesn't have flight_type (which is a reservation field)
            const isTemplate = hasLessonInfo && isNotReservation;
            return isTemplate;
          });
          
          const transformedLessons = lessonTemplates.map((lesson) => ({
            id: lesson.id,
            lesson_title: lesson.lesson_title || null,
            lesson_number: lesson.lesson_number || null,
            lesson_content: lesson.lesson_content || [],
            tasks_count: lesson.tasks_count || (Array.isArray(lesson.lesson_content) ? lesson.lesson_content.length : 0),
            status: lesson.status || 'Pending',
            created_at: lesson.created_at,
          }));
          
          setLessons(transformedLessons);
          setTotalItems(response.meta?.total || transformedLessons.length);
        }
      } catch (error) {
        console.error('Error fetching lessons:', error);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [user?.id, currentPage, itemsPerPage]);

  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".menu-container") && !e.target.closest(".sort-container")) {
        setOpenMenuId(null);
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  let filteredData = lessons.filter(
    (lesson) => {
      const searchMatch = (lesson.lesson_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lesson.lesson_number || '').toString().includes(searchTerm.toLowerCase());
      
      return searchMatch;
    }
  );

  filteredData = filteredData.sort((a, b) =>
    sortBy === "Newest" ? b.id - a.id : a.id - b.id
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="p-3">
        <div className="border border-gray-200 bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="border border-gray-200 bg-white rounded-xl">
        <div className="overflow-visible flex flex-col sm:flex-row justify-between gap-3 py-5 px-4 border-b border-[#F3F4F6]">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <h2 className="text-xl font-semibold">
              {(isAdmin || isSuperAdmin) ? 'Lessons' : 'My Lessons'}
            </h2>
            {(isAdmin || isSuperAdmin) && (
              <button
                onClick={() => {
                  setEditingLessonId(null);
                  setLessonTemplateForm({
                    lesson_number: '',
                    lesson_title: '',
                    tasks: [{ title: '', description: '' }],
                  });
                  setShowEditModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <FiPlus size={16} />
                <span className="hidden sm:inline">Add Lesson</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm grow sm:grow-0 w-full">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
                ⌘
              </span>
            </div>

            {}
            <div className="relative sort-container" ref={sortRef}>
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

        {}

        {}
        {/* Lesson Cards View */}
        <div className="py-4 sm:py-5 px-3 sm:px-4">
          <div className="space-y-3">
            {currentItems.length > 0 ? (
              currentItems.map((lesson) => {
                const lessonTitle = lesson.lesson_number && lesson.lesson_title
                  ? `Lesson ${lesson.lesson_number}: ${lesson.lesson_title}`
                  : lesson.lesson_title || lesson.lesson_number
                  ? `Lesson ${lesson.lesson_number || ''}: ${lesson.lesson_title || ''}`
                  : 'Untitled Lesson';
                const tasksCount = lesson.tasks_count || 0;
                
                return (
                  <div
                    key={lesson.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 break-words">{lessonTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {tasksCount} {tasksCount === 1 ? 'Task' : 'Tasks'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <button
                        onClick={() => handleViewClick(lesson.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
                          >
                            View
                          </button>
                <div className="menu-container relative">
                  <HiDotsVertical
                    className="text-[#5C5F62] cursor-pointer"
                    onClick={() => setOpenMenuId(openMenuId === lesson.id ? null : lesson.id)}
                  />
                  {openMenuId === lesson.id && (
                    <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          handleViewClick(lesson.id);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        View
                      </button>
                            {(isAdmin || isSuperAdmin) && (
                              <>
                                <button 
                                  onClick={() => handleEdit(lesson.id)}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(lesson.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                    </div>
                  )}
                </div>
              </div>
            </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No lessons found.</p>
                {(isAdmin || isSuperAdmin) && (
                  <button
                    onClick={() => {
                      setEditingLessonId(null);
                      setLessonTemplateForm({
                        lesson_number: '',
                        lesson_title: '',
                        tasks: [{ title: '', description: '' }],
                      });
                      setShowEditModal(true);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Add Lesson
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="gap-3 text-sm">
          <Pagination
            page={currentPage}
            setPage={setCurrentPage}
            perPage={itemsPerPage}
            setPerPage={setItemsPerPage}
            totalItems={filteredData.length}
          />
        </div>
      </div>

      {/* Edit Lesson Modal */}
      {showEditModal && (isAdmin || isSuperAdmin) && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                {editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLessonId(null);
                  setLessonTemplateForm({
                    lesson_number: '',
                    lesson_title: '',
                    tasks: [{ title: '', description: '' }],
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Number (Optional)
                </label>
                <input
                  type="text"
                  name="lesson_number"
                  value={lessonTemplateForm.lesson_number}
                  onChange={handleLessonTemplateFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="e.g., 38"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lesson_title"
                  value={lessonTemplateForm.lesson_title}
                  onChange={handleLessonTemplateFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="e.g., Dual IFR XC"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tasks
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <FiPlus size={16} />
                    Add Task
                  </button>
                </div>
                <div className="space-y-3">
                  {lessonTemplateForm.tasks.map((task, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Task {index + 1}</span>
                        {lessonTemplateForm.tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                          placeholder="Task title"
                        />
                        <textarea
                          value={task.description}
                          onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                          placeholder="Task description"
                          rows="3"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLessonId(null);
                  setLessonTemplateForm({
                    lesson_number: '',
                    lesson_title: '',
                    tasks: [{ title: '', description: '' }],
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                disabled={
                  submitting || !lessonTemplateForm.lesson_title
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{editingLessonId ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  editingLessonId ? 'Update Lesson' : 'Create Lesson'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLessons;
