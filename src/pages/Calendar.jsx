import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiSettings, FiX, FiCheck } from 'react-icons/fi';
import { calendarService } from '../api/services/calendarService';
import { lessonService } from '../api/services/lessonService';
import { userService } from '../api/services/userService';
import { organizationService } from '../api/services/organizationService';
import { locationService } from '../api/services/locationService';
import { showErrorToast, showSuccessToast } from '../utils/notifications';
import { safeDisplay } from '../utils/safeDisplay';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { api } from '../api/apiClient';
import { ENDPOINTS } from '../api/config';
import FindTimeModal from '../components/Calendar/FindTimeModal';
import { FLIGHT_TYPES } from '../config/flightTypes';

const pad2 = (n) => String(n).padStart(2, '0');

const parseTimeParts = (t) => {
  if (t === undefined || t === null || t === '') return [0, 0];
  const parts = String(t).split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? 0, 10);
  return [Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m];
};

const eventStartEndMs = (event) => {
  const [sh, sm] = parseTimeParts(event.start_time);
  const startDate = (event.date || '').toString().slice(0, 10);
  const start = new Date(`${startDate}T${pad2(sh)}:${pad2(sm)}:00`);
  
  // Use duration_minutes from backend if available, default to 60 mins
  const duration = parseInt(event.duration_minutes || 60, 10);
  const end = new Date(start.getTime() + duration * 60000);
  
  return { 
    start, 
    end, 
    startMs: start.getTime(), 
    endMs: end.getTime() 
  };
};

const eventOverlapsCalendarDay = (event, dateStr) => {
  const { startMs, endMs } = eventStartEndMs(event);
  const dayStart = new Date(`${dateStr}T00:00:00`).getTime();
  const dayEnd = new Date(`${dateStr}T23:59:59.999`).getTime();
  return startMs <= dayEnd && endMs >= dayStart;
};

const portionOnDayMs = (event, dateStr) => {
  const { startMs, endMs } = eventStartEndMs(event);
  const dayStart = new Date(`${dateStr}T00:00:00`).getTime();
  const dayEnd = dayStart + 86400000; // Exactly 24 hours later
  const segStart = Math.max(startMs, dayStart);
  const segEnd = Math.min(endMs, dayEnd);
  if (segEnd <= segStart) return null;
  return { segStart, segEnd };
};

const firstVisibleHourOnDay = (event, dateStr) => {
  const p = portionOnDayMs(event, dateStr);
  if (!p) return null;
  return new Date(p.segStart).getHours();
};

const getEventForCellHour = (item, hour, dateStr) => {
  if (!item.events || item.events.length === 0) return null;
  const hourStart = new Date(`${dateStr}T${pad2(hour)}:00:00`).getTime();
  const hourEnd = new Date(`${dateStr}T${pad2(hour)}:59:59.999`).getTime();
  const matches = item.events.filter((e) => {
    if (!eventOverlapsCalendarDay(e, dateStr)) return false;
    const p = portionOnDayMs(e, dateStr);
    if (!p) return false;
    return p.segStart < hourEnd && p.segEnd > hourStart;
  });
  if (matches.length === 0) return null;
  return matches.sort((a, b) => eventStartEndMs(a).startMs - eventStartEndMs(b).startMs)[0];
};

const getEventSpanHours = (event, dateStr) => {
  const p = portionOnDayMs(event, dateStr);
  if (!p) return 1;
  const durationMin = Math.max(1, Math.ceil((p.segEnd - p.segStart) / 60000));
  return Math.min(24, Math.max(1, Math.ceil(durationMin / 60)));
};

const Calendar = () => {
  const { user } = useAuth();
  const { isStudent, isSuperAdmin } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editLessonId = searchParams.get('edit');
  const modalOnly = searchParams.get('modal') === 'true'; // If true, only show modal, hide calendar
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [aircraftSchedule, setAircraftSchedule] = useState([]);
  const [userSchedule, setUserSchedule] = useState([]);
  const [filteredAircraftSchedule, setFilteredAircraftSchedule] = useState([]);
  const [filteredUserSchedule, setFilteredUserSchedule] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState('day'); // 'week' | 'day' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
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
  const [selectedCalendarLocationId, setSelectedCalendarLocationId] = useState('');

  const [calendarSettings, setCalendarSettings] = useState({
    time_format: '12h',
    default_view: 'day',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    show_weekends: true,
    time_slot_interval: 60,
    custom_locations: [],
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form states
  const [reservationForm, setReservationForm] = useState({
    student_id: '',
    instructor_id: '',
    aircraft_id: '',
    location_id: '',
    flight_type: '',
    lesson_id: '',
    lesson_template_id: '',
    lesson_date: '',
    lesson_time: '',
    duration_minutes: 60,
    notes: '',
    reservation_number: '',
    acting_pic_user_id: '', // Acting PIC: Student or Instructor (certificate-based default)
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
  const [locationsList, setLocationsList] = useState([]);
  const [allLocations, setAllLocations] = useState([]); // All org locations for the header filter
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

  const timeSlots = useMemo(() => {
    const fmt24 = (hour) => `${pad2(hour)}:00`;
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      let label;
      if (calendarSettings.time_format === '24h') {
        label = fmt24(hour);
      } else {
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        const suf = hour < 12 ? 'am' : 'pm';
        label = `${h12} ${suf}`;
      }
      return { hour, label };
    });
  }, [calendarSettings.time_format]);

  const formatEventTimeForDisplay = (timeStr) => {
    const [h, m] = parseTimeParts(timeStr);
    if (calendarSettings.time_format === '24h') {
      return `${pad2(h)}:${pad2(m)}`;
    }
    const suf = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad2(m)} ${suf}`;
  };

  const normalizeTimeKey = (t) => {
    const [h, m] = parseTimeParts(t);
    return `${pad2(h)}:${pad2(m)}`;
  };

  // Fetch organizations only once on mount
  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all locations on mount for the header location filter dropdown
  useEffect(() => {
    const loadHeaderLocations = async () => {
      try {
        const res = await locationService.getLocations();
        if (res.success && Array.isArray(res.data)) {
          const locs = res.data.filter(l => l.id != null);
          // Only pre-populate if not already loaded (fetchFormData may overwrite with more)
          setAllLocations(locs);
          setLocationsList(prev => (prev.length > 0 ? prev : locs));
        }
      } catch (e) {
        console.error('Failed to load header locations:', e);
      }
    };
    loadHeaderLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch schedule when date, organization, view mode, or custom range changes
  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, selectedOrganizationId, calendarViewMode, customStartDate, customEndDate, selectedCalendarLocationId]);

  useEffect(() => {
    setFilteredAircraftSchedule(aircraftSchedule);
    setFilteredUserSchedule(userSchedule);
  }, [aircraftSchedule, userSchedule]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await calendarService.getSettings();
        if (res.success && res.data) {
          setCalendarSettings((prev) => ({ ...prev, ...res.data }));
          const dv = res.data.default_view;
          if (dv === 'day' || dv === 'week') {
            setCalendarViewMode(dv);
          } else if (dv === 'month') {
            setCalendarViewMode('week');
          }
        }
      } catch (e) {
        console.error('Calendar settings bootstrap', e);
      }
    };
    bootstrap();
  }, []);

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
              
              const firstStudentFromData = lessonData.students?.[0];
              const suggestedPIC = lessonData.acting_pic_user_id
                ? String(lessonData.acting_pic_user_id)
                : (firstStudentFromData?.certificate_level && ['Private', 'Commercial', 'ATP'].includes(firstStudentFromData.certificate_level)
                  ? studentIdValue
                  : instructorIdValue) || '';
              const locationIdValue = lessonData.location?.id != null ? String(lessonData.location.id) : (lessonData.location_id ? String(lessonData.location_id) : '');
              setReservationForm({
                student_id: studentIdValue,
                instructor_id: instructorIdValue,
                aircraft_id: aircraftIdValue,
                location_id: locationIdValue,
                flight_type: lessonData.flight_type || '',
                lesson_id: lessonData.id ? String(lessonData.id) : '',
                lesson_template_id: lessonData.lesson_template_id ? String(lessonData.lesson_template_id) : '',
                lesson_date: lessonData.lesson_date || '',
                lesson_time: lessonData.lesson_time || '',
                duration_minutes: lessonData.duration_minutes || 60,
                notes: lessonData.notes || lessonData.description || '',
                reservation_number: lessonData.reservation_number || lessonData.reservation_no || generateReservationNumber(),
                acting_pic_user_id: suggestedPIC,
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
      const suggestedPIC = editingLesson.acting_pic_user_id
        ? String(editingLesson.acting_pic_user_id)
        : (firstStudent?.certificate_level && ['Private', 'Commercial', 'ATP'].includes(firstStudent.certificate_level))
          ? studentIdStr
          : instructorIdStr;
      const locationIdStr = editingLesson.location?.id != null ? String(editingLesson.location.id) : (editingLesson.location_id ? String(editingLesson.location_id) : '');
      // Always update to ensure dropdowns are properly selected
      setReservationForm(prev => ({
        ...prev,
        student_id: studentIdStr || prev.student_id,
        instructor_id: instructorIdStr || prev.instructor_id,
        aircraft_id: aircraftId || prev.aircraft_id,
        location_id: locationIdStr || prev.location_id,
        flight_type: editingLesson.flight_type || prev.flight_type,
        lesson_id: editingLesson.id ? String(editingLesson.id) : prev.lesson_id,
        lesson_date: editingLesson.lesson_date || prev.lesson_date,
        lesson_time: editingLesson.lesson_time || prev.lesson_time,
        duration_minutes: editingLesson.duration_minutes || prev.duration_minutes,
        notes: editingLesson.notes || editingLesson.description || prev.notes,
        reservation_number: editingLesson.reservation_number || editingLesson.reservation_no || prev.reservation_number,
        acting_pic_user_id: suggestedPIC || prev.acting_pic_user_id,
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
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatDateStr = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      let startDateStr, endDateStr;
      if (calendarViewMode === 'day') {
        startDateStr = formatDateStr(currentDate);
        endDateStr = startDateStr;
      } else if (calendarViewMode === 'custom') {
        startDateStr = customStartDate;
        endDateStr = customEndDate;
        if (startDateStr > endDateStr) {
          const swap = startDateStr;
          startDateStr = endDateStr;
          endDateStr = swap;
        }
      } else {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        startDateStr = formatDateStr(start);
        endDateStr = formatDateStr(end);
      }
      
      const scheduleParams = {
        start_date: startDateStr,
        end_date: endDateStr,
        organization_id: selectedOrganizationId || undefined,
      };
      const locId = selectedCalendarLocationId ? parseInt(selectedCalendarLocationId, 10) : NaN;
      if (!Number.isNaN(locId) && locId > 0) {
        scheduleParams.location_id = locId;
      }
      const response = await calendarService.getSchedule(scheduleParams);

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
      const [studentsRes, instructorsRes, aircraftRes, locationsRes, settingsRes] = await Promise.all([
        userService.getUsers({ role: 'Student', per_page: 100 }),
        userService.getUsers({ role: 'Instructor', per_page: 100 }),
        api.get(ENDPOINTS.AIRCRAFT.LIST, { params: { per_page: 100 } }).catch(err => {
          console.error('Error fetching aircraft:', err);
          return { success: false, data: [] };
        }),
        locationService.getLocations().catch(err => {
          console.error('Error fetching locations:', err);
          return { success: false, data: [] };
        }),
        calendarService.getSettings().catch(() => ({ success: false, data: {} })),
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

      // Merge API locations with calendar settings custom_locations (so both show in reservation dropdown)
      const apiLocationsRaw = (locationsRes.success && Array.isArray(locationsRes.data)) ? locationsRes.data : [];
      const customLocationNames = (settingsRes?.success && Array.isArray(settingsRes?.data?.custom_locations)) ? settingsRes.data.custom_locations : [];
      // Normalize: items with id null are custom (from calendar settings) – use id "new:Name" so submit can create them
      const apiLocationsMapped = apiLocationsRaw.map(loc => {
        const name = (loc.name || '').trim();
        if (name && (loc.id == null || loc.id === undefined))
          return { id: `new:${name}`, name, address: loc.address || '', isCustom: true };
        return { ...loc, name: loc.name || '', address: loc.address || '' };
      });
      // Deduplicate API locations by name (case-insensitive) to handle duplicate entries in API response
      const seenNames = new Set();
      const apiLocations = apiLocationsMapped.filter(loc => {
        const key = (loc.name || '').trim().toLowerCase();
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      });
      // Only include custom locations whose names aren't already present in the API locations
      const customOnly = customLocationNames
        .filter(name => name && typeof name === 'string' && !seenNames.has(name.trim().toLowerCase()))
        .map(name => ({ id: `new:${name.trim()}`, name: name.trim(), address: '', isCustom: true }));
      setAllLocations([...apiLocations].filter(l => l.id != null && !String(l.id).startsWith('new:')));
      setLocationsList([...apiLocations, ...customOnly]);
    } catch (err) {
      console.error('Error fetching form data:', err);
      showErrorToast('Failed to load form data');
      setStudents([]);
      setInstructors([]);
      setAircraft([]);
      setLocationsList([]);
    } finally {
      setLoadingFormData(false);
    }
  };

  const getDisplayDates = () => {
    if (calendarViewMode === 'day') {
      return [new Date(currentDate)];
    }
    if (calendarViewMode === 'custom') {
      let start = new Date(customStartDate);
      let end = new Date(customEndDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      if (start > end) {
        const swap = start;
        start = end;
        end = swap;
      }
      const days = [];
      const maxDays = 31;
      const d = new Date(start);
      while (d <= end && days.length < maxDays) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      return days;
    }
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const getDateRangeLabel = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fmt = (date) => `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    if (calendarViewMode === 'day') {
      return fmt(new Date(currentDate));
    }
    if (calendarViewMode === 'custom') {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      if (start > end) return `${fmt(end)} - ${fmt(start)}`;
      return start.getTime() === end.getTime() ? fmt(start) : `${fmt(start)} - ${fmt(end)}`;
    }
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const getEventsForDay = (item, dateStr) => {
    if (!item.events || item.events.length === 0) return [];
    return item.events
      .filter((e) => eventOverlapsCalendarDay(e, dateStr))
      .sort((a, b) => eventStartEndMs(a).startMs - eventStartEndMs(b).startMs);
  };

  const getEventColor = (event, itemType = null) => {
    const activityType = event?.flight_type || event?.title;
    
    if (activityType && calendarSettings?.activity_colors) {
      const matchedKey = Object.keys(calendarSettings.activity_colors).find(
        key => key.trim().toLowerCase() === activityType.trim().toLowerCase()
      );

      if (matchedKey) {
        const actColor = calendarSettings.activity_colors[matchedKey];
        const customColorMap = {
          slate: 'bg-slate-100 border-slate-300 text-slate-800 shadow-sm',
          gray: 'bg-gray-100 border-gray-300 text-gray-800 shadow-sm',
          zinc: 'bg-zinc-100 border-zinc-300 text-zinc-800 shadow-sm',
          red: 'bg-red-100 border-red-300 text-red-800 shadow-sm',
          orange: 'bg-orange-100 border-orange-300 text-orange-800 shadow-sm',
          amber: 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm',
          yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900 shadow-sm',
          lime: 'bg-lime-100 border-lime-300 text-lime-900 shadow-sm',
          green: 'bg-green-100 border-green-300 text-green-800 shadow-sm',
          emerald: 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm',
          teal: 'bg-teal-100 border-teal-300 text-teal-800 shadow-sm',
          cyan: 'bg-cyan-100 border-cyan-300 text-cyan-800 shadow-sm',
          sky: 'bg-sky-100 border-sky-300 text-sky-800 shadow-sm',
          blue: 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm',
          indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800 shadow-sm',
          violet: 'bg-violet-100 border-violet-300 text-violet-800 shadow-sm',
          purple: 'bg-purple-100 border-purple-300 text-purple-800 shadow-sm',
          fuchsia: 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800 shadow-sm',
          pink: 'bg-pink-100 border-pink-300 text-pink-800 shadow-sm',
          rose: 'bg-rose-100 border-rose-300 text-rose-800 shadow-sm',
          black: 'bg-gray-800 border-black text-white shadow-sm',
        };
        if (customColorMap[actColor]) return customColorMap[actColor];
      }
    }

    const color = event?.color || event;
    // Priority 1: Special Status colors (regardless of resource)
    if (color === 'red' || color === 'light-red') return 'bg-red-100 border-red-200 text-red-800';
    if (color === 'yellow') return 'bg-yellow-100 border-yellow-200 text-yellow-900';
    if (color === 'orange') return 'bg-orange-100 border-orange-200 text-orange-800';
    if (color === 'gray') return 'bg-gray-100 border-gray-200 text-gray-800';

    // Priority 2: Resource-specific colors
    if (itemType === 'aircraft') {
      return 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm';
    }
    if (itemType === 'instructor') {
      return 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm';
    }

    // Fallback
    const colorMap = {
      blue: 'bg-blue-100 border-blue-300 text-blue-800',
      red: 'bg-red-100 border-red-300 text-red-800',
      'light-red': 'bg-red-50 border-red-200 text-red-700',
      orange: 'bg-orange-100 border-orange-300 text-orange-800',
      yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
      gray: 'bg-gray-100 border-gray-300 text-gray-800',
    };
    return colorMap[color] || 'bg-blue-100 border-blue-300 text-blue-800';
  };

  const handleEventHover = (event, e, context = null) => {
    if (event) {
      setHoveredEvent({ ...event, hoverContext: context });
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
      // Check if event is a reservation or a lesson
      const isReservation = event.is_reservation === true;
      
      let response;
      if (isReservation) {
        // Fetch reservation details
        response = await lessonService.getReservation(event.id);
      } else {
        // Fetch lesson details
        response = await lessonService.getLesson(event.id);
      }
      
      if (response.success) {
        setSelectedReservation(response.data);
      } else {
        showErrorToast(`Failed to load ${isReservation ? 'reservation' : 'lesson'} details`);
        setShowReservationDetailModal(false);
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      showErrorToast('Failed to load event details');
      setShowReservationDetailModal(false);
    } finally {
      setLoadingReservation(false);
    }
  };


  const fetchCalendarSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await calendarService.getSettings();
      if (response.success && response.data) {
        // merge: keep existing defaults for any key not returned by API
        setCalendarSettings(prev => ({ ...prev, ...response.data }));
        // also sync the view mode if default_view is in saved settings
        const dv = response.data.default_view;
        if (dv === 'day' || dv === 'week') {
          setCalendarViewMode(dv);
        } else if (dv === 'month') {
          setCalendarViewMode('week');
        }
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
        const saved = response.data || calendarSettings;
        setCalendarSettings((prev) => ({ ...prev, ...saved }));
        const dv = saved.default_view;
        if (dv === 'day' || dv === 'week') {
          setCalendarViewMode(dv);
        } else if (dv === 'month') {
          setCalendarViewMode('week');
        }
        setShowSettingsModal(false);
        await fetchOrganizations(); // Refresh organizations
      }
    } catch (err) {
      showErrorToast('Failed to save calendar settings');
    } finally {
      setSavingSettings(false);
    }
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
        const selectedKey = normalizeTimeKey(selectedTime);
        const isTimeAvailable = availableSlots.some((slot) => {
          const slotKey = normalizeTimeKey(slot.time);
          return slotKey === selectedKey;
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
            const selectedDateTime = new Date(`${reservationForm.lesson_date}T${normalizeTimeKey(reservationForm.lesson_time)}:00`);
            const endDateTime = new Date(selectedDateTime.getTime() + reservationForm.duration_minutes * 60000);
            
            const conflictingEvent = eventsToCheck.find((event) => {
              const { startMs, endMs } = eventStartEndMs(event);
              const selStart = selectedDateTime.getTime();
              const selEnd = endDateTime.getTime();
              return selStart < endMs && selEnd > startMs;
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

    // Location is required for reservations
    if (!reservationForm.location_id || String(reservationForm.location_id).trim() === '') {
      showErrorToast('Please select a location.');
      return;
    }
    
    setSubmitting(true);
    try {
      // If user selected a custom location (from calendar settings), create it in locations table first
      let locationId = reservationForm.location_id ? parseInt(reservationForm.location_id, 10) : null;
      const locIdStr = String(reservationForm.location_id || '');
      if (locIdStr.startsWith('new:')) {
        const customName = locIdStr.replace(/^new:/, '').trim();
        const createLocRes = await locationService.createLocation({ name: customName, address: '' });
        if (!createLocRes.success || !createLocRes.data?.id) {
          showErrorToast(createLocRes?.errors?.message || 'Failed to create location.');
          setSubmitting(false);
          return;
        }
        locationId = createLocRes.data.id;
      }

      const lessonData = {
        ...reservationForm,
        is_request: false,
        // Convert single IDs to arrays for many-to-many relationship
        student_ids: reservationForm.student_id ? [parseInt(reservationForm.student_id)] : [],
        instructor_ids: reservationForm.instructor_id ? [parseInt(reservationForm.instructor_id)] : [],
        lesson_template_id: reservationForm.lesson_template_id ? parseInt(reservationForm.lesson_template_id) : null,
        acting_pic_user_id: reservationForm.acting_pic_user_id ? parseInt(reservationForm.acting_pic_user_id, 10) : null,
        location_id: locationId,
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
          location_id: '',
          flight_type: '',
          lesson_id: '',
          lesson_template_id: '',
          lesson_date: '',
          lesson_time: '',
          duration_minutes: 60,
          notes: '',
          reservation_number: generateReservationNumber(),
          acting_pic_user_id: '',
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

  // Flight type options handled via FLIGHT_TYPES config
  const flightTypes = FLIGHT_TYPES;


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

            {!isStudent() && (
              <select
                value={selectedCalendarLocationId}
                onChange={(e) => setSelectedCalendarLocationId(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm w-full sm:w-auto sm:flex-shrink-0 sm:min-w-[160px]"
                aria-label="Filter calendar by location"
              >
                <option value="">All locations</option>
                {allLocations
                  .filter((loc) => loc.id != null && String(loc.id) !== '' && !String(loc.id).startsWith('new:'))
                  .map((loc) => (
                    <option key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </option>
                  ))}
              </select>
            )}


            {/* Week / Day / Custom view toggle */}
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-300 p-0.5 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCalendarViewMode('week')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${calendarViewMode === 'week' ? 'bg-white shadow text-blue-600 border border-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('day')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${calendarViewMode === 'day' ? 'bg-white shadow text-blue-600 border border-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('custom')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${calendarViewMode === 'custom' ? 'bg-white shadow text-blue-600 border border-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Custom
              </button>
            </div>

            {/* Custom date range inputs (visible when Custom view) */}
            {calendarViewMode === 'custom' && (
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">From</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                />
                <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">To</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                />
              </div>
            )}

            {/* Date Navigation (hidden for Custom view) */}
            <div className="flex items-center gap-1 sm:gap-2 justify-between sm:justify-start flex-1 min-w-0">
              {calendarViewMode !== 'custom' && (
                <>
                  <button
                    onClick={() => calendarViewMode === 'day' ? navigateDay(-1) : navigateWeek(-1)}
                    className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                    aria-label={calendarViewMode === 'day' ? 'Previous day' : 'Previous week'}
                  >
                    <FiChevronLeft size={18} className="sm:w-5 sm:h-5" />
                  </button>
                  
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <span className="hidden md:inline text-xs sm:text-sm font-medium text-gray-700 truncate">
                      {getDateRangeLabel()}
                    </span>
                    <input
                      type="date"
                      value={formatDateStr(currentDate)}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const [y, m, d] = val.split('-').map(Number);
                          setCurrentDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      aria-label="Select date"
                    />
                  </div>

                  <button
                    onClick={() => calendarViewMode === 'day' ? navigateDay(1) : navigateWeek(1)}
                    className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                    aria-label={calendarViewMode === 'day' ? 'Next day' : 'Next week'}
                  >
                    <FiChevronRight size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </>
              )}
              {calendarViewMode === 'custom' && (
                <span className="text-xs sm:text-sm font-medium text-gray-700 px-1 sm:px-2 truncate">
                  {getDateRangeLabel()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Grid - Horizontal scrollbar at bottom */}
        <div 
          className="calendar-scroll-container custom-scrollbar" 
          style={{ 
            maxHeight: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 220px)',
            minHeight: '300px',
            overflowX: 'auto',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '0 0 8px 8px',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <table className="calendar-table min-w-full" style={{ 
            minWidth: calendarViewMode === 'day' 
              ? (isMobile ? '1400px' : '1800px') 
              : (calendarViewMode === 'custom' ? Math.max(getDisplayDates().length * (isMobile ? 150 : 200), 1200) : (isMobile ? '1000px' : '1400px')),
            width: '100%',
            tableLayout: 'fixed',
            borderSpacing: 0
          }}>
              {calendarViewMode === 'day' ? (
                <>
                  <thead className="sticky top-0 z-20 bg-gray-50">
                    <tr className="border-b border-gray-200 shadow-sm bg-gray-50">
                      <th className="text-left px-3 py-3 font-semibold text-xs text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][currentDate.getDay()]}</span>
                          <span className="text-gray-900">{currentDate.getDate()} {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][currentDate.getMonth()]}</span>
                        </div>
                      </th>
                      {timeSlots.map((slot, idx) => {
                        const isCurrentHour = formatDateStr(new Date()) === formatDateStr(currentDate) && new Date().getHours() === idx;
                        return (
                          <th key={idx} className="px-1 py-2 border-r border-gray-200 bg-gray-50/50" 
                            style={{ width: `calc((100% - ${isMobile ? 120 : 150}px) / 24)` }}>
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-400 truncate">
                              {slot.label}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-50/50">
                      <td className="px-3 py-2 border-r border-gray-200 sticky left-0 bg-blue-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Aircraft</h3>
                      </td>
                      <td colSpan={24} className="border-r border-gray-200 bg-blue-50/20" style={{ height: '36px' }}></td>
                    </tr>
                    {filteredAircraftSchedule.map((aircraft) => (
                      <tr key={`aircraft-${aircraft.id}`} className="border-b border-gray-200 hover:bg-gray-50/80 transition-colors group">
                        <td className="px-3 py-3 border-r border-gray-200 text-xs text-gray-700 sticky left-0 bg-white z-20 group-hover:bg-gray-50 font-semibold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                          <span className="truncate block">{safeDisplay(aircraft.registration || aircraft.serial_number || aircraft.name)}</span>
                        </td>
                        <td colSpan={24} className="relative p-0" style={{ height: isMobile ? '60px' : '54px' }}>
                          {/* Background Grid Cells (Clickable) */}
                          <div className="absolute inset-0 flex">
                            {timeSlots.map((slot, idx) => (
                              <div 
                                key={idx} 
                                className="border-r border-gray-200 h-full hover:bg-blue-50/40 cursor-pointer transition-colors group/slot" 
                                style={{ width: 'calc(100% / 24)' }}
                                onClick={() => handleAddReservation(formatDateStr(currentDate), aircraft.id, null, slot.time)}
                              >
                                <div className="opacity-0 group-hover/slot:opacity-100 absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className="text-[10px] text-blue-600 font-bold bg-white/80 px-1 rounded">+</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          

                          {/* Events */}
                          {getEventsForDay(aircraft, formatDateStr(currentDate)).map((event, idx) => {
                            const fullRange = eventStartEndMs(event);
                            const p = portionOnDayMs(event, formatDateStr(currentDate));
                            if (!p) return null;
                            const dStart = new Date(p.segStart);
                            const startHour = dStart.getHours() + dStart.getMinutes() / 60;
                            const durationHours = (p.segEnd - p.segStart) / 3600000;
                            
                            const leftPct = (startHour / 24) * 100;
                            const widthPct = (durationHours / 24) * 100;
                            
                            const isStartingToday = p.segStart === fullRange.startMs;
                            const isEndingToday = p.segEnd === fullRange.endMs;
                            
                            return (
                              <div key={idx} className={`absolute top-2 bottom-2 px-2 py-1 cursor-pointer z-10 hidden sm:flex items-center shadow-md overflow-hidden ${getEventColor(event, 'aircraft')} border border-white/20 hover:scale-[1.02] hover:z-20 transition-all
                                ${isStartingToday ? 'rounded-l-md' : 'border-l-0'} 
                                ${isEndingToday ? 'rounded-r-md' : 'border-r-0'}`} 
                                style={{ 
                                  left: `${leftPct}%`, 
                                  width: `${widthPct}%`,
                                  marginLeft: isStartingToday ? '1px' : '0px'
                                }}
                                onMouseEnter={(e) => handleEventHover(event, e, 'aircraft')} onMouseLeave={handleEventLeave} onClick={() => handleEventClick(event)}
                              >
                                <div className="font-bold truncate text-[10px] md:text-xs leading-tight w-full drop-shadow-sm flex items-center gap-1">
                                  {!isStartingToday && <span className="opacity-70">…</span>}
                                  {isStartingToday ? formatEventTimeForDisplay(event.start_time).replace(':00 ', '') : `${dStart.getHours() % 12 || 12}:00 AM`}
                                  {event.student?.name && <span className="truncate"> - {event.student.name} ({new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})</span>}
                                </div>
                              </div>
                            );
                          })}
                          {/* Mobile events */}
                          {getEventsForDay(aircraft, formatDateStr(currentDate)).map((event, idx) => {
                            const fullRange = eventStartEndMs(event);
                            const p = portionOnDayMs(event, formatDateStr(currentDate));
                            if (!p) return null;
                            const dStart = new Date(p.segStart);
                            const startHour = dStart.getHours() + dStart.getMinutes() / 60;
                            const durationHours = (p.segEnd - p.segStart) / 3600000;
                            
                            const leftPct = (startHour / 24) * 100;
                            const widthPct = (durationHours / 24) * 100;
                            
                            const isStartingToday = p.segStart === fullRange.startMs;
                            const isEndingToday = p.segEnd === fullRange.endMs;

                            return (
                              <div key={`mob-${idx}`} className={`absolute top-1 bottom-1 px-1 cursor-pointer z-10 flex sm:hidden shadow-sm overflow-hidden ${getEventColor(event, 'aircraft')} border border-white/10
                                ${isStartingToday ? 'rounded-l' : 'border-l-0'} 
                                ${isEndingToday ? 'rounded-r' : 'border-r-0'}`} 
                                style={{ 
                                  left: `${leftPct}%`, 
                                  width: `${widthPct}%` 
                                }}
                                onMouseEnter={(e) => handleEventHover(event, e, 'aircraft')} onMouseLeave={handleEventLeave} onClick={() => handleEventClick(event)}
                              >
                                <div className="font-bold truncate text-[9px] w-full text-center flex flex-col items-center justify-center leading-tight">
                                  <span>{isStartingToday ? formatEventTimeForDisplay(event.start_time).replace(/AM|PM/i, '') : `${dStart.getHours() % 12 || 12}`}</span>
                                  {event.student?.name && <span className="truncate w-full px-1">{event.student.name} ({new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})</span>}
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-50/50">
                      <td className="px-3 py-2 border-r border-gray-200 sticky left-0 bg-green-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                        <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide">Instructors</h3>
                      </td>
                      <td colSpan={24} className="border-r border-gray-200 bg-green-50/20" style={{ height: '36px' }}></td>
                    </tr>
                    {filteredUserSchedule.map((user) => (
                      <tr key={`user-${user.id}`} className="border-b border-gray-200 hover:bg-gray-50/80 transition-colors group">
                        <td className="px-3 py-3 border-r border-gray-200 text-xs text-gray-700 sticky left-0 bg-white z-20 group-hover:bg-gray-50 font-semibold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                          <span className="truncate block">{safeDisplay(user.name)}</span>
                        </td>
                        <td colSpan={24} className="relative p-0" style={{ height: isMobile ? '60px' : '54px' }}>
                           {/* Background Grid Cells (Clickable) */}
                           <div className="absolute inset-0 flex">
                            {timeSlots.map((slot, idx) => (
                              <div 
                                key={idx} 
                                className="border-r border-gray-200 h-full hover:bg-green-50/40 cursor-pointer transition-colors group/slot" 
                                style={{ width: 'calc(100% / 24)' }}
                                onClick={() => handleAddReservation(formatDateStr(currentDate), null, user.id, slot.time)}
                              >
                                <div className="opacity-0 group-hover/slot:opacity-100 absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className="text-[10px] text-green-600 font-bold bg-white/80 px-1 rounded">+</span>
                                </div>
                              </div>
                            ))}
                          </div>


                          {getEventsForDay(user, formatDateStr(currentDate)).map((event, idx) => {
                            const fullRange = eventStartEndMs(event);
                            const p = portionOnDayMs(event, formatDateStr(currentDate));
                            if (!p) return null;
                            const dStart = new Date(p.segStart);
                            const startHour = dStart.getHours() + dStart.getMinutes() / 60;
                            const durationHours = (p.segEnd - p.segStart) / 3600000;
                            
                            const leftPct = (startHour / 24) * 100;
                            const widthPct = (durationHours / 24) * 100;
                            
                            const isStartingToday = p.segStart === fullRange.startMs;
                            const isEndingToday = p.segEnd === fullRange.endMs;

                            return (
                              <div key={idx} className={`absolute top-2 bottom-2 px-2 py-1 cursor-pointer z-10 hidden sm:flex items-center shadow-md overflow-hidden ${getEventColor(event, 'instructor')} border border-white/20 hover:scale-[1.02] hover:z-20 transition-all
                                ${isStartingToday ? 'rounded-l-md' : 'border-l-0'} 
                                ${isEndingToday ? 'rounded-r-md' : 'border-r-0'}`} 
                                style={{ 
                                  left: `${leftPct}%`, 
                                  width: `${widthPct}%`,
                                  marginLeft: isStartingToday ? '1px' : '0px'
                                }}
                                onMouseEnter={(e) => handleEventHover(event, e, 'instructor')} onMouseLeave={handleEventLeave} onClick={() => handleEventClick(event)}
                              >
                                <div className="font-bold truncate text-[10px] md:text-xs leading-tight w-full drop-shadow-sm flex items-center gap-1">
                                  {!isStartingToday && <span className="opacity-70">…</span>}
                                  {isStartingToday ? formatEventTimeForDisplay(event.start_time) : `${dStart.getHours() % 12 || 12}:00 AM`}
                                  {event.student?.name && <span className="truncate"> - {event.student.name} ({new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})</span>}
                                </div>
                              </div>
                            );
                          })}
                          {/* Mobile events */}
                          {getEventsForDay(user, formatDateStr(currentDate)).map((event, idx) => {
                            const fullRange = eventStartEndMs(event);
                            const p = portionOnDayMs(event, formatDateStr(currentDate));
                            if (!p) return null;
                            const dStart = new Date(p.segStart);
                            const startHour = dStart.getHours() + dStart.getMinutes() / 60;
                            const durationHours = (p.segEnd - p.segStart) / 3600000;
                            
                            const leftPct = (startHour / 24) * 100;
                            const widthPct = (durationHours / 24) * 100;
                            
                            const isStartingToday = p.segStart === fullRange.startMs;
                            const isEndingToday = p.segEnd === fullRange.endMs;

                            return (
                              <div key={`mob-${idx}`} className={`absolute top-1 bottom-1 px-1 cursor-pointer z-10 flex sm:hidden shadow-sm overflow-hidden ${getEventColor(event, 'instructor')} border border-white/10
                                ${isStartingToday ? 'rounded-l' : 'border-l-0'} 
                                ${isEndingToday ? 'rounded-r' : 'border-r-0'}`} 
                                style={{ 
                                  left: `${leftPct}%`, 
                                  width: `${widthPct}%` 
                                }}
                                onMouseEnter={(e) => handleEventHover(event, e, 'instructor')} onMouseLeave={handleEventLeave} onClick={() => handleEventClick(event)}
                              >
                                <div className="font-bold truncate text-[8px] w-full text-center flex flex-col items-center justify-center leading-tight">
                                  <span>{isStartingToday ? formatEventTimeForDisplay(event.start_time).replace(/AM|PM/i, '') : `${dStart.getHours() % 12 || 12}`}</span>
                                  {event.student?.name && <span className="truncate w-full px-1">{event.student.name} ({new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})</span>}
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead className="sticky top-0 z-20 bg-gray-50">
                    <tr className="border-b border-gray-200 shadow-sm">
                      <th className="text-left px-3 py-3 font-semibold text-xs text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                        Resource
                      </th>
                      {getDisplayDates().map((day, idx) => (
                        <th key={idx} className="text-center px-1 py-3 bg-gray-50 border-r border-gray-200" style={{ width: `${90 / getDisplayDates().length}%` }}>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none mb-1">
                              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day.getDay()]}
                            </span>
                            <span className="text-sm font-bold text-gray-800 leading-none">
                              {day.getDate()}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-50/50">
                      <td className="px-3 py-2 border-r border-gray-200 sticky left-0 bg-blue-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '100px' : '150px' }}>
                        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Aircraft</h3>
                      </td>
                      {getDisplayDates().map((_, idx) => <td key={idx} className="border-r border-gray-200 bg-blue-50/20" style={{ height: '36px' }}></td>)}
                    </tr>
                    {filteredAircraftSchedule.map((aircraft) => (
                      <tr key={aircraft.id} className="border-b border-gray-200 hover:bg-gray-50/80 transition-colors group">
                        <td className="px-3 py-3 border-r border-gray-200 text-xs text-gray-700 sticky left-0 bg-white z-20 group-hover:bg-gray-50 font-semibold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                          <span className="truncate block">{safeDisplay(aircraft.registration || aircraft.serial_number || aircraft.name)}</span>
                        </td>
                        {getDisplayDates().map((day, idx) => {
                          const dateStr = formatDateStr(day);
                          const dayEvents = getEventsForDay(aircraft, dateStr);
                          return (
                            <td key={idx} className="border-r border-gray-200 p-1 lg:p-1.5 align-top group-hover:bg-gray-50/30 transition-colors" style={{ minHeight: '60px' }}>
                              {dayEvents.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {dayEvents.map((ev, i) => {
                                    const isStart = ev.date === dateStr;
                                    const isEnd = ev.end_date === dateStr;
                                    const displayTime = isStart 
                                      ? formatEventTimeForDisplay(ev.start_time).replace(':00', '') 
                                      : `Ends ${formatEventTimeForDisplay(ev.end_time).replace(':00', '')}`;
                                    
                                    return (
                                      <div key={i} 
                                        className={`rounded p-1 text-[10px] font-bold truncate cursor-pointer ${getEventColor(ev, 'aircraft')} shadow-sm border border-white/10 hover:brightness-110 transition-all flex items-center gap-1`} 
                                        title={safeDisplay(ev.title) || `${formatEventTimeForDisplay(ev.start_time)} - ${formatEventTimeForDisplay(ev.end_time)}`}
                                        onMouseEnter={(e) => handleEventHover(ev, e, 'aircraft')} 
                                        onMouseLeave={handleEventLeave} 
                                        onClick={() => handleEventClick(ev)}
                                      >
                                        {!isStart && <span className="opacity-70">←</span>}
                                        <span className="truncate">{displayTime}{ev.student?.name ? ` - ${ev.student.name}` : ''}</span>
                                        {!isEnd && <span className="opacity-70">→</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-20">
                                  <span className="text-[10px] font-bold text-gray-400">+</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="bg-green-50/50">
                      <td className="px-3 py-2 border-r border-gray-200 sticky left-0 bg-green-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                        <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide">Instructors</h3>
                      </td>
                      {getDisplayDates().map((_, idx) => <td key={idx} className="border-r border-gray-200 bg-green-50/20" style={{ height: '36px' }}></td>)}
                    </tr>
                    {filteredUserSchedule.map((user) => (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50/80 transition-colors group">
                        <td className="px-3 py-3 border-r border-gray-200 text-xs text-gray-700 sticky left-0 bg-white z-20 group-hover:bg-gray-50 font-semibold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ width: isMobile ? '120px' : '150px' }}>
                          <span className="truncate block">{safeDisplay(user.name)}</span>
                        </td>
                        {getDisplayDates().map((day, idx) => {
                          const dateStr = formatDateStr(day);
                          const dayEvents = getEventsForDay(user, dateStr);
                          return (
                            <td key={idx} className="border-r border-gray-200 p-1 lg:p-1.5 align-top group-hover:bg-gray-50/30 transition-colors" style={{ minHeight: '60px' }}>
                              {dayEvents.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {dayEvents.map((ev, i) => {
                                    const isStart = ev.date === dateStr;
                                    const isEnd = ev.end_date === dateStr;
                                    const displayTime = isStart 
                                      ? formatEventTimeForDisplay(ev.start_time).replace(':00', '') 
                                      : `Ends ${formatEventTimeForDisplay(ev.end_time).replace(':00', '')}`;

                                    return (
                                      <div key={i} className={`rounded p-1 text-[10px] font-bold truncate cursor-pointer ${getEventColor(ev, 'instructor')} shadow-sm border border-white/10 hover:brightness-110 transition-all flex items-center gap-1`} title={safeDisplay(ev.title) || `${formatEventTimeForDisplay(ev.start_time)} - ${formatEventTimeForDisplay(ev.end_time)}`} onMouseEnter={(e) => handleEventHover(ev, e, 'instructor')} onMouseLeave={handleEventLeave} onClick={() => handleEventClick(ev)}>
                                        {!isStart && <span className="opacity-70">←</span>}
                                        <span className="truncate">{displayTime}{ev.student?.name ? ` - ${ev.student.name}` : ''}</span>
                                        {!isEnd && <span className="opacity-70">→</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-20 text-gray-400 font-bold text-[10px] cursor-pointer" onClick={() => handleAddReservation(dateStr, null, user.id)}>
                                  +
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
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
            {hoveredEvent.hoverContext === 'instructor' ? (
              <>
                {hoveredEvent.student?.name ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                      {(hoveredEvent.student.name.charAt(0) || 'S').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        Student: {hoveredEvent.student.name}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="font-medium text-sm text-gray-800">
                    No Student Assigned
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                  {(safeDisplay(hoveredEvent.instructor?.name || hoveredEvent.instructor, 'U').charAt(0) || 'U').toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-800">
                    Inst: {safeDisplay(hoveredEvent.instructor?.name || hoveredEvent.instructor, 'Unknown')}
                  </div>
                  {hoveredEvent.student?.name && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      Student: {hoveredEvent.student.name}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-gray-600">{safeDisplay(hoveredEvent.description, 'No description')}</p>
          {(safeDisplay(hoveredEvent.location?.name, '') || safeDisplay(hoveredEvent.location_name, '')) ? (
            <p className="text-xs text-gray-600 mt-1">
              📍 {safeDisplay(hoveredEvent.location?.name || hoveredEvent.location_name)}
            </p>
          ) : null}
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
              {formatEventTimeForDisplay(hoveredEvent.start_time)} - {formatEventTimeForDisplay(hoveredEvent.end_time)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default calendar view</label>
                    <select
                      value={calendarSettings.default_view === 'month' ? 'week' : (calendarSettings.default_view || 'day')}
                      onChange={(e) => setCalendarSettings({ ...calendarSettings, default_view: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month (shown as week grid)</option>
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

                  {/* Activity Type Colors */}
                  <div className="pt-8 border-t border-gray-100 mt-8">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 tracking-tight">Activity Tags</h4>
                        <p className="text-sm text-gray-500 mt-1">Assign distinct colors to flight types for quick visual identification.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 max-h-[60vh] overflow-y-auto pr-2 pb-4 custom-scrollbar">
                      {flightTypes.map(type => {
                        const currentSelection = calendarSettings.activity_colors?.[type] || 'blue';
                        return (
                          <div key={type} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] hover:border-blue-100 transition-all duration-300 group">
                            <div className="flex justify-between items-center mb-5 border-b border-gray-50 pb-3">
                              <span className="text-base font-bold text-gray-800">{type}</span>
                              <div className={`w-4 h-4 rounded-full shadow-sm ring-4 ring-opacity-20 animate-pulse ${
                                    currentSelection === 'slate' ? 'bg-slate-100 ring-slate-400' :
                                    currentSelection === 'gray' ? 'bg-gray-100 ring-gray-400' :
                                    currentSelection === 'zinc' ? 'bg-zinc-100 ring-zinc-400' :
                                    currentSelection === 'red' ? 'bg-red-100 ring-red-400' :
                                    currentSelection === 'orange' ? 'bg-orange-100 ring-orange-400' :
                                    currentSelection === 'amber' ? 'bg-amber-100 ring-amber-400' :
                                    currentSelection === 'yellow' ? 'bg-yellow-100 ring-yellow-400' :
                                    currentSelection === 'lime' ? 'bg-lime-100 ring-lime-400' :
                                    currentSelection === 'green' ? 'bg-green-100 ring-green-400' :
                                    currentSelection === 'emerald' ? 'bg-emerald-100 ring-emerald-400' :
                                    currentSelection === 'teal' ? 'bg-teal-100 ring-teal-400' :
                                    currentSelection === 'cyan' ? 'bg-cyan-100 ring-cyan-400' :
                                    currentSelection === 'sky' ? 'bg-sky-100 ring-sky-400' :
                                    currentSelection === 'blue' ? 'bg-blue-100 ring-blue-400' :
                                    currentSelection === 'indigo' ? 'bg-indigo-100 ring-indigo-400' :
                                    currentSelection === 'violet' ? 'bg-violet-100 ring-violet-400' :
                                    currentSelection === 'purple' ? 'bg-purple-100 ring-purple-400' :
                                    currentSelection === 'fuchsia' ? 'bg-fuchsia-100 ring-fuchsia-400' :
                                    currentSelection === 'pink' ? 'bg-pink-100 ring-pink-400' :
                                    currentSelection === 'rose' ? 'bg-rose-100 ring-rose-400' :
                                    currentSelection === 'black' ? 'bg-gray-800 ring-gray-900' :
                                    'bg-blue-100 ring-blue-400'
                              }`}></div>
                            </div>
                            
                            <div className="grid grid-cols-7 gap-2">
                              {[
                                'slate', 'gray', 'zinc', 
                                'red', 'orange', 'amber', 'yellow', 'lime', 
                                'green', 'emerald', 'teal', 
                                'cyan', 'sky', 'blue', 'indigo', 
                                'violet', 'purple', 'fuchsia', 'pink', 'rose', 
                                'black'
                              ].map(c => {
                                const isSelected = calendarSettings.activity_colors?.[type] === c;
                                const checkColor = 'text-gray-900';
                                
                                return (
                                  <button
                                    key={c}
                                    onClick={() => setCalendarSettings({
                                      ...calendarSettings,
                                      activity_colors: {
                                        ...(calendarSettings.activity_colors || {}),
                                        [type]: c
                                      }
                                    })}
                                    className={`relative aspect-square w-full rounded-xl flex items-center justify-center transition-all duration-300 ${
                                      isSelected 
                                        ? 'ring-2 ring-offset-2 ring-gray-900 scale-[1.15] z-10 shadow-md' 
                                        : 'hover:scale-[1.15] hover:shadow-sm hover:z-10 opacity-70 hover:opacity-100 cursor-pointer'
                                    } ${
                                      c === 'slate' ? 'bg-slate-100 border border-slate-200' :
                                      c === 'gray' ? 'bg-gray-100 border border-gray-200' :
                                      c === 'zinc' ? 'bg-zinc-100 border border-zinc-200' :
                                      c === 'red' ? 'bg-red-100 border border-red-200' :
                                      c === 'orange' ? 'bg-orange-100 border border-orange-200' :
                                      c === 'amber' ? 'bg-amber-100 border border-amber-200' :
                                      c === 'yellow' ? 'bg-yellow-100 border border-yellow-200' :
                                      c === 'lime' ? 'bg-lime-100 border border-lime-200' :
                                      c === 'green' ? 'bg-green-100 border border-green-200' :
                                      c === 'emerald' ? 'bg-emerald-100 border border-emerald-200' :
                                      c === 'teal' ? 'bg-teal-100 border border-teal-200' :
                                      c === 'cyan' ? 'bg-cyan-100 border border-cyan-200' :
                                      c === 'sky' ? 'bg-sky-100 border border-sky-200' :
                                      c === 'blue' ? 'bg-blue-100 border border-blue-200' :
                                      c === 'indigo' ? 'bg-indigo-100 border border-indigo-200' :
                                      c === 'violet' ? 'bg-violet-100 border border-violet-200' :
                                      c === 'purple' ? 'bg-purple-100 border border-purple-200' :
                                      c === 'fuchsia' ? 'bg-fuchsia-100 border border-fuchsia-200' :
                                      c === 'pink' ? 'bg-pink-100 border border-pink-200' :
                                      c === 'rose' ? 'bg-rose-100 border border-rose-200' :
                                      c === 'black' ? 'bg-gray-800' :
                                      'bg-blue-100 border border-blue-200'
                                    }`}
                                    title={c}
                                  >
                                    {isSelected && <FiCheck className={`${checkColor}`} size={16} strokeWidth={3} />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
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
                      <p className="font-medium text-gray-800">{safeDisplay(selectedReservation.issued_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Due Date</p>
                      <p className="font-medium text-gray-800">{safeDisplay(selectedReservation.due_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Reservation No.</p>
                      <p className="font-medium text-gray-800">{safeDisplay(selectedReservation.reservation_no)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div className="border-b border-dashed border-gray-300 pb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Title</label>
                    <input
                      type="text"
                      value={safeDisplay(selectedReservation.title, '')}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-800"
                    />
                  </div>

                  {/* Student and Instructor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-b border-dashed border-gray-300 pb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Student:</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">{safeDisplay(selectedReservation.student ?? selectedReservation.students?.[0])}</span></p>
                        <p><span className="text-gray-500">Flight:</span> <span className="font-medium text-gray-800">{safeDisplay(selectedReservation.flight_type)}</span></p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Instructor:</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">{safeDisplay(selectedReservation.instructor ?? selectedReservation.instructors?.[0])}</span></p>
                        <p><span className="text-gray-500">Aircraft:</span> <span className="font-medium text-gray-800">{safeDisplay(selectedReservation.aircraft)}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Location (from calendar settings / locations – admin role) */}
                  {(selectedReservation.location?.name ?? selectedReservation.location_id) && (
                    <div className="border-b border-dashed border-gray-300 pb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Location:</h4>
                      <div className="text-sm">
                        <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">{safeDisplay(selectedReservation.location?.name)}</span></p>
                        {(selectedReservation.location?.address != null && selectedReservation.location?.address !== '') && (
                          <p className="mt-1"><span className="text-gray-500">Address:</span> <span className="font-medium text-gray-800">{safeDisplay(selectedReservation.location?.address)}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                    <textarea
                      value={safeDisplay(selectedReservation.description ?? selectedReservation.notes, '')}
                      readOnly
                      rows="6"
                      placeholder="No description"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-800 resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 p-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowReservationDetailModal(false);
                      setSelectedReservation(null);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition order-3 sm:order-1"
                  >
                    Close
                  </button>
                  
                  {/* Hide Edit button for students */}
                  {!isStudent() && (
                    <button
                      onClick={() => {
                        setShowReservationDetailModal(false);
                        if (selectedReservation?.id) {
                          setSearchParams({ edit: selectedReservation.id });
                        }
                        setSelectedReservation(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition order-2"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowReservationDetailModal(false);
                      setSelectedReservation(null);
                      if (selectedReservation?.id) {
                        navigate(`/reservations/${selectedReservation.id}`);
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition border border-indigo-200 font-medium order-1 sm:order-3"
                  >
                    Open Full Detail →
                  </button>
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
                      onChange={(e) => {
                        const sid = e.target.value;
                        const student = students.find((s) => String(s.id) === sid);
                        const suggestedPIC = student?.certificate_level && ['Private', 'Commercial', 'ATP'].includes(student.certificate_level)
                          ? sid
                          : reservationForm.instructor_id;
                        // Auto-fill location from student's assigned location
                        const studentLocationId = student?.default_location_id
                          ? String(student.default_location_id)
                          : reservationForm.location_id;
                        setReservationForm({
                          ...reservationForm,
                          student_id: sid,
                          acting_pic_user_id: suggestedPIC || reservationForm.acting_pic_user_id,
                          location_id: studentLocationId,
                        });
                      }}
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
                      onChange={(e) => {
                        const iid = e.target.value;
                        const student = students.find((s) => String(s.id) === reservationForm.student_id);
                        const suggestedPIC = student?.certificate_level && ['Private', 'Commercial', 'ATP'].includes(student.certificate_level)
                          ? reservationForm.student_id
                          : iid;
                        setReservationForm({
                          ...reservationForm,
                          instructor_id: iid,
                          acting_pic_user_id: suggestedPIC || reservationForm.acting_pic_user_id,
                        });
                      }}
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
                    Location <span className="text-red-500">*</span>
                    {(() => {
                      const selStudent = students.find(s => String(s.id) === reservationForm.student_id);
                      return selStudent?.default_location_id ? (
                        <span className="ml-2 text-xs text-blue-600 font-normal">🔒 Auto-filled from student's profile</span>
                      ) : null;
                    })()}
                  </label>
                  {loadingFormData ? (
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">Loading locations...</div>
                  ) : (() => {
                    const selStudent = students.find(s => String(s.id) === reservationForm.student_id);
                    const isLocked = !!(selStudent?.default_location_id);
                    // When locked, show only the student's location
                    const visibleLocations = isLocked
                      ? locationsList.filter(loc => String(loc.id) === String(selStudent.default_location_id))
                      : locationsList;
                    return (
                      <select
                        value={reservationForm.location_id || ''}
                        onChange={(e) => !isLocked && setReservationForm({ ...reservationForm, location_id: e.target.value })}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLocked ? 'bg-blue-50 cursor-not-allowed border-blue-200' : ''}`}
                        required
                        disabled={isLocked}
                      >
                        <option value="">Select Location</option>
                        {visibleLocations.length > 0 ? (
                          visibleLocations.map((loc) => (
                            <option key={loc.id} value={String(loc.id)}>
                              {loc.name}{loc.address ? ` – ${loc.address}` : ''}{loc.isCustom ? ' (from settings)' : ''}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No locations. Admin can add locations for this organization.</option>
                        )}
                      </select>
                    );
                  })()}
                </div>

                {reservationForm.student_id && reservationForm.instructor_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Acting PIC (Pilot in Command)</label>
                    <select
                      value={reservationForm.acting_pic_user_id || reservationForm.instructor_id}
                      onChange={(e) => setReservationForm({ ...reservationForm, acting_pic_user_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={reservationForm.student_id}>
                        Student ({students.find((s) => String(s.id) === reservationForm.student_id)?.name || 'Selected'})
                      </option>
                      <option value={reservationForm.instructor_id}>
                        Instructor ({instructors.find((i) => String(i.id) === reservationForm.instructor_id)?.name || 'Selected'})
                      </option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Default: Student PIC if certificate is Private/Commercial/ATP; otherwise Instructor PIC. Editable.</p>
                  </div>
                )}

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
                          <option key={ac.id} value={String(ac.id)}>{ac.registration || ac.serial_number || ac.name} {ac.model ? `(${ac.model})` : ''}</option>
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

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Flight Type</label>
                    <select
                      value={flightTypes.includes(reservationForm.flight_type) ? reservationForm.flight_type : (reservationForm.flight_type ? 'Other' : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          setReservationForm({ ...reservationForm, flight_type: 'Other' });
                        } else {
                          setReservationForm({ ...reservationForm, flight_type: val });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    >
                      <option value="">Select Flight Type</option>
                      {flightTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  {(reservationForm.flight_type === 'Other' || (reservationForm.flight_type && !flightTypes.includes(reservationForm.flight_type))) && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Flight Type</label>
                      <input
                        type="text"
                        placeholder="Enter flight type..."
                        value={reservationForm.flight_type === 'Other' ? '' : reservationForm.flight_type}
                        onChange={(e) => setReservationForm({ ...reservationForm, flight_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                        autoFocus
                      />
                    </div>
                  )}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={reservationForm.lesson_date}
                      onChange={(e) => setReservationForm({ ...reservationForm, lesson_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
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
                        // Only show red if student is confirmed unavailable AND a student is actually selected
                        availabilityStatus.student === false && reservationForm.student_id
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={(() => {
                        if (!reservationForm.lesson_date || !reservationForm.lesson_time) return '';
                        const d = new Date(`${reservationForm.lesson_date}T${reservationForm.lesson_time}`);
                        if (isNaN(d.getTime())) return '';
                        d.setMinutes(d.getMinutes() + (reservationForm.duration_minutes || 60));
                        return d.toISOString().split('T')[0];
                      })()}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        if (!reservationForm.lesson_date || !reservationForm.lesson_time) return;
                        const start = new Date(`${reservationForm.lesson_date}T${reservationForm.lesson_time}`);
                        const oldEnd = new Date(start.getTime() + (reservationForm.duration_minutes || 60) * 60000);
                        const hh = String(oldEnd.getHours()).padStart(2, '0');
                        const mm = String(oldEnd.getMinutes()).padStart(2, '0');
                        const newEnd = new Date(`${newEndDate}T${hh}:${mm}`);
                        if (!isNaN(newEnd.getTime())) {
                          const diff = Math.round((newEnd.getTime() - start.getTime()) / 60000);
                          setReservationForm({ ...reservationForm, duration_minutes: diff > 0 ? diff : 15 });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={(() => {
                        if (!reservationForm.lesson_date || !reservationForm.lesson_time) return '';
                        const d = new Date(`${reservationForm.lesson_date}T${reservationForm.lesson_time}`);
                        if (isNaN(d.getTime())) return '';
                        d.setMinutes(d.getMinutes() + (reservationForm.duration_minutes || 60));
                        const hh = String(d.getHours()).padStart(2, '0');
                        const mm = String(d.getMinutes()).padStart(2, '0');
                        return `${hh}:${mm}`;
                      })()}
                      onChange={(e) => {
                        const newEndTime = e.target.value;
                        if (!reservationForm.lesson_date || !reservationForm.lesson_time) return;
                        const start = new Date(`${reservationForm.lesson_date}T${reservationForm.lesson_time}`);
                        const oldEnd = new Date(start.getTime() + (reservationForm.duration_minutes || 60) * 60000);
                        const oldEndDate = oldEnd.toISOString().split('T')[0];
                        const newEnd = new Date(`${oldEndDate}T${newEndTime}`);
                        if (!isNaN(newEnd.getTime())) {
                          let diff = Math.round((newEnd.getTime() - start.getTime()) / 60000);
                          if (diff <= 0) {
                             newEnd.setDate(newEnd.getDate() + 1);
                             diff = Math.round((newEnd.getTime() - start.getTime()) / 60000);
                          }
                          setReservationForm({ ...reservationForm, duration_minutes: diff > 0 ? diff : 15 });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={reservationForm.duration_minutes}
                      onChange={(e) => setReservationForm({ ...reservationForm, duration_minutes: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-600"
                      min="15"
                      max="1440"
                      required
                    />
                  </div>
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
