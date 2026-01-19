import React, { useState, useRef, useEffect } from "react";
import { HiDotsVertical, HiChevronDown } from "react-icons/hi";
import { FiSearch, FiCheck, FiX, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import Pagination from "../../components/Pagination";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRole } from "../../hooks/useRole";
import { lessonService } from "../../api/services/lessonService";
import { userService } from "../../api/services/userService";
import { aircraftService } from "../../api/services/aircraftService";
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
    case 'requested':
      return "bg-[#FFF3CD] text-[#856404]"; 
    default:
      return "bg-gray-100 text-gray-600";
  }
};


const formatStatus = (status) => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const InstructorLessons = () => {
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
  const [showRequests, setShowRequests] = useState(false);
  const [showLessons, setShowLessons] = useState(false); // Default to not selected
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, ongoing, completed

  const sortRef = useRef(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [aircraft, setAircraft] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [selectedLessonForSession, setSelectedLessonForSession] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  
  
  const [lessonForm, setLessonForm] = useState({
    student_id: '',
    aircraft_id: '',
    flight_type: '',
    lesson_date: '',
    lesson_time: '',
    duration_minutes: 60,
    notes: '',
  });
  
  // Separate form for lesson templates (not reservations)
  const [lessonTemplateForm, setLessonTemplateForm] = useState({
    lesson_number: '',
    lesson_title: '',
    tasks: [{ title: '', description: '' }], // Array of tasks
  });

  const handleViewClick = (lessonId) => {
    // Determine source based on current view
    const source = showLessons ? 'lessons' : (showRequests ? 'requests' : 'reservations');
    navigate(`/lessons/${lessonId}?from=${source}`);
  };

  const handleAcceptRequest = async (lessonId) => {
    setAcceptingId(lessonId);
    try {
      // Use updateReservation for reservations (requests are reservations)
      const response = await lessonService.updateReservation(lessonId, {
        status: 'pending'
      });
      if (response.success) {
        showSuccessToast('Session request accepted');
        
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
        };
        if (showRequests) {
          params.status = 'requested';
        }
        // Use getReservations for reservations view (it filters by instructor for non-admin users)
        // For lesson templates, all users see lessons from their organization
        const refreshResponse = showLessons
          ? await lessonService.getLessons(params)
          : await lessonService.getReservations(params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || (lesson.students && lesson.students.length > 0 ? lesson.students[0].name : 'N/A'),
            instructor: lesson.instructor || (lesson.instructors && lesson.instructors.length > 0 ? lesson.instructors[0].name : 'N/A'),
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
            duration_minutes: lesson.duration_minutes || 60,
            lesson_date: lesson.lesson_date || lesson.full_date,
            lesson_time: lesson.lesson_time || lesson.full_time,
            lesson_title: lesson.lesson_title || lesson.title || null,
            lesson_number: lesson.lesson_number || null,
            lesson_content: lesson.lesson_content || [],
            tasks_count: Array.isArray(lesson.lesson_content) ? lesson.lesson_content.length : 0,
            students: lesson.students || [],
            instructors: lesson.instructors || [],
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to accept session request');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeclineRequest = async (lessonId) => {
    setDecliningId(lessonId);
    try {
      // Use updateReservation for reservations (requests are reservations)
      const response = await lessonService.updateReservation(lessonId, {
        status: 'cancelled'
      });
      if (response.success) {
        showSuccessToast('Session request declined');
        
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
        };
        if (showRequests) {
          params.status = 'requested';
        }
        // For lesson templates, all users see lessons from their organization
        const refreshResponse = await lessonService.getLessons(params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
            duration_minutes: lesson.duration_minutes || 60,
            lesson_date: lesson.lesson_date || lesson.full_date,
            lesson_time: lesson.lesson_time || lesson.full_time,
            lesson_title: lesson.lesson_title || null,
            lesson_number: lesson.lesson_number || null,
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to decline session request');
    } finally {
      setDecliningId(null);
    }
  };

  // Helper function to check if lesson start time has passed
  const isLessonStartTimePassed = (lesson) => {
    if (!lesson.lesson_date && !lesson.fullDate) return false;
    if (!lesson.lesson_time && !lesson.fullTime) return false;
    
    try {
      // Use lesson_date/lesson_time if available, otherwise fallback to fullDate/fullTime
      const dateStr = lesson.lesson_date || lesson.fullDate;
      let timeStr = lesson.lesson_time || lesson.fullTime;
      
      // Format time string to ensure it's in HH:MM or HH:MM:SS format
      if (timeStr) {
        // Remove any extra spaces and ensure proper format
        timeStr = timeStr.trim();
        // If time is in format "HH:MM:SS", keep it; if "HH:MM", keep it
        // Create ISO string for proper date parsing
        const lessonDateTime = new Date(`${dateStr}T${timeStr}`);
        
        // Check if date is valid
        if (isNaN(lessonDateTime.getTime())) {
          return false;
        }
        
        // Get current time
        const now = new Date();
        
        // Compare times
        return now >= lessonDateTime;
      }
      return false;
    } catch (error) {
      console.error('Error checking lesson start time:', error, lesson);
      return false;
    }
  };

  // Helper function to check if lesson end time has passed
  const isLessonEndTimePassed = (lesson) => {
    if (!lesson.lesson_date && !lesson.fullDate) return false;
    if (!lesson.lesson_time && !lesson.fullTime) return false;
    if (!lesson.duration_minutes) return false;
    
    try {
      // Use lesson_date/lesson_time if available, otherwise fallback to fullDate/fullTime
      const dateStr = lesson.lesson_date || lesson.fullDate;
      let timeStr = lesson.lesson_time || lesson.fullTime;
      
      // Format time string to ensure it's in HH:MM or HH:MM:SS format
      if (timeStr) {
        timeStr = timeStr.trim();
        const lessonDateTime = new Date(`${dateStr}T${timeStr}`);
        
        // Check if date is valid
        if (isNaN(lessonDateTime.getTime())) {
          return false;
        }
        
        // Calculate end time by adding duration
        const endDateTime = new Date(lessonDateTime.getTime() + (lesson.duration_minutes || 60) * 60000);
        
        // Get current time
        const now = new Date();
        
        // Compare times
        return now >= endDateTime;
      }
      return false;
    } catch (error) {
      console.error('Error checking lesson end time:', error, lesson);
      return false;
    }
  };

  // Handle start session
  const handleStartSession = async (lessonId) => {
    if (!lessonId) {
      // If called from modal, use selectedLessonId
      lessonId = selectedLessonId;
    }
    
    if (!lessonId) return;
    
    setStartingSession(true);
    try {
      // Use updateReservation for reservations
      const response = await lessonService.updateReservation(lessonId, {
        status: 'ongoing'
      });
      
      if (response.success) {
        showSuccessToast('Session started successfully');
        setShowStartSessionModal(false);
        setSelectedLessonId(null);
        setSelectedLessonForSession('');
        
        // Refresh lessons list
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
        };
        if (showRequests) {
          params.status = 'requested';
        } else if (statusFilter !== 'all' && !showLessons) {
          params.status = statusFilter;
        }
        // Use getReservations for reservations view (it filters by instructor for non-admin users)
        // For lesson templates, all users see lessons from their organization
        const refreshResponse = showLessons
          ? await lessonService.getLessons(params)
          : await lessonService.getReservations(params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || (lesson.students && lesson.students.length > 0 ? lesson.students[0].name : 'N/A'),
            instructor: lesson.instructor || (lesson.instructors && lesson.instructors.length > 0 ? lesson.instructors[0].name : 'N/A'),
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
            duration_minutes: lesson.duration_minutes || 60,
            lesson_date: lesson.lesson_date || lesson.full_date,
            lesson_time: lesson.lesson_time || lesson.full_time,
            lesson_title: lesson.lesson_title || lesson.title || null,
            lesson_number: lesson.lesson_number || null,
            lesson_content: lesson.lesson_content || [],
            tasks_count: Array.isArray(lesson.lesson_content) ? lesson.lesson_content.length : 0,
            students: lesson.students || [],
            instructors: lesson.instructors || [],
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      } else {
        showErrorToast('Failed to start session');
      }
    } catch (err) {
      console.error('Error starting session:', err);
      showErrorToast(err.response?.data?.message || 'Failed to start session');
    } finally {
      setStartingSession(false);
    }
  };

  // Handle confirm start session from modal
  const handleConfirmStartSession = async () => {
    const lessonId = selectedLessonForSession || selectedLessonId;
    if (lessonId) {
      await handleStartSession(lessonId);
    }
  };

  // Handle complete session
  const handleCompleteSession = async (lessonId) => {
    setStartingSession(true);
    try {
      // Use updateReservation for reservations
      const response = await lessonService.updateReservation(lessonId, {
        status: 'completed'
      });
      
      if (response.success) {
        showSuccessToast('Session completed successfully');
        
        // Refresh lessons list
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
        };
        if (showRequests) {
          params.status = 'requested';
        }
        // For lesson templates, all users see lessons from their organization
        const refreshResponse = await lessonService.getLessons(params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
            duration_minutes: lesson.duration_minutes || 60,
            lesson_date: lesson.lesson_date || lesson.full_date,
            lesson_time: lesson.lesson_time || lesson.full_time,
            lesson_title: lesson.lesson_title || null,
            lesson_number: lesson.lesson_number || null,
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      } else {
        showErrorToast('Failed to complete session');
      }
    } catch (err) {
      console.error('Error completing session:', err);
      showErrorToast(err.response?.data?.message || 'Failed to complete session');
    } finally {
      setStartingSession(false);
    }
  };

  // Handle add feedback
  const handleAddFeedback = (lessonId) => {
    setSelectedLessonId(lessonId);
    setShowFeedbackModal(true);
    setFeedbackText('');
  };

  // Handle edit lesson
  const handleEdit = async (lessonId) => {
    setOpenMenuId(null);
    
    // Check if we're in lessons view (lesson templates)
    if (showLessons) {
      // Only Admin and Super Admin can edit lesson templates
      if (!isAdmin && !isSuperAdmin) {
        showErrorToast('Only Admin and Super Admin can edit lessons');
        return;
      }
      
      // For lesson templates, open the modal in edit mode
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
          setShowAddLessonModal(true);
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
        showErrorToast('Failed to load lesson details');
      }
    } else {
      // For reservations, navigate to calendar edit with modal-only mode
      navigate(`/calendar?edit=${lessonId}&modal=true`);
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
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
        };
        if (showRequests) {
          params.status = 'requested';
        }
        // For lesson templates, all users see lessons from their organization
        const refreshResponse = await lessonService.getLessons(params);
        
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
            duration_minutes: lesson.duration_minutes || 60,
            lesson_date: lesson.lesson_date || lesson.full_date,
            lesson_time: lesson.lesson_time || lesson.full_time,
            lesson_title: lesson.lesson_title || null,
            lesson_number: lesson.lesson_number || null,
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete lesson');
    }
  };

  // Handle submit feedback
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !selectedLessonId) return;
    
    setSubmittingFeedback(true);
    try {
      const response = await lessonService.updateLesson(selectedLessonId, {
        feedback: feedbackText.trim()
      });
      
      if (response.success) {
        showSuccessToast('Feedback submitted successfully');
        setShowFeedbackModal(false);
        setSelectedLessonId(null);
        setFeedbackText('');
        
        // Refresh lessons list
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
        };
        if (showRequests) {
          params.status = 'requested';
        }
        // For lesson templates, all users see lessons from their organization
        const refreshResponse = await lessonService.getLessons(params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
            duration_minutes: lesson.duration_minutes || 60,
            lesson_date: lesson.lesson_date || lesson.full_date,
            lesson_time: lesson.lesson_time || lesson.full_time,
            lesson_title: lesson.lesson_title || null,
            lesson_number: lesson.lesson_number || null,
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      } else {
        showErrorToast('Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      showErrorToast(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.organization_id && !user?.organization?.id) return;
      
      setLoadingStudents(true);
      try {
        const orgId = user?.organization_id || user?.organization?.id;
        const response = await userService.getUsers({
          role: 'Student',
          organization_id: orgId,
          per_page: 100,
        });
        
        if (response.success) {
          setStudents(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (showAddLessonModal) {
      fetchStudents();
    }
  }, [user?.organization_id, user?.organization?.id, showAddLessonModal]);

  
  useEffect(() => {
    const fetchAircraft = async () => {
      if (!user?.organization_id && !user?.organization?.id) return;
      
      try {
        const response = await aircraftService.getAircraft({
          per_page: 100,
          status: 'in_service',
        });
        
        if (response.success) {
          setAircraft(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching aircraft:', error);
        setAircraft([]);
      }
    };

    if (showAddLessonModal) {
      fetchAircraft();
    }
  }, [user?.organization_id, user?.organization?.id, showAddLessonModal]);

  // Fetch available lessons for start session modal
  useEffect(() => {
    const fetchAvailableLessons = async () => {
      if (!showStartSessionModal || !user?.id) return;
      
      setLoadingLessons(true);
      try {
        const params = {
          per_page: 100,
        };
        // For lesson templates, all users see lessons from their organization
        const response = await lessonService.getLessons(params);
        
        if (response.success) {
          // Filter for lesson templates (those with lesson_title)
          const lessonTemplates = (response.data || []).filter((lesson) => 
            lesson.lesson_title || lesson.lesson_number
          );
          setAvailableLessons(lessonTemplates);
        }
      } catch (error) {
        console.error('Error fetching available lessons:', error);
        setAvailableLessons([]);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchAvailableLessons();
  }, [showStartSessionModal, user?.id, isAdmin, isSuperAdmin]);

  
  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
        };
        
        
        if (showRequests) {
          params.status = 'requested';
        } else if (statusFilter !== 'all' && !showLessons) {
          // Apply status filter for reservations
          params.status = statusFilter;
        }
        
        // Use different endpoints based on view
        let response;
        if (showLessons) {
          // For lessons view (lesson templates), all users see lessons from their organization
          // getLessons already filters by organization_id for all users
          response = await lessonService.getLessons(params);
        } else {
          // For reservations/requests view, use reservations endpoint
          // getReservations now filters by instructor for non-admin users
          response = await lessonService.getReservations(params);
        }
        
        if (response.success) {
          const transformedLessons = (response.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || (lesson.students && lesson.students.length > 0 ? lesson.students[0].name : 'N/A'),
            instructor: lesson.instructor || (lesson.instructors && lesson.instructors.length > 0 ? lesson.instructors[0].name : 'N/A'),
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
            duration_minutes: lesson.duration_minutes || 60,
            lesson_date: lesson.lesson_date || lesson.full_date,
            lesson_time: lesson.lesson_time || lesson.full_time,
            lesson_title: lesson.lesson_title || lesson.title || null,
            lesson_number: lesson.lesson_number || null,
            lesson_content: lesson.lesson_content || [],
            tasks_count: Array.isArray(lesson.lesson_content) ? lesson.lesson_content.length : 0,
            students: lesson.students || [],
            instructors: lesson.instructors || [],
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
  }, [user?.id, currentPage, itemsPerPage, showRequests, showLessons, statusFilter, isAdmin, isSuperAdmin]);

  
  const handleLessonFormChange = (e) => {
    const { name, value } = e.target;
    setLessonForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle adding a task to lesson template
  const handleAddTask = () => {
    setLessonTemplateForm(prev => ({
      ...prev,
      tasks: [...prev.tasks, { title: '', description: '' }]
    }));
  };

  // Handle removing a task from lesson template
  const handleRemoveTask = (index) => {
    setLessonTemplateForm(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  // Handle task field change
  const handleTaskChange = (index, field, value) => {
    setLessonTemplateForm(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  // Handle lesson template form change
  const handleLessonTemplateFormChange = (e) => {
    const { name, value } = e.target;
    setLessonTemplateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  
  const handleCreateLesson = async () => {
    // If we're in "Lessons" view, create or update a lesson template (not a reservation)
    if (showLessons) {
      if (!lessonTemplateForm.lesson_title) {
        showErrorToast('Please enter lesson title');
        return;
      }

      setSubmitting(true);
      // Only Admin and Super Admin can create/update lesson templates
      if (!isAdmin && !isSuperAdmin) {
        showErrorToast('Only Admin and Super Admin can create or update lessons');
        setSubmitting(false);
        return;
      }
      
      try {
        // Filter out empty tasks
        const validTasks = lessonTemplateForm.tasks.filter(
          task => task.title.trim() !== '' || task.description.trim() !== ''
        );

        const lessonData = {
          lesson_number: lessonTemplateForm.lesson_number || null,
          lesson_title: lessonTemplateForm.lesson_title,
          lesson_content: validTasks.length > 0 ? validTasks : [],
          // Don't set student_ids, instructor_ids, lesson_date, lesson_time for templates
          // These are templates, not actual reservations
        };

        let response;
        if (editingLessonId) {
          // Update existing lesson template
          response = await lessonService.updateLesson(editingLessonId, lessonData);
        } else {
          // Create new lesson template
          response = await lessonService.createLesson(lessonData);
        }
        
        if (response.success) {
          showSuccessToast(editingLessonId ? 'Lesson template updated successfully' : 'Lesson template created successfully');
          setShowAddLessonModal(false);
          setEditingLessonId(null);
          setLessonTemplateForm({
            lesson_number: '',
            lesson_title: '',
            tasks: [{ title: '', description: '' }],
          });
          
          // Refresh lessons list
          const params = {
            per_page: itemsPerPage,
            page: currentPage,
          };
          
          // Use lessons endpoint for lesson templates - all users see lessons from their organization
          const refreshResponse = await lessonService.getLessons(params);
          if (refreshResponse.success) {
            // Transform lesson templates
            const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
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
        const errorMessage = err.response?.data?.message || err.message || 'Failed to create lesson template';
        showErrorToast(errorMessage);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Original reservation creation logic
    if (!lessonForm.student_id) {
      showErrorToast('Please select a student');
      return;
    }
    if (!lessonForm.flight_type) {
      showErrorToast('Please select a flight type');
      return;
    }
    if (!lessonForm.lesson_date) {
      showErrorToast('Please select a lesson date');
      return;
    }
    if (!lessonForm.lesson_time) {
      showErrorToast('Please select a lesson time');
      return;
    }

    setSubmitting(true);
    try {
      const lessonData = {
        ...lessonForm,
        // Convert single IDs to arrays for many-to-many relationship
        student_ids: lessonForm.student_id ? [parseInt(lessonForm.student_id)] : [],
        instructor_ids: [user.id], // Current user is the instructor
        aircraft_id: lessonForm.aircraft_id ? parseInt(lessonForm.aircraft_id) : null,
        duration_minutes: parseInt(lessonForm.duration_minutes) || 60,
        status: 'pending',
      };

      // Remove old single ID fields
      delete lessonData.student_id;
      delete lessonData.instructor_id;

      // Use reservations endpoint for creating reservations
      const response = await lessonService.createReservation(lessonData);
      
      if (response.success) {
        showSuccessToast('Reservation created successfully');
        setShowAddLessonModal(false);
        setLessonForm({
          student_id: '',
          aircraft_id: '',
          flight_type: '',
          lesson_date: '',
          lesson_time: '',
          duration_minutes: 60,
          notes: '',
        });
        
        const params = {
          per_page: itemsPerPage,
          page: currentPage,
        };
        if (showRequests) {
          params.status = 'requested';
        }
        // For lesson templates, all users see lessons from their organization
        const refreshResponse = await lessonService.getLessons(params);
        if (refreshResponse.success) {
          const transformedLessons = (refreshResponse.data || []).map((lesson) => ({
            id: lesson.id,
            date: lesson.date || lesson.full_date,
            time: lesson.time || lesson.full_time,
            student: lesson.student || 'N/A',
            status: lesson.status || 'Pending',
            flightType: lesson.flight_type || 'N/A',
            aircraft: lesson.aircraft || 'N/A',
            notes: lesson.notes || 'N/A',
            fullDate: lesson.full_date,
            fullTime: lesson.full_time,
            duration_minutes: lesson.duration_minutes || 60,
            lesson_date: lesson.lesson_date || lesson.full_date,
            lesson_time: lesson.lesson_time || lesson.full_time,
            lesson_title: lesson.lesson_title || lesson.title || null,
            lesson_number: lesson.lesson_number || null,
            lesson_content: lesson.lesson_content || [],
            tasks_count: Array.isArray(lesson.lesson_content) ? lesson.lesson_content.length : 0,
          }));
          setLessons(transformedLessons);
          setTotalItems(refreshResponse.meta?.total || transformedLessons.length);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create reservation';
      showErrorToast(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  
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
      
      
      if (showRequests) {
        if (lesson.status?.toLowerCase() !== 'requested') {
          return false;
        }
        
        const searchMatch = lesson.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.flightType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.aircraft?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        return searchMatch;
      } else if (showLessons) {
        // Show actual lessons (with lesson_title and lesson_number) - not reservations
        // Only show lessons that have lesson_title or lesson_number
        if (!lesson.lesson_title && !lesson.lesson_number) {
          return false;
        }
        
        const searchMatch = (lesson.lesson_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lesson.lesson_number || '').toString().includes(searchTerm.toLowerCase()) ||
          (lesson.flightType || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        return searchMatch;
      } else {
        // Default view: Show reservations
        // Reservations can have lesson_title/lesson_number from linked lesson template, so don't filter them out
        // The backend already filters reservations vs lessons, so we just need to filter by search and status
        
        // Apply status filter if set
        if (statusFilter !== 'all') {
          if (lesson.status?.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
          }
        }
        
        // Exclude requested status unless we're in request view
        if (lesson.status?.toLowerCase() === 'requested' && !showRequests) {
          return false;
        }
        
        const searchMatch = (lesson.student || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lesson.flightType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lesson.aircraft || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lesson.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        return searchMatch;
      }
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {showLessons ? 'Lessons' : 'Reservations'}
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {}
            <button
              onClick={() => {
                setShowLessons(!showLessons);
                setShowRequests(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap ${
                showLessons
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Lessons
            </button>
            
            {}
            <button
              onClick={() => {
                setShowRequests(!showRequests);
                setShowLessons(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap ${
                showRequests
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Request
            </button>
            
            {}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-[250px] min-h-[44px]">
              <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full min-w-0"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:inline">
                ⌘
              </span>
            </div>

            {}
            <div className="relative w-full sm:w-auto sort-container" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700 min-h-[44px] whitespace-nowrap hover:bg-gray-50 transition-colors"
              >
                <MdFilterList className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Sort by</span>
                <HiChevronDown 
                  size={16} 
                  className={`transition-transform flex-shrink-0 ${sortOpen ? 'transform rotate-180' : ''}`}
                />
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-48 md:w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    {["Newest", "Oldest"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setSortOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                          sortBy === option
                            ? "text-blue-600 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        <span>{option}</span>
                        {sortBy === option && (
                          <span className="text-xs text-gray-500">{sortBy === "Newest" ? '↓' : '↑'}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        {showLessons && (
          <div className="bg-white border-b border-[#F3F4F6] px-6 py-4">
            {(isAdmin || isSuperAdmin) && (
              <button
                onClick={() => setShowAddLessonModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 min-h-[44px] whitespace-nowrap"
              >
                <FiPlus size={18} />
                <span>Add Lesson</span>
              </button>
            )}
          </div>
        )}

        {}
        {/* Status Tabs for Reservations */}
        {!showLessons && !showRequests && (
          <div className="border-b border-[#F3F4F6] px-4">
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-[#EBF0FB] text-[#113B98] border-b-2 border-[#113B98]'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-[#EBF0FB] text-[#113B98] border-b-2 border-[#113B98]'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('ongoing')}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  statusFilter === 'ongoing'
                    ? 'bg-[#EBF0FB] text-[#113B98] border-b-2 border-[#113B98]'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Ongoing
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-[#EBF0FB] text-[#113B98] border-b-2 border-[#113B98]'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        )}
        {}
        {!showLessons && (
          <div className="hidden md:block overflow-x-auto py-4 sm:py-5 px-3 sm:px-4">
            <table className="min-w-full border border-gray-200 text-sm relative">
            <thead className="bg-[#FAFAFA] text-[#090909] text-left">
              <tr>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Student</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Date</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Time</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Flight Type</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Status</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6]">Notes</th>
                <th className="py-2 px-3 font-medium border border-[#E5E1E6] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#3D3D3D] bg-[#FFFFFF]">
              {currentItems.length > 0 ? (
                currentItems.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50 relative">
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.student}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.date}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.time}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.flightType}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(lesson.status)}`}>
                        {formatStatus(lesson.status)}
                      </span>
                    </td>
                    <td className="py-2 px-3 border border-[#E5E1E6]">{lesson.notes}</td>
                    <td className="py-2 px-3 border border-[#E5E1E6] text-center relative">
                      {showRequests && !(isAdmin || isSuperAdmin) && lesson.status?.toLowerCase() === 'requested' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAcceptRequest(lesson.id)}
                            disabled={acceptingId === lesson.id}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 text-xs"
                            title="Accept request"
                          >
                            {acceptingId === lesson.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <FiCheck size={14} />
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(lesson.id)}
                            disabled={decliningId === lesson.id}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 text-xs"
                            title="Decline request"
                          >
                            {decliningId === lesson.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <FiX size={14} />
                                Decline
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="menu-container inline-block">
                          <HiDotsVertical
                            className="text-[#5C5F62] cursor-pointer"
                            onClick={() =>
                              setOpenMenuId(openMenuId === lesson.id ? null : lesson.id)
                            }
                          />
                          {openMenuId === lesson.id && (
                            <div className="absolute right-5 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleViewClick(lesson.id);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                View
                              </button>
                              {lesson.status === 'pending' && isLessonStartTimePassed(lesson) && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleStartSession(lesson.id);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600"
                                >
                                  Start Reservation
                                </button>
                              )}
                              {lesson.status === 'ongoing' && isLessonEndTimePassed(lesson) && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleCompleteSession(lesson.id);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-green-600"
                                >
                                  Complete
                                </button>
                              )}
                              {(lesson.status === 'ongoing' || lesson.status === 'completed') && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleAddFeedback(lesson.id);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-green-600"
                                >
                                  Add Feedback
                                </button>
                              )}
                              {showLessons && (isAdmin || isSuperAdmin) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleEdit(lesson.id);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleDelete(lesson.id);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                  >
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
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    {showRequests && !(isAdmin || isSuperAdmin) ? "No requested sessions found" : "No reservations found"}
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}

        {}
        {showLessons && (
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
                              {showLessons && (isAdmin || isSuperAdmin) && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleEdit(lesson.id);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleDelete(lesson.id);
                                    }}
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
                <div className="text-center py-12">
                  <p className="text-gray-500">No lessons found</p>
                  {(isAdmin || isSuperAdmin) && (
                    <button
                      onClick={() => setShowAddLessonModal(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      Add Lesson
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {showLessons ? (
          <div className="md:hidden space-y-3 py-4 px-3 sm:px-4">
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
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">{lessonTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {tasksCount} {tasksCount === 1 ? 'Task' : 'Tasks'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewClick(lesson.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
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
                            {showLessons && (isAdmin || isSuperAdmin) && (
                              <>
                                <button 
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleEdit(lesson.id);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleDelete(lesson.id);
                                  }}
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
              <div className="text-center py-12">
                <p className="text-gray-500">No lessons found</p>
                {(isAdmin || isSuperAdmin) && (
                  <button
                    onClick={() => setShowAddLessonModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Add Lesson
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 md:hidden py-4 px-3 sm:px-4">
            {currentItems.length > 0 ? (
              currentItems.map((lesson) => (
                <div key={lesson.id} className="border border-[#E5E7EB] rounded-xl p-4 bg-white shadow-sm relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-medium text-gray-900">{lesson.student}</h3>
                      {lesson.lesson_title && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          {lesson.lesson_number ? `Lesson ${lesson.lesson_number}: ${lesson.lesson_title}` : lesson.lesson_title}
                        </p>
                      )}
                      <p className="text-xs text-[#797979] mt-1">{lesson.flightType}</p>
                      {showRequests && !(isAdmin || isSuperAdmin) && (
                        <span className={`mt-2 inline-block px-2 py-1 text-xs rounded font-medium ${getStatusColor(lesson.status)}`}>
                          {formatStatus(lesson.status)}
                        </span>
                      )}
                    </div>
                    {(!showRequests || lesson.status?.toLowerCase() !== 'requested' || (isAdmin || isSuperAdmin)) ? (
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
                            {showLessons && (isAdmin || isSuperAdmin) && (
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
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600"><span className="font-medium">Date:</span> {lesson.date}</p>
                    <p className="text-xs text-gray-600"><span className="font-medium">Time:</span> {lesson.time}</p>
                    <p className="text-xs text-gray-600"><span className="font-medium">Notes:</span> {lesson.notes}</p>
                  </div>
                  {showRequests && !(isAdmin || isSuperAdmin) && lesson.status?.toLowerCase() === 'requested' && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleAcceptRequest(lesson.id)}
                        disabled={acceptingId === lesson.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 text-sm"
                      >
                        {acceptingId === lesson.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <FiCheck size={16} />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(lesson.id)}
                        disabled={decliningId === lesson.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 text-sm"
                      >
                        {decliningId === lesson.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <FiX size={16} />
                            Decline
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {showRequests && !(isAdmin || isSuperAdmin) ? "No requested sessions found" : "No reservations found"}
              </div>
            )}
          </div>
        )}

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

      {}
      {showAddLessonModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                {showLessons 
                  ? (editingLessonId ? 'Edit Lesson' : 'Add New Lesson')
                  : 'Add New Reservation'}
              </h3>
              <button
                onClick={() => {
                  setShowAddLessonModal(false);
                  setEditingLessonId(null);
                  if (showLessons) {
                    setLessonTemplateForm({
                      lesson_number: '',
                      lesson_title: '',
                      tasks: [{ title: '', description: '' }],
                    });
                  } else {
                    setLessonForm({
                      student_id: '',
                      aircraft_id: '',
                      flight_type: '',
                      lesson_date: '',
                      lesson_time: '',
                      duration_minutes: 60,
                      notes: '',
                    });
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {showLessons ? (
                <>
                  {/* Lesson Template Form */}
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
                </>
              ) : (
                <>
                  {/* Reservation Form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="student_id"
                      value={lessonForm.student_id}
                      onChange={handleLessonFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      required
                      disabled={loadingStudents}
                    >
                      <option value="">Select a student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </option>
                      ))}
                    </select>
                    {loadingStudents && (
                      <p className="text-xs text-gray-500 mt-1">Loading students...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flight Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="flight_type"
                      value={lessonForm.flight_type}
                      onChange={handleLessonFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      required
                    >
                      <option value="">Select flight type</option>
                      <option value="Solo">Solo</option>
                      <option value="Duo Landing">Duo Landing</option>
                      <option value="Windy Smooth landing">Windy Smooth landing</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Crash landing">Crash landing</option>
                      <option value="Night Flight">Night Flight</option>
                      <option value="Cross Country">Cross Country</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lesson Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="lesson_date"
                        value={lessonForm.lesson_date}
                        onChange={handleLessonFormChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lesson Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="lesson_time"
                        value={lessonForm.lesson_time}
                        onChange={handleLessonFormChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aircraft (Optional)
                      </label>
                      <select
                        name="aircraft_id"
                        value={lessonForm.aircraft_id}
                        onChange={handleLessonFormChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      >
                        <option value="">No aircraft selected</option>
                        {aircraft.map((ac) => (
                          <option key={ac.id} value={ac.id}>
                            {ac.name} {ac.model ? `(${ac.model})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        name="duration_minutes"
                        value={lessonForm.duration_minutes}
                        onChange={handleLessonFormChange}
                        min="15"
                        max="480"
                        step="15"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={lessonForm.notes}
                      onChange={handleLessonFormChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      placeholder="Add any additional notes..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddLessonModal(false);
                  if (showLessons) {
                    setLessonTemplateForm({
                      lesson_number: '',
                      lesson_title: '',
                      tasks: [{ title: '', description: '' }],
                    });
                  } else {
                    setLessonForm({
                      student_id: '',
                      aircraft_id: '',
                      flight_type: '',
                      lesson_date: '',
                      lesson_time: '',
                      duration_minutes: 60,
                      notes: '',
                    });
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLesson}
                disabled={
                  submitting || 
                  (showLessons 
                    ? !lessonTemplateForm.lesson_title 
                    : !lessonForm.student_id || !lessonForm.flight_type || !lessonForm.lesson_date || !lessonForm.lesson_time)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{editingLessonId ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  showLessons 
                    ? (editingLessonId ? 'Update Lesson Template' : 'Create Lesson Template')
                    : 'Create Reservation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {showStartSessionModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Start Flight Session</h3>
              <button
                onClick={() => {
                  setShowStartSessionModal(false);
                  setSelectedLessonId(null);
                  setSelectedLessonForSession('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Lesson (Optional)
                </label>
                {loadingLessons ? (
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                    Loading lessons...
                  </div>
                ) : (
                  <select
                    value={selectedLessonForSession}
                    onChange={(e) => setSelectedLessonForSession(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">None - Start without linking to lesson</option>
                    {availableLessons.map((lesson) => {
                      // Format: lesson_title - lesson_number
                      const lessonDisplay = lesson.lesson_title 
                        ? (lesson.lesson_number ? `${lesson.lesson_title} - ${lesson.lesson_number}` : lesson.lesson_title)
                        : (lesson.flight_type || 'Lesson');
                      return (
                        <option key={lesson.id} value={lesson.id}>
                          {lessonDisplay}
                        </option>
                      );
                    })}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">You can link this session to an existing lesson or start without linking</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowStartSessionModal(false);
                  setSelectedLessonId(null);
                  setSelectedLessonForSession('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={startingSession}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartSession}
                disabled={startingSession}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {startingSession ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Add Feedback</h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedLessonId(null);
                  setFeedbackText('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback for Student
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your feedback for this lesson..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedLessonId(null);
                  setFeedbackText('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submittingFeedback}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback || !feedbackText.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorLessons;

