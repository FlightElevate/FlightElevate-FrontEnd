import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiSettings, FiX, FiSearch } from 'react-icons/fi';
import { calendarService } from '../api/services/calendarService';
import { lessonService } from '../api/services/lessonService';
import { userService } from '../api/services/userService';
import { showErrorToast, showSuccessToast } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';

const Calendar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [aircraftSchedule, setAircraftSchedule] = useState([]);
  const [userSchedule, setUserSchedule] = useState([]);
  const [filteredAircraftSchedule, setFilteredAircraftSchedule] = useState([]);
  const [filteredUserSchedule, setFilteredUserSchedule] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
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
    lesson_date: '',
    lesson_time: '',
    duration_minutes: 60,
    notes: '',
    reservation_number: '',
  });

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

  // Generate time slots (24 hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    return {
      hour,
      label: hour === 0 ? '12 am' : hour < 12 ? `${hour} am` : hour === 12 ? '12 pm' : `${hour - 12} pm`,
    };
  });

  useEffect(() => {
    fetchLocations();
    fetchSchedule();
  }, [currentDate, selectedLocation]);

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

  useEffect(() => {
    if (showNewReservationModal || showFindTimeModal) {
      fetchFormData();
    }
  }, [showNewReservationModal, showFindTimeModal]);

  useEffect(() => {
    if (showNewReservationModal) {
      // Generate reservation number when modal opens
      setReservationForm(prev => ({
        ...prev,
        reservation_number: generateReservationNumber(),
      }));
    }
  }, [showNewReservationModal]);

  useEffect(() => {
    if (showSettingsModal) {
      fetchCalendarSettings();
    }
  }, [showSettingsModal]);

  const fetchLocations = async () => {
    try {
      const response = await calendarService.getLocations();
      if (response.success) {
        setLocations(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const response = await calendarService.getSchedule({
        date: dateStr,
        location: selectedLocation || undefined,
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
      const [studentsRes, instructorsRes] = await Promise.all([
        userService.getUsers({ role: 'Student', per_page: 100 }),
        userService.getUsers({ role: 'Instructor', per_page: 100 }),
      ]);

      if (studentsRes.success) {
        // Response structure: response.data is the array of users
        const studentsList = Array.isArray(studentsRes.data) 
          ? studentsRes.data 
          : [];
        setStudents(studentsList);
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
      
      // Set aircraft when API is available
      setAircraft([]);
    } catch (err) {
      console.error('Error fetching form data:', err);
      showErrorToast('Failed to load form data');
      setStudents([]);
      setInstructors([]);
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
        event.student?.name?.toLowerCase().includes(query) ||
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

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  const handleEventClick = async (event) => {
    if (!event || !event.id) return;
    
    setLoadingReservation(true);
    setShowReservationDetailModal(true);
    try {
      const response = await lessonService.getLesson(event.id);
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
        await fetchLocations(); // Refresh locations
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

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await lessonService.createLesson(reservationForm);
      if (response.success) {
        showSuccessToast('Reservation created successfully');
        setShowNewReservationModal(false);
        setReservationForm({
          student_id: '',
          instructor_id: '',
          aircraft_id: '',
          flight_type: '',
          lesson_date: '',
          lesson_time: '',
          duration_minutes: 60,
          notes: '',
          reservation_number: generateReservationNumber(),
        });
        // Refresh schedule to show new reservation
        await fetchSchedule();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Schedule</h2>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Location Select */}
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select Location</option>
              {locations.map((location, idx) => (
                <option key={idx} value={location}>{location}</option>
              ))}
            </select>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
                {getWeekRange()}
              </span>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronRight size={20} />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowFindTimeModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Find a Time
            </button>
            <button
              onClick={() => setShowNewReservationModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              New reservation
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiSettings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Time Header */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-48 text-left px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200">
                  {/* Empty for row labels */}
                </th>
                {timeSlots.map((slot, idx) => (
                  <th
                    key={idx}
                    className="text-center px-2 py-3 text-xs text-gray-600 font-medium border-r border-gray-200"
                    style={{ minWidth: '80px' }}
                  >
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Search Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <FiSearch className="text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Q Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-none outline-none text-sm w-full bg-transparent text-gray-700 placeholder-gray-400"
                    />
                  </div>
                </td>
                {timeSlots.map((_, idx) => (
                  <td
                    key={idx}
                    className="border-r border-gray-200"
                    style={{ minWidth: '80px' }}
                  ></td>
                ))}
              </tr>

              {/* Aircraft Transfer Schedule Section Header */}
              <tr className="border-b border-gray-200 bg-purple-50">
                <td className="px-4 py-3 border-r border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">Aircraft Transfer Schedule</h3>
                </td>
                {timeSlots.map((_, idx) => (
                  <td
                    key={idx}
                    className="text-center border-r border-gray-200 text-gray-400"
                    style={{ minWidth: '80px' }}
                  >
                    –
                  </td>
                ))}
              </tr>

              {/* Aircraft Rows */}
              {filteredAircraftSchedule.map((aircraft) => (
                <tr key={aircraft.id} className="border-b border-gray-200 hover:bg-gray-50 relative">
                  <td className="px-4 py-3 border-r border-gray-200 text-sm text-gray-700">
                    {aircraft.name}
                  </td>
                  {timeSlots.map((slot, idx) => {
                    const event = getEventForCell(aircraft, slot.hour);
                    const span = event ? getEventSpan(event) : 1;
                    const isFirstCell = event && slot.hour === parseInt(event.start_time.split(':')[0]);
                    
                    return (
                      <td
                        key={idx}
                        className="relative border-r border-gray-200 p-0"
                        style={{ minWidth: '80px', height: '60px' }}
                        colSpan={isFirstCell ? span : undefined}
                      >
                        {isFirstCell && (
                          <div
                            className={`absolute left-0 right-0 top-0.5 bottom-0.5 rounded text-white text-xs px-1 py-0.5 cursor-pointer z-10 flex items-center ${getEventColor(event.color)}`}
                            style={{ width: '95%', height: '40px' }}
                            onMouseEnter={(e) => handleEventHover(event, e)}
                            onMouseLeave={handleEventLeave}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="font-medium truncate text-[10px]">{event.start_time}</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* User Schedule Rows */}
              {filteredUserSchedule.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 relative">
                  <td className="px-4 py-3 border-r border-gray-200 text-sm text-gray-700">
                    {user.name}
                  </td>
                  {timeSlots.map((slot, idx) => {
                    const event = getEventForCell(user, slot.hour);
                    const span = event ? getEventSpan(event) : 1;
                    const isFirstCell = event && slot.hour === parseInt(event.start_time.split(':')[0]);
                    
                    return (
                      <td
                        key={idx}
                        className="relative border-r border-gray-200 p-0"
                        style={{ minWidth: '80px', height: '60px' }}
                        colSpan={isFirstCell ? span : undefined}
                      >
                        {isFirstCell && (
                          <div
                            className={`absolute left-0 right-0 top-0.5 bottom-0.5 rounded text-white text-xs px-1 py-0.5 cursor-pointer z-10 flex items-center ${getEventColor(event.color)}`}
                            style={{ width: '95%', height: '40px' }}
                            onMouseEnter={(e) => handleEventHover(event, e)}
                            onMouseLeave={handleEventLeave}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="font-medium truncate text-[10px]">{event.start_time}</div>
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
              {hoveredEvent.student?.name?.charAt(0) || hoveredEvent.instructor?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-medium text-sm text-gray-800">
                {hoveredEvent.student?.name || hoveredEvent.instructor?.name || 'Unknown'}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600">{hoveredEvent.description || 'No description'}</p>
          <div className="mt-2 text-xs text-gray-500">
            {hoveredEvent.start_time} - {hoveredEvent.end_time}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                  <div className="grid grid-cols-2 gap-4">
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                  
                  <div className="grid grid-cols-3 gap-4 text-sm border-t border-dashed border-gray-300 pt-4">
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

                  {/* Customer and Instructor */}
                  <div className="grid grid-cols-2 gap-6 border-b border-dashed border-gray-300 pb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer:</h4>
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

                <div className="flex justify-end p-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowReservationDetailModal(false);
                      setSelectedReservation(null);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* New Reservation Modal */}
      {showNewReservationModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">New Reservation</h3>
              <button
                onClick={() => setShowNewReservationModal(false)}
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Student</option>
                      {students.length > 0 ? (
                        students.map((student) => (
                          <option key={student.id} value={student.id}>{student.name || student.email}</option>
                        ))
                      ) : (
                        <option value="" disabled>No students available</option>
                      )}
                    </select>
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
                          <option key={instructor.id} value={instructor.id}>{instructor.name || instructor.email}</option>
                        ))
                      ) : (
                        <option value="" disabled>No instructors available</option>
                      )}
                    </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flight Type</label>
                  <input
                    type="text"
                    value={reservationForm.flight_type}
                    onChange={(e) => setReservationForm({ ...reservationForm, flight_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Solo, Duo Landing"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      onChange={(e) => setReservationForm({ ...reservationForm, lesson_time: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
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
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewReservationModal(false)}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Find a Time Modal */}
      {showFindTimeModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Find a Time</h3>
              <button
                onClick={() => setShowFindTimeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Find available time slots feature will be available here.</p>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFindTimeModal(false)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
