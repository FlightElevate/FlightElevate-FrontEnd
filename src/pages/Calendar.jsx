import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiSettings, FiX, FiSearch } from 'react-icons/fi';
import { calendarService } from '../api/services/calendarService';
import { lessonService } from '../api/services/lessonService';
import { userService } from '../api/services/userService';
import { organizationService } from '../api/services/organizationService';
import { showErrorToast, showSuccessToast } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { api } from '../api/apiClient';
import { ENDPOINTS } from '../api/config';
import FindTimeModal from '../components/Calendar/FindTimeModal';

const Calendar = () => {
  const { user } = useAuth();
  const { isStudent, isSuperAdmin } = useRole();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const editLessonId = searchParams.get('edit');
  const modalOnly = searchParams.get('modal') === 'true'; // If true, only show modal, hide calendar
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [aircraftSchedule, setAircraftSchedule] = useState([]);
  const [userSchedule, setUserSchedule] = useState([]);
  const [filteredAircraftSchedule, setFilteredAircraftSchedule] = useState([]);
  const [filteredUserSchedule, setFilteredUserSchedule] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);

  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [showFindTimeModal, setShowFindTimeModal] = useState(false);
  const [showReservationDetailModal, setShowReservationDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loadingReservation, setLoadingReservation] = useState(false);

  // Calendar settings state
  const [calendarSettings, setCalendarSettings] = useState({
    time_format: '12h',
    default_view: 'week',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    show_weekends: true,
    time_slot_interval: 60,
    custom_locations: [],
  });
  const [newLocation, setNewLocation] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form states
  const [reservationForm, setReservationForm] = useState({
    student_id: '',
    instructor_id: '',
    aircraft_id: '',
    flight_type: '',
    lesson_id: '',
    lesson_template_id: '',
    lesson_date: '',
    lesson_time: '',
    duration_minutes: 60,
    notes: '',
    reservation_number: '',
  });
  
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonTemplates, setLessonTemplates] = useState([]);
  const [loadingLessonTemplates, setLoadingLessonTemplates] = useState(false);

  // Generate random 10-character reservation number
  const generateReservationNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Availability check states
  const [availabilityStatus, setAvailabilityStatus] = useState({
    student: null, // null = not checked, true = available, false = busy
    instructor: null,
    aircraft: null,
    checking: false,
  });
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  
  // Store student's existing bookings to prevent double booking
  const [studentBookings, setStudentBookings] = useState([]);

  // Generate time slots (24 hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    return {
      hour,
      label: hour === 0 ? '12 am' : hour < 12 ? `${hour} am` : hour === 12 ? '12 pm' : `${hour - 12} pm`,
    };
  });

  // Fetch organizations only once on mount
  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch schedule when date or organization changes
  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, selectedOrganizationId]);

  useEffect(() => {
    filterSchedules();
  }, [searchQuery, aircraftSchedule, userSchedule]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (hoveredEvent && tooltipRef.current) {
        setHoverPosition({ x: e.clientX, y: e.clientY });
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [hoveredEvent]);

  // Check for edit mode and fetch lesson data
  useEffect(() => {
    if (editLessonId) {
      // Prevent students from editing lessons
      if (isStudent()) {
        showErrorToast('Students cannot edit lessons');
        searchParams.delete('edit');
        setSearchParams(searchParams);
        return;
      }

      const fetchLessonForEdit = async () => {
        try {
          const lessonId = parseInt(editLessonId, 10);
          if (!isNaN(lessonId) && lessonId > 0) {
            // First, ensure form data is loaded (students, instructors, aircraft)
            // Wait for form data to be fully loaded
            setLoadingFormData(true);
            await fetchFormData();
            // Wait a bit more to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Try reservation first (calendar events are reservations)
            let response = await lessonService.getReservation(lessonId);
            // If not found, try lesson (for lesson templates)
            if (!response.success) {
              response = await lessonService.getLesson(lessonId);
            }
            if (response.success) {
              const lessonData = response.data;
              setIsEditMode(true);
              setEditingLesson(lessonData);
              
              // Pre-fill form with lesson data
              // Handle arrays for students and instructors (many-to-many relationship)
              // Check for students/instructors arrays first, then fallback to student_ids/instructor_ids, then single student/instructor
              let firstStudent = null;
              if (lessonData.students && lessonData.students.length > 0) {
                firstStudent = lessonData.students[0];
              } else if (lessonData.student_ids && lessonData.student_ids.length > 0) {
                // If only IDs are provided, create object with id
                firstStudent = { id: lessonData.student_ids[0] };
              } else if (lessonData.student) {
                firstStudent = typeof lessonData.student === 'object' ? lessonData.student : { id: lessonData.student };
              }
              
              let firstInstructor = null;
              if (lessonData.instructors && lessonData.instructors.length > 0) {
                firstInstructor = lessonData.instructors[0];
              } else if (lessonData.instructor_ids && lessonData.instructor_ids.length > 0) {
                // If only IDs are provided, create object with id
                firstInstructor = { id: lessonData.instructor_ids[0] };
              } else if (lessonData.instructor) {
                firstInstructor = typeof lessonData.instructor === 'object' ? lessonData.instructor : { id: lessonData.instructor };
              }
              
              // Get aircraft ID - check both aircraft object and aircraft_id
              const aircraftId = lessonData.aircraft?.id 
                ? String(lessonData.aircraft.id) 
                : (lessonData.aircraft_id ? String(lessonData.aircraft_id) : '');
              
              // Set form values after ensuring form data is loaded
              // Ensure values are strings to match option values
              const studentIdValue = firstStudent?.id ? String(firstStudent.id) : '';
              const instructorIdValue = firstInstructor?.id ? String(firstInstructor.id) : '';
              const aircraftIdValue = aircraftId ? String(aircraftId) : '';
              
              setReservationForm({
                student_id: studentIdValue,
                instructor_id: instructorIdValue,
                aircraft_id: aircraftIdValue,
                flight_type: lessonData.flight_type || '',
                lesson_id: lessonData.id ? String(lessonData.id) : '',
                lesson_template_id: lessonData.lesson_template_id ? String(lessonData.lesson_template_id) : '',
                lesson_date: lessonData.lesson_date || '',
                lesson_time: lessonData.lesson_time || '',
                duration_minutes: lessonData.duration_minutes || 60,
                notes: lessonData.notes || lessonData.description || '',
                reservation_number: lessonData.reservation_number || lessonData.reservation_no || generateReservationNumber(),
              });
              
              // Debug: Log to verify values are set correctly
              console.log('Edit mode - Form values set:', {
                student_id: studentIdValue,
                instructor_id: instructorIdValue,
                aircraft_id: aircraftIdValue,
                studentsLoaded: students.length,
                instructorsLoaded: instructors.length,
                aircraftLoaded: aircraft.length,
                lessonData: lessonData
              });
              
              // Note: The useEffect hook below will handle updating form values
              // once students and instructors lists are loaded
              
              // Open the reservation modal
              setShowNewReservationModal(true);
              
              // If modalOnly is true, we're editing from reservation list - clean up URL after modal opens
              if (modalOnly) {
                // Remove edit param but keep modal param temporarily
                setTimeout(() => {
                  searchParams.delete('edit');
                  setSearchParams(searchParams);
                }, 100);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching lesson for edit:', err);
          showErrorToast('Failed to load lesson for editing');
          // Remove invalid edit parameter
          searchParams.delete('edit');
          if (modalOnly) {
            searchParams.delete('modal');
          }
          setSearchParams(searchParams);
        } finally {
          setLoadingFormData(false);
        }
      };
      
      fetchLessonForEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLessonId]);

  useEffect(() => {
    if (showNewReservationModal || showFindTimeModal) {
      fetchFormData();
    }
  }, [showNewReservationModal, showFindTimeModal]);

  // Preserve form values when form data loads in edit mode
  useEffect(() => {
    if (isEditMode && editingLesson && !loadingFormData && students.length > 0 && instructors.length > 0) {
      // Re-apply form values to ensure dropdowns are properly selected
      // Check for students/instructors arrays first, then fallback to student_ids/instructor_ids, then single student/instructor
      let firstStudent = null;
      if (editingLesson.students && editingLesson.students.length > 0) {
        firstStudent = editingLesson.students[0];
      } else if (editingLesson.student_ids && editingLesson.student_ids.length > 0) {
        // If only IDs are provided, create object with id
        firstStudent = { id: editingLesson.student_ids[0] };
      } else if (editingLesson.student) {
        firstStudent = typeof editingLesson.student === 'object' ? editingLesson.student : { id: editingLesson.student };
      }
      
      let firstInstructor = null;
      if (editingLesson.instructors && editingLesson.instructors.length > 0) {
        firstInstructor = editingLesson.instructors[0];
      } else if (editingLesson.instructor_ids && editingLesson.instructor_ids.length > 0) {
        // If only IDs are provided, create object with id
        firstInstructor = { id: editingLesson.instructor_ids[0] };
      } else if (editingLesson.instructor) {
        firstInstructor = typeof editingLesson.instructor === 'object' ? editingLesson.instructor : { id: editingLesson.instructor };
      }
      
      // Get aircraft ID - check both aircraft object and aircraft_id
      const aircraftId = editingLesson.aircraft?.id 
        ? String(editingLesson.aircraft.id) 
        : (editingLesson.aircraft_id ? String(editingLesson.aircraft_id) : '');
      
      const studentIdStr = firstStudent?.id ? String(firstStudent.id) : '';
      const instructorIdStr = firstInstructor?.id ? String(firstInstructor.id) : '';
      
      // Always update to ensure dropdowns are properly selected
      setReservationForm(prev => ({
        ...prev,
        student_id: studentIdStr || prev.student_id,
        instructor_id: instructorIdStr || prev.instructor_id,
        aircraft_id: aircraftId || prev.aircraft_id,
        flight_type: editingLesson.flight_type || prev.flight_type,
        lesson_id: editingLesson.id ? String(editingLesson.id) : prev.lesson_id,
        lesson_date: editingLesson.lesson_date || prev.lesson_date,
        lesson_time: editingLesson.lesson_time || prev.lesson_time,
        duration_minutes: editingLesson.duration_minutes || prev.duration_minutes,
        notes: editingLesson.notes || editingLesson.description || prev.notes,
        reservation_number: editingLesson.reservation_number || editingLesson.reservation_no || prev.reservation_number,
      }));
      
      // Debug log
      console.log('useEffect - Form values updated:', {
        student_id: studentIdStr,
        instructor_id: instructorIdStr,
        aircraft_id: aircraftId,
        studentsCount: students.length,
        instructorsCount: instructors.length,
        aircraftCount: aircraft.length,
        studentInList: students.some(s => String(s.id) === studentIdStr),
        instructorInList: instructors.some(i => String(i.id) === instructorIdStr),
        allStudentIds: students.map(s => String(s.id)),
        allInstructorIds: instructors.map(i => String(i.id))
      });
    }
  }, [isEditMode, editingLesson, loadingFormData, students, instructors, aircraft]);

  const fetchLessons = async () => {
    setLoadingLessons(true);
    try {
      const params = {
        per_page: 100,
        status: 'pending,ongoing',
      };
      // For students, fetch their own lessons
      // For admins/instructors, fetch organization lessons
      if (!isStudent() && user?.organization_id) {
        params.organization_id = user.organization_id;
      }
      const response = await lessonService.getLessons(params);
      if (response.success) {
        const lessonsList = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        // Filter out completed and cancelled lessons
        const filteredLessons = lessonsList.filter(lesson => 
          lesson.status !== 'completed' && lesson.status !== 'cancelled'
        );
        setLessons(filteredLessons);
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const fetchLessonTemplates = async () => {
    setLoadingLessonTemplates(true);
    try {
      const params = {
        per_page: 100,
      };
      if (!isStudent() && user?.organization_id) {
        params.organization_id = user.organization_id;
      }
      const response = await lessonService.getLessons(params);
      if (response.success) {
        const lessonsList = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        // Filter for lesson templates (have lesson_title but no lesson_date/lesson_time)
        const templates = lessonsList.filter(lesson => 
          (lesson.lesson_title || lesson.lesson_number) && !lesson.lesson_date && !lesson.lesson_time
        );
        setLessonTemplates(templates);
      }
    } catch (err) {
      console.error('Error fetching lesson templates:', err);
      setLessonTemplates([]);
    } finally {
      setLoadingLessonTemplates(false);
    }
  };

  useEffect(() => {
    if (showNewReservationModal) {
      fetchLessonTemplates();
    }
  }, [showNewReservationModal, user?.organization_id]);

  // Fetch student's existing bookings when modal opens and student/date is selected
  useEffect(() => {
    const fetchStudentBookings = async () => {
      if (showNewReservationModal && reservationForm.student_id && reservationForm.lesson_date) {
        try {
          const scheduleRes = await calendarService.getSchedule({
            date: reservationForm.lesson_date,
          });
          
          if (scheduleRes.success) {
            const userSchedule = scheduleRes.data.user_schedule || [];
            const studentBookingsData = userSchedule.find(user => 
              user.id === parseInt(reservationForm.student_id)
            );
            
            if (studentBookingsData) {
              setStudentBookings(studentBookingsData.events || []);
            } else {
              setStudentBookings([]);
            }
          }
        } catch (err) {
          console.error('Error fetching student bookings:', err);
          setStudentBookings([]);
        }
      } else {
        setStudentBookings([]);
      }
    };

    fetchStudentBookings();
  }, [showNewReservationModal, reservationForm.student_id, reservationForm.lesson_date]);

  // Track if aircraft is pre-selected
  const [isAircraftPreSelected, setIsAircraftPreSelected] = useState(false);

  // Handle navigation state from aircraft profile
  useEffect(() => {
    if (location.state) {
      const { preSelectedAircraft, preSelectedDate, preSelectedTime, preSelectedDuration, openReservationModal } = location.state;
      
      if (openReservationModal) {
        // Mark aircraft as pre-selected if provided
        if (preSelectedAircraft) {
          setIsAircraftPreSelected(true);
        } else {
          setIsAircraftPreSelected(false);
        }
        
        // Open the reservation modal first
        setShowNewReservationModal(true);
        
        // Set pre-selected values in reservation form after a short delay to ensure form data is loaded
        setTimeout(() => {
          setReservationForm(prev => ({
            ...prev,
            ...(preSelectedAircraft && { aircraft_id: String(preSelectedAircraft) }),
            ...(preSelectedDate && { lesson_date: preSelectedDate }),
            ...(preSelectedTime && { lesson_time: preSelectedTime }),
            ...(preSelectedDuration && { duration_minutes: preSelectedDuration }),
          }));
        }, 100);
        
        // Clear the state to prevent reopening on re-render
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  useEffect(() => {
    // Only generate reservation number for new reservations, not when editing
    if (showNewReservationModal && !isEditMode) {
      setReservationForm(prev => ({
        ...prev,
        reservation_number: prev.reservation_number || generateReservationNumber(),
      }));
    }
  }, [showNewReservationModal, isEditMode]);

  useEffect(() => {
    if (showSettingsModal) {
      fetchCalendarSettings();
    }
  }, [showSettingsModal]);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationService.getOrganizations({ per_page: 100 });
      if (response.success) {
        // Filter out MasterControl organization (owner organization - ID: 5)
        const MASTERCONTROL_ORG_ID = 5;
        const filteredOrgs = Array.isArray(response.data) 
          ? response.data.filter(org => org.id !== MASTERCONTROL_ORG_ID)
          : [];
        setOrganizations(filteredOrgs);
        
        // Auto-select first organization if none is selected and organizations exist
        if (!selectedOrganizationId && filteredOrgs.length > 0 && !isStudent()) {
          setSelectedOrganizationId(String(filteredOrgs[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  // Track window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Calculate week start (Sunday) and end (Saturday) from currentDate
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
      const end = new Date(start);
      end.setDate(end.getDate() + 6); // End of week (Saturday)
      
      // Format dates as YYYY-MM-DD without timezone conversion
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatDate(start);
      const endDateStr = formatDate(end);
      
      const response = await calendarService.getSchedule({
        start_date: startDateStr,
        end_date: endDateStr,
        organization_id: selectedOrganizationId || undefined,
      });

      if (response.success) {
        setAircraftSchedule(response.data.aircraft_schedule || []);
        setUserSchedule(response.data.user_schedule || []);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      showErrorToast('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    setLoadingFormData(true);
    try {
      const [studentsRes, instructorsRes, aircraftRes] = await Promise.all([
        userService.getUsers({ role: 'Student', per_page: 100 }),
        userService.getUsers({ role: 'Instructor', per_page: 100 }),
        api.get(ENDPOINTS.AIRCRAFT.LIST, { params: { per_page: 100 } }).catch(err => {
          console.error('Error fetching aircraft:', err);
          return { success: false, data: [] };
        }),
      ]);

      if (studentsRes.success) {
        // Response structure: response.data is the array of users
        const studentsList = Array.isArray(studentsRes.data) 
          ? studentsRes.data 
          : [];
        
        // If current user is a student, only show themselves
        if (isStudent() && user?.id) {
          const currentStudent = studentsList.find(s => s.id === user.id);
          setStudents(currentStudent ? [currentStudent] : []);
          // Auto-select current student
          setReservationForm(prev => ({
            ...prev,
            student_id: String(user.id),
          }));
        } else {
          setStudents(studentsList);
        }
      } else {
        setStudents([]);
      }
      
      if (instructorsRes.success) {
        // Response structure: response.data is the array of users
        const instructorsList = Array.isArray(instructorsRes.data) 
          ? instructorsRes.data 
          : [];
        setInstructors(instructorsList);
      } else {
        setInstructors([]);
      }
      
      if (aircraftRes.success) {
        const aircraftList = Array.isArray(aircraftRes.data) 
          ? aircraftRes.data 
          : [];
        setAircraft(aircraftList);
      } else {
        setAircraft([]);
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      showErrorToast('Failed to load form data');
      setStudents([]);
      setInstructors([]);
      setAircraft([]);
    } finally {
      setLoadingFormData(false);
    }
  };

  const filterSchedules = () => {
    if (!searchQuery.trim()) {
      setFilteredAircraftSchedule(aircraftSchedule);
      setFilteredUserSchedule(userSchedule);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filteredAircraft = aircraftSchedule.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.events?.some(event =>
        event.instructor?.name?.toLowerCase().includes(query) ||
        event.title?.toLowerCase().includes(query)
      )
    );

    const filteredUsers = userSchedule.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.events?.some(event =>
        event.instructor?.name?.toLowerCase().includes(query) ||
        event.aircraft?.name?.toLowerCase().includes(query) ||
        event.title?.toLowerCase().includes(query)
      )
    );

    setFilteredAircraftSchedule(filteredAircraft);
    setFilteredUserSchedule(filteredUsers);
  };

  const getWeekRange = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // End of week (Saturday)

    const formatDate = (date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getEventForCell = (item, hour) => {
    if (!item.events || item.events.length === 0) return null;
    
    // Find event that starts at this exact hour
    return item.events.find(event => {
      const eventHour = parseInt(event.start_time.split(':')[0]);
      return eventHour === hour;
    });
  };

  const getEventSpan = (event) => {
    if (!event) return 1;
    
    const startHour = parseInt(event.start_time.split(':')[0]);
    const startMin = parseInt(event.start_time.split(':')[1]);
    const endHour = parseInt(event.end_time.split(':')[0]);
    const endMin = parseInt(event.end_time.split(':')[1]);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    
    // Calculate how many time slots this event spans (each slot is 1 hour = 60 minutes)
    return Math.ceil(durationMinutes / 60);
  };

  const getEventColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-300', // Changed to light blue
      red: 'bg-red-300',
      'light-red': 'bg-red-200',
      orange: 'bg-orange-300',
      yellow: 'bg-yellow-400', // For requested status
      gray: 'bg-gray-300',
    };
    return colorMap[color] || 'bg-blue-300'; // Default to light blue
  };

  const handleEventHover = (event, e) => {
    if (event) {
      setHoveredEvent(event);
      setHoverPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleEventLeave = () => {
    setHoveredEvent(null);
  };

  const handleOrganizationChange = (e) => {
    setSelectedOrganizationId(e.target.value);
  };

  const handleEventClick = async (event) => {
    if (!event || !event.id) return;
    
    setLoadingReservation(true);
    setShowReservationDetailModal(true);
    try {
      // Use getReservation for calendar events (they are reservations)
      const response = await lessonService.getReservation(event.id);
      if (response.success) {
        setSelectedReservation(response.data);
      } else {
        showErrorToast('Failed to load reservation details');
        setShowReservationDetailModal(false);
      }
    } catch (err) {
      console.error('Error fetching reservation:', err);
      showErrorToast('Failed to load reservation details');
      setShowReservationDetailModal(false);
    } finally {
      setLoadingReservation(false);
    }
  };


  const fetchCalendarSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await calendarService.getSettings();
      if (response.success) {
        setCalendarSettings(response.data);
      }
    } catch (err) {
      console.error('Error fetching calendar settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await calendarService.updateSettings(calendarSettings);
      if (response.success) {
        showSuccessToast('Calendar settings saved successfully');
        setShowSettingsModal(false);
        await fetchOrganizations(); // Refresh organizations
      }
    } catch (err) {
      showErrorToast('Failed to save calendar settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !calendarSettings.custom_locations.includes(newLocation.trim())) {
      setCalendarSettings({
        ...calendarSettings,
        custom_locations: [...calendarSettings.custom_locations, newLocation.trim()],
      });
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location) => {
    setCalendarSettings({
      ...calendarSettings,
      custom_locations: calendarSettings.custom_locations.filter(loc => loc !== location),
    });
  };

  // Check availability before submitting
  const checkAvailability = async () => {
    if (!reservationForm.lesson_date || !reservationForm.lesson_time || !reservationForm.duration_minutes) {
      return;
    }

    if (!reservationForm.student_id && !reservationForm.instructor_id) {
      return;
    }

    setAvailabilityStatus(prev => ({ ...prev, checking: true }));
    setAvailabilityMessage('');

    try {
      const params = {
        date: reservationForm.lesson_date,
        duration: reservationForm.duration_minutes,
      };

      if (reservationForm.student_id) {
        params.student_id = reservationForm.student_id;
      }
      if (reservationForm.instructor_id) {
        params.instructor_id = reservationForm.instructor_id;
      }
      if (reservationForm.aircraft_id) {
        params.aircraft_id = reservationForm.aircraft_id;
      }

      // Ensure at least one resource is provided
      if (!params.student_id && !params.instructor_id && !params.aircraft_id) {
        setAvailabilityStatus(prev => ({ ...prev, checking: false }));
        setAvailabilityMessage('⚠️ Please select at least one resource (Student, Instructor, or Aircraft) to check availability.');
        return;
      }

      const response = await calendarService.getAvailableTimeSlots(params);
      
      if (response.success) {
        const selectedTime = reservationForm.lesson_time;
        const availableSlots = response.data.available_slots || [];
        
        // Check if selected time is in available slots
        const isTimeAvailable = availableSlots.some(slot => {
          const slotTime = slot.time.split(':');
          const selectedTimeParts = selectedTime.split(':');
          return slotTime[0] === selectedTimeParts[0] && slotTime[1] === selectedTimeParts[1];
        });

        // Check student availability (if we have student_id, we need to check their existing bookings)
        let studentAvailable = true;
        let bookedSlotInfo = null;
        
        if (reservationForm.student_id) {
          // Use cached studentBookings if available, otherwise fetch
          let eventsToCheck = studentBookings;
          
          if (eventsToCheck.length === 0) {
            // Fetch if not cached
            const scheduleRes = await calendarService.getSchedule({
              date: reservationForm.lesson_date,
            });
            
            if (scheduleRes.success) {
              const userSchedule = scheduleRes.data.user_schedule || [];
              const studentBookingsData = userSchedule.find(user => 
                user.id === parseInt(reservationForm.student_id)
              );
              
              if (studentBookingsData) {
                eventsToCheck = studentBookingsData.events || [];
                setStudentBookings(eventsToCheck);
              }
            }
          }
          
          if (eventsToCheck.length > 0) {
            const selectedDateTime = new Date(`${reservationForm.lesson_date}T${reservationForm.lesson_time}`);
            const endDateTime = new Date(selectedDateTime.getTime() + reservationForm.duration_minutes * 60000);
            
            const conflictingEvent = eventsToCheck.find(event => {
              const eventStart = new Date(`${event.date}T${event.start_time}`);
              const eventEnd = new Date(eventStart.getTime() + (event.duration || 60) * 60000);
              
              return (selectedDateTime < eventEnd && endDateTime > eventStart);
            });
            
            if (conflictingEvent) {
              studentAvailable = false;
              bookedSlotInfo = {
                start: conflictingEvent.start_time,
                end: conflictingEvent.end_time,
                title: conflictingEvent.title || 'Flight Lesson',
              };
            }
          }
        }

        setAvailabilityStatus({
          student: studentAvailable,
          instructor: isTimeAvailable,
          aircraft: isTimeAvailable,
          checking: false,
        });

        if (!isTimeAvailable) {
          setAvailabilityMessage('⚠️ Instructor or Aircraft is not available at this time. Please select a different time.');
        } else if (!studentAvailable) {
          const conflictMsg = bookedSlotInfo 
            ? `⚠️ You already have a booking at this time (${bookedSlotInfo.start} - ${bookedSlotInfo.end}: ${bookedSlotInfo.title}). Please select a different time.`
            : '⚠️ You are already booked at this time. Please select a different time.';
          setAvailabilityMessage(conflictMsg);
        } else {
          // Don't show success message in edit mode
          if (!isEditMode) {
          setAvailabilityMessage('✅ All selected resources are available at this time.');
          } else {
            setAvailabilityMessage('');
          }
        }
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setAvailabilityStatus(prev => ({ ...prev, checking: false }));
    }
  };

  // Check availability when form fields change (skip in edit mode)
  useEffect(() => {
    // Don't check availability in edit mode
    if (isEditMode) {
      setAvailabilityStatus({
        student: null,
        instructor: null,
        aircraft: null,
        checking: false,
      });
      setAvailabilityMessage('');
      return;
    }
    
    if (reservationForm.lesson_date && reservationForm.lesson_time && 
        reservationForm.duration_minutes && 
        (reservationForm.student_id || reservationForm.instructor_id)) {
      const timeoutId = setTimeout(() => {
        checkAvailability();
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setAvailabilityStatus({
        student: null,
        instructor: null,
        aircraft: null,
        checking: false,
      });
      setAvailabilityMessage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationForm.lesson_date, reservationForm.lesson_time, 
      reservationForm.duration_minutes, reservationForm.student_id, 
      reservationForm.instructor_id, reservationForm.aircraft_id, isEditMode]);

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    
    // Skip availability check in edit mode
    if (!isEditMode) {
    // Final availability check before submitting
    if (availabilityStatus.checking) {
      showErrorToast('Please wait while we check availability...');
      return;
    }

    if (availabilityStatus.instructor === false || availabilityStatus.student === false) {
      showErrorToast('Cannot create reservation: Selected time slot is not available. Please choose a different time.');
      return;
      }
    }

    // Only Admin and Super Admin can create lessons directly
    if (isStudent()) {
      showErrorToast('Only Admin can create lessons. Students can request sessions.');
      setSubmitting(false);
      return;
    }
    
    setSubmitting(true);
    try {
      const lessonData = {
        ...reservationForm,
        is_request: false,
        // Convert single IDs to arrays for many-to-many relationship
        student_ids: reservationForm.student_id ? [parseInt(reservationForm.student_id)] : [],
        instructor_ids: reservationForm.instructor_id ? [parseInt(reservationForm.instructor_id)] : [],
        // Convert lesson_template_id to integer if present
        lesson_template_id: reservationForm.lesson_template_id ? parseInt(reservationForm.lesson_template_id) : null,
      };
      
      // Remove old single ID fields
      delete lessonData.student_id;
      delete lessonData.instructor_id;
      
      let response;
      if (isEditMode && reservationForm.lesson_id) {
        // Prevent students from editing reservations
        if (isStudent()) {
          showErrorToast('Students cannot edit reservations');
          setSubmitting(false);
          return;
        }
        
        // Edit mode - update existing reservation using reservation endpoint
        const reservationId = parseInt(reservationForm.lesson_id);
        // Remove lesson_id from data before sending (it's in the URL)
        delete lessonData.lesson_id;
        response = await lessonService.updateReservation(reservationId, lessonData);
      } else {
        // Create mode - use createReservation endpoint for reservations
        // Remove lesson_id from data if creating new reservation (not linking to existing)
      if (!lessonData.lesson_id) {
        delete lessonData.lesson_id;
        }
        // Use createReservation for new reservations
        response = await lessonService.createReservation(lessonData);
      }
      
      if (response.success) {
        const successMessage = isEditMode
          ? 'Reservation updated successfully'
          : (isStudent() 
          ? 'Session request submitted successfully' 
            : 'Reservation created successfully');
        
        // Close modal immediately before any other operations
        setShowNewReservationModal(false);
        setIsEditMode(false);
        setEditingLesson(null);
        
        // Show success message
        showSuccessToast(successMessage);
        
        // Reset form state
        setReservationForm({
          student_id: '',
          instructor_id: '',
          aircraft_id: '',
          flight_type: '',
          lesson_id: '',
          lesson_template_id: '',
          lesson_date: '',
          lesson_time: '',
          duration_minutes: 60,
          notes: '',
          reservation_number: generateReservationNumber(),
        });
        setIsAircraftPreSelected(false);
        setAvailabilityStatus({
          student: null,
          instructor: null,
          aircraft: null,
          checking: false,
        });
        setAvailabilityMessage('');
        
        // Clean up URL params
        if (editLessonId) {
          searchParams.delete('edit');
        }
        if (modalOnly) {
          searchParams.delete('modal');
          // Navigate back to previous page if we came from reservation list
          if (window.history.length > 1) {
            window.history.back();
          } else {
          setSearchParams(searchParams);
        }
        } else {
          setSearchParams(searchParams);
        }
        
        // Refresh schedule to show updated/new reservation (after modal is closed)
        // Use setTimeout to ensure modal closes first, then refresh
        setTimeout(async () => {
        await fetchSchedule();
        }, 100);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.errors?.message || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to create reservation';
      showErrorToast(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    // If modalOnly, show minimal loading (modal will handle its own loading)
    if (modalOnly) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      );
    }
    return (
      <div className="w-full max-w-full px-2 sm:px-4 md:px-6 md:mt-5 mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8 sm:p-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Flight type options
  const flightTypes = [
    'Solo',
    'Duo Landing',
    'Windy Smooth landing',
    'Emergency',
    'Crash landing',
    'Night Flight',
    'Cross Country'
  ];

  return (
    <div className="w-full px-0 sm:px-2 md:px-4 lg:px-6 md:mt-5 mx-auto" style={{ overflowX: 'visible', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {!modalOnly && (
      <div className="bg-white shadow-sm rounded-lg w-full" style={{ overflowX: 'visible', width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 whitespace-nowrap">Schedule</h2>
          
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            {/* Action Buttons - Hidden for students */}
            {!isStudent() && (
              <>
            <button
              onClick={() => setShowFindTimeModal(true)}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Find Time
            </button>
            <button
              onClick={() => {
                setIsAircraftPreSelected(false);
                setShowNewReservationModal(true);
              }}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              New
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            >
              <FiSettings size={18} className="sm:w-5 sm:h-5 text-gray-600" />
            </button>
              </>
            )}
          </div>
          </div>
          
          {/* Second Row: Location and Date Navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            {/* Organization Select - Only visible for Super Admin */}
            {isSuperAdmin() && (
              <select
                value={selectedOrganizationId}
                onChange={handleOrganizationChange}
                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm w-full sm:w-auto sm:flex-shrink-0 sm:min-w-[140px]"
              >
                <option value="">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            )}

            {/* Date Navigation */}
            <div className="flex items-center gap-1 sm:gap-2 justify-between sm:justify-start flex-1 min-w-0">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                aria-label="Previous week"
              >
                <FiChevronLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center px-1 sm:px-2 flex-1 truncate">
                {getWeekRange()}
              </span>
              <button
                onClick={() => navigateWeek(1)}
                className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                aria-label="Next week"
              >
                <FiChevronRight size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Grid - Horizontal scrollbar at bottom */}
        <div 
          className="calendar-scroll-container" 
          style={{ 
            maxHeight: isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 180px)',
            minHeight: isMobile ? '200px' : '250px',
            overflowX: 'scroll',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            touchAction: 'pan-x pan-y',
            msOverflowStyle: 'scrollbar',
            scrollbarWidth: 'thin',
            /* Break out of flex constraints */
            minWidth: 0,
            flexShrink: 0,
            /* Ensure it can scroll */
            isolation: 'isolate'
          }}
        >
          <table className="border-collapse" style={{ 
            minWidth: isMobile ? '600px' : '800px',
            width: isMobile ? '600px' : '800px',
            display: 'table',
            margin: 0,
            tableLayout: 'auto',
            /* Force table to be wider than container to enable scroll */
            boxSizing: 'border-box'
          }}>
              {/* Time Header */}
              <thead className="sticky top-0 z-20 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 font-medium text-[10px] sm:text-xs md:text-sm text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-30" style={{ 
                    minWidth: isMobile ? '60px' : '80px', 
                    width: isMobile ? '60px' : '80px' 
                  }}>
                    {/* Empty for row labels */}
                  </th>
                  {timeSlots.map((slot, idx) => (
                    <th
                      key={idx}
                      className="text-center px-0.5 sm:px-1 md:px-2 py-1.5 sm:py-2 text-[9px] sm:text-[10px] md:text-xs text-gray-600 font-medium border-r border-gray-200 whitespace-nowrap"
                      style={{ 
                        minWidth: isMobile ? '30px' : '40px', 
                        width: isMobile ? '30px' : '40px' 
                      }}
                    >
                      {slot.hour === 0 ? '12a' : slot.hour < 12 ? `${slot.hour}a` : slot.hour === 12 ? '12p' : `${slot.hour - 12}p`}
                    </th>
                  ))}
                </tr>
              </thead>

            <tbody>
              {/* Search Row */}
              <tr className="border-b border-gray-200">
                <td className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 border-r border-gray-200 sticky left-0 bg-white z-30"                 style={{ 
                  minWidth: isMobile ? '60px' : '80px', 
                  width: isMobile ? '60px' : '80px' 
                }}>
                  <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
                    <FiSearch className="text-gray-400 flex-shrink-0" size={isMobile ? 12 : 14} />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-none outline-none text-[10px] sm:text-xs md:text-sm w-full bg-transparent text-gray-700 placeholder-gray-400"
                    />
                  </div>
                </td>
                {timeSlots.map((_, idx) => (
                  <td
                    key={idx}
                    className="border-r border-gray-200"
                    style={{ 
                      minWidth: isMobile ? '30px' : '40px', 
                      width: isMobile ? '30px' : '40px', 
                      height: isMobile ? '32px' : '40px' 
                    }}
                  ></td>
                ))}
              </tr>

              {/* Aircraft Transfer Schedule Section Header */}
              <tr className="border-b border-gray-200 bg-purple-50">
                <td className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 border-r border-gray-200 sticky left-0 bg-purple-50 z-30"                 style={{ 
                  minWidth: isMobile ? '60px' : '80px', 
                  width: isMobile ? '60px' : '80px' 
                }}>
                  <h3 className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-gray-800 leading-tight">Aircraft Schedule</h3>
                </td>
                {timeSlots.map((_, idx) => (
                  <td
                    key={idx}
                    className="text-center border-r border-gray-200 text-gray-400"
                    style={{ 
                      minWidth: isMobile ? '30px' : '40px', 
                      width: isMobile ? '30px' : '40px', 
                      height: isMobile ? '24px' : '32px' 
                    }}
                  >
                    –
                  </td>
                ))}
              </tr>

              {/* Aircraft Rows */}
              {filteredAircraftSchedule.map((aircraft) => (
                <tr key={aircraft.id} className="border-b border-gray-200 hover:bg-gray-50 relative">
                  <td className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 border-r border-gray-200 text-[10px] sm:text-xs md:text-sm text-gray-700 sticky left-0 bg-white z-30 font-medium"                 style={{ 
                  minWidth: isMobile ? '60px' : '80px', 
                  width: isMobile ? '60px' : '80px' 
                }}>
                    <span className="truncate block">{aircraft.name}</span>
                  </td>
                  {timeSlots.map((slot, idx) => {
                    const event = getEventForCell(aircraft, slot.hour);
                    const span = event ? getEventSpan(event) : 1;
                    const isFirstCell = event && slot.hour === parseInt(event.start_time.split(':')[0]);
                    
                    return (
                      <td
                        key={idx}
                        className="relative border-r border-gray-200 p-0"
                        style={{ 
                          minWidth: isMobile ? '30px' : '40px', 
                          width: isMobile ? '30px' : '40px', 
                          height: isMobile ? '32px' : '40px' 
                        }}
                        colSpan={isFirstCell ? span : undefined}
                      >
                        {isFirstCell && (
                          <div
                            className={`absolute left-0 right-0 top-0.5 bottom-0.5 rounded text-white px-0.5 sm:px-1 py-0.5 cursor-pointer z-0 flex items-center ${getEventColor(event.color)}`}
                            style={{ width: '95%' }}
                          >
                            <div className="font-medium truncate text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs">{event.start_time}</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Divider line between Aircraft and Instructor sections */}
              {filteredAircraftSchedule.length > 0 && filteredUserSchedule.length > 0 && (
                <tr className="border-b border-dashed border-gray-300 bg-purple-50">
                  <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-2.5 border-r border-gray-200 sticky left-0 bg-purple-50 z-30" style={{ 
                    minWidth: isMobile ? '60px' : '80px', 
                    width: isMobile ? '60px' : '80px' 
                  }}>
                  </td>
                  {timeSlots.map((_, idx) => (
                    <td
                      key={idx}
                      className="border-r border-gray-200 bg-purple-50"
                      style={{ 
                        minWidth: isMobile ? '30px' : '40px', 
                        width: isMobile ? '30px' : '40px', 
                        height: isMobile ? '4px' : '5px',
                        borderTop: '1px dashed #d1d5db',
                        borderBottom: '1px dashed #d1d5db'
                      }}
                    >
                    </td>
                  ))}
                </tr>
              )}

              {/* User Schedule Rows */}
              {filteredUserSchedule.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 relative">
                  <td className="px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 border-r border-gray-200 text-[10px] sm:text-xs md:text-sm text-gray-700 sticky left-0 bg-white z-30 font-medium"                 style={{ 
                  minWidth: isMobile ? '60px' : '80px', 
                  width: isMobile ? '60px' : '80px' 
                }}>
                    <span className="truncate block">{user.name}</span>
                  </td>
                  {timeSlots.map((slot, idx) => {
                    const event = getEventForCell(user, slot.hour);
                    const span = event ? getEventSpan(event) : 1;
                    const isFirstCell = event && slot.hour === parseInt(event.start_time.split(':')[0]);
                    
                    return (
                      <td
                        key={idx}
                        className="relative border-r border-gray-200 p-0"
                        style={{ 
                          minWidth: isMobile ? '30px' : '40px', 
                          width: isMobile ? '30px' : '40px', 
                          height: isMobile ? '32px' : '40px' 
                        }}
                        colSpan={isFirstCell ? span : undefined}
                      >
                        {isFirstCell && (
                          <div
                            className={`absolute left-0 right-0 top-0.5 bottom-0.5 rounded text-white px-0.5 sm:px-1 py-0.5 cursor-pointer z-0 flex items-center ${getEventColor(event.color)}`}
                            style={{ width: '95%' }}
                            onMouseEnter={(e) => handleEventHover(event, e)}
                            onMouseLeave={handleEventLeave}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="font-medium truncate text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs">{event.start_time}</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Tooltip */}
      {hoveredEvent && (
        <div
          ref={tooltipRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 pointer-events-none"
          style={{
            left: `${hoverPosition.x + 10}px`,
            top: `${hoverPosition.y + 10}px`,
            maxWidth: '250px',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
              {hoveredEvent.instructor?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-medium text-sm text-gray-800">
                {hoveredEvent.instructor?.name || 'Unknown'}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600">{hoveredEvent.description || 'No description'}</p>
          <div className="mt-2 text-xs text-gray-500">
            {hoveredEvent.date && (
              <div className="mb-1 font-medium text-gray-700">
                {new Date(hoveredEvent.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            )}
            <div>
              {hoveredEvent.start_time} - {hoveredEvent.end_time}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Calendar Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {loadingSettings ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Time Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                    <select
                      value={calendarSettings.time_format}
                      onChange={(e) => setCalendarSettings({ ...calendarSettings, time_format: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="12h">12 Hour (AM/PM)</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>

                  {/* Working Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours Start</label>
                      <input
                        type="time"
                        value={calendarSettings.working_hours_start}
                        onChange={(e) => setCalendarSettings({ ...calendarSettings, working_hours_start: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours End</label>
                      <input
                        type="time"
                        value={calendarSettings.working_hours_end}
                        onChange={(e) => setCalendarSettings({ ...calendarSettings, working_hours_end: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Show Weekends */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show_weekends"
                      checked={calendarSettings.show_weekends}
                      onChange={(e) => setCalendarSettings({ ...calendarSettings, show_weekends: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="show_weekends" className="text-sm font-medium text-gray-700">
                      Show Weekends
                    </label>
                  </div>

                  {/* Custom Locations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Locations</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                        placeholder="Enter location name"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddLocation}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {calendarSettings.custom_locations.map((location, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{location}</span>
                          <button
                            onClick={() => handleRemoveLocation(location)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {calendarSettings.custom_locations.length === 0 && (
                        <p className="text-sm text-gray-500">No custom locations added</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Detail Modal */}
      {showReservationDetailModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {loadingReservation ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedReservation ? (
              <>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedReservation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedReservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedReservation.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedReservation.status?.charAt(0).toUpperCase() + selectedReservation.status?.slice(1) || 'Pending'}
                      </span>
                      <h3 className="text-2xl font-semibold text-gray-800">Reservation</h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowReservationDetailModal(false);
                        setSelectedReservation(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FiX size={24} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm border-t border-dashed border-gray-300 pt-4">
                    <div>
                      <p className="text-gray-500 mb-1">Issued</p>
                      <p className="font-medium text-gray-800">{selectedReservation.issued_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Due Date</p>
                      <p className="font-medium text-gray-800">{selectedReservation.due_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Reservation No.</p>
                      <p className="font-medium text-gray-800">{selectedReservation.reservation_no}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div className="border-b border-dashed border-gray-300 pb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Title</label>
                    <input
                      type="text"
                      value={selectedReservation.title}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-800"
                    />
                  </div>

                  {/* Student and Instructor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-b border-dashed border-gray-300 pb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Student:</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">{selectedReservation.customer?.name}</span></p>
                        <p><span className="text-gray-500">Flight:</span> <span className="font-medium text-gray-800">{selectedReservation.customer?.flight}</span></p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Instructor:</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">{selectedReservation.instructor?.name}</span></p>
                        <p><span className="text-gray-500">Aircraft:</span> <span className="font-medium text-gray-800">{selectedReservation.instructor?.aircraft}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                    <textarea
                      value={selectedReservation.description || 'In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface'}
                      readOnly
                      rows="6"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-800 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowReservationDetailModal(false);
                      setSelectedReservation(null);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Close
                  </button>
                  {/* Hide Edit button for students */}
                  {!isStudent() && (
                    <button
                      onClick={() => {
                        // Close detail modal
                        setShowReservationDetailModal(false);
                        // Set edit mode and open edit form
                        if (selectedReservation?.id) {
                          setSearchParams({ edit: selectedReservation.id });
                        }
                        setSelectedReservation(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* New Reservation Modal */}
      {showNewReservationModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                {isEditMode ? 'Edit Reservation' : 'New Reservation'}
              </h3>
              <button
                onClick={() => {
                  setShowNewReservationModal(false);
                  setIsEditMode(false);
                  setEditingLesson(null);
                  if (editLessonId) {
                    searchParams.delete('edit');
                  }
                  if (modalOnly) {
                    searchParams.delete('modal');
                    // Navigate back to previous page if we came from reservation list
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      setSearchParams(searchParams);
                    }
                  } else {
                    setSearchParams(searchParams);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleReservationSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                  {loadingFormData ? (
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                      Loading students...
                    </div>
                  ) : (
                    <select
                      value={reservationForm.student_id}
                      onChange={(e) => setReservationForm({ ...reservationForm, student_id: e.target.value })}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isStudent() ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      required
                      disabled={isStudent()}
                    >
                      <option value="">Select Student</option>
                      {students.length > 0 ? (
                        students.map((student) => (
                          <option key={student.id} value={String(student.id)}>{student.name || student.email}</option>
                        ))
                      ) : (
                        <option value="" disabled>No students available</option>
                      )}
                    </select>
                  )}
                  {isStudent() && (
                    <p className="text-xs text-gray-500 mt-1">You can only create reservations for yourself</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                  {loadingFormData ? (
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                      Loading instructors...
                    </div>
                  ) : (
                    <select
                      value={reservationForm.instructor_id}
                      onChange={(e) => setReservationForm({ ...reservationForm, instructor_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Instructor</option>
                      {instructors.length > 0 ? (
                        instructors.map((instructor) => (
                          <option key={instructor.id} value={String(instructor.id)}>{instructor.name || instructor.email}</option>
                        ))
                      ) : (
                        <option value="" disabled>No instructors available</option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aircraft
                    {isAircraftPreSelected && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">(Pre-selected from aircraft profile - You can change it)</span>
                    )}
                    {!isAircraftPreSelected && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                    )}
                  </label>
                  {loadingFormData ? (
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                      Loading aircraft...
                    </div>
                  ) : (
                    <select
                      value={reservationForm.aircraft_id}
                      onChange={(e) => setReservationForm({ ...reservationForm, aircraft_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition"
                      title="Select an aircraft (optional - you can change the pre-selected one)"
                    >
                      <option value="">Select Aircraft (Optional)</option>
                      {aircraft.length > 0 ? (
                        aircraft.map((ac) => (
                          <option key={ac.id} value={String(ac.id)}>{ac.name} {ac.model ? `(${ac.model})` : ''}</option>
                        ))
                      ) : (
                        <option value="" disabled>No aircraft available</option>
                      )}
                    </select>
                  )}
                  {isAircraftPreSelected && (
                    <p className="mt-1 text-xs text-blue-600">
                      ✓ Aircraft pre-selected from aircraft profile. You can change it if needed.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reservation Number</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reservationForm.reservation_number}
                      onChange={(e) => setReservationForm({ ...reservationForm, reservation_number: e.target.value.toUpperCase() })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Auto-generated"
                      maxLength={10}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setReservationForm({ ...reservationForm, reservation_number: generateReservationNumber() })}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                      title="Generate new number"
                    >
                      Regenerate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">10 characters (auto-generated, can be changed)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Lesson (Optional)</label>
                  {loadingLessonTemplates ? (
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                      Loading lesson templates...
                    </div>
                  ) : (
                    <select
                      value={reservationForm.lesson_template_id}
                      onChange={(e) => {
                        const selectedTemplateId = e.target.value;
                        if (selectedTemplateId) {
                          const selectedTemplate = lessonTemplates.find(t => t.id === parseInt(selectedTemplateId));
                          if (selectedTemplate) {
                            setReservationForm({
                              ...reservationForm,
                              lesson_template_id: selectedTemplateId,
                            });
                          }
                        } else {
                          setReservationForm({ ...reservationForm, lesson_template_id: '' });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">None - No Lesson Template</option>
                      {lessonTemplates.map((template) => {
                        const templateDisplay = template.lesson_title 
                          ? (template.lesson_number ? `Lesson ${template.lesson_number}: ${template.lesson_title}` : template.lesson_title)
                          : (template.lesson_number ? `Lesson ${template.lesson_number}` : 'Untitled Lesson');
                        return (
                          <option key={template.id} value={template.id}>
                            {templateDisplay}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Select a lesson template to attach to this reservation</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flight Type</label>
                  <select
                    value={reservationForm.flight_type}
                    onChange={(e) => setReservationForm({ ...reservationForm, flight_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Select Flight Type</option>
                    {flightTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={reservationForm.lesson_date}
                      onChange={(e) => setReservationForm({ ...reservationForm, lesson_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={reservationForm.lesson_time}
                      onChange={(e) => {
                        setReservationForm({ ...reservationForm, lesson_time: e.target.value });
                        // Clear availability status when time changes
                        setAvailabilityStatus({
                          student: null,
                          instructor: null,
                          aircraft: null,
                          checking: false,
                        });
                        setAvailabilityMessage('');
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        availabilityStatus.student === false 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      required
                    />
                    {isStudent() && studentBookings.length > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-800 mb-1">Your existing bookings on this date:</p>
                        <div className="space-y-1">
                          {studentBookings.map((booking, idx) => (
                            <p key={idx} className="text-xs text-blue-700">
                              • {booking.start_time} - {booking.end_time}: {booking.title || 'Flight Lesson'}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={reservationForm.duration_minutes}
                    onChange={(e) => setReservationForm({ ...reservationForm, duration_minutes: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="15"
                    max="480"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={reservationForm.notes}
                    onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                {/* Availability Status - Hidden in edit mode */}
                {!isEditMode && (
                  <>
                {availabilityStatus.checking && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-700">Checking availability...</p>
                  </div>
                )}

                {availabilityMessage && !availabilityStatus.checking && (
                  <div className={`p-3 rounded-lg border ${
                    availabilityMessage.includes('✅') 
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  }`}>
                    <p className="text-sm font-medium">{availabilityMessage}</p>
                  </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewReservationModal(false);
                    setIsEditMode(false);
                    setEditingLesson(null);
                    if (editLessonId) {
                      searchParams.delete('edit');
                    }
                    if (modalOnly) {
                      searchParams.delete('modal');
                      // Navigate back to previous page if we came from reservation list
                      if (window.history.length > 1) {
                        window.history.back();
                      } else {
                        setSearchParams(searchParams);
                      }
                    } else {
                      setSearchParams(searchParams);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!isEditMode && (availabilityStatus.checking || 
                           availabilityStatus.instructor === false || 
                           availabilityStatus.student === false))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : 
                   (!isEditMode && availabilityStatus.checking) ? 'Checking...' :
                   (!isEditMode && (availabilityStatus.instructor === false || availabilityStatus.student === false)) 
                     ? 'Time Not Available' : 
                   (isEditMode ? 'Update Reservation' : 'Create Reservation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Find a Time Modal */}
      {showFindTimeModal && (
        <FindTimeModal
          isOpen={showFindTimeModal}
          onClose={() => setShowFindTimeModal(false)}
          students={students}
          instructors={instructors}
          aircraft={aircraft}
          loadingFormData={loadingFormData}
          onTimeSelect={(selectedTime, date, studentId, instructorId, aircraftId, duration) => {
            setShowFindTimeModal(false);
            setIsAircraftPreSelected(!!aircraftId);
            setShowNewReservationModal(true);
            setTimeout(() => {
              setReservationForm(prev => ({
                ...prev,
                lesson_date: date,
                lesson_time: selectedTime,
                duration_minutes: duration,
                ...(studentId && { student_id: String(studentId) }),
                ...(instructorId && { instructor_id: String(instructorId) }),
                ...(aircraftId && { aircraft_id: String(aircraftId) }),
              }));
            }, 100);
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
