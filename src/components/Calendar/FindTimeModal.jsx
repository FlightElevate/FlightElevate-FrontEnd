import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiClock, FiCalendar, FiUser, FiPackage, FiUsers, FiCheck } from 'react-icons/fi';
import { calendarService } from '../../api/services/calendarService';
import { showErrorToast } from '../../utils/notifications';


const FindTimeModal = ({
  isOpen,
  onClose,
  instructors = [],
  students = [],
  aircraft = [],
  loadingFormData = false,
  onTimeSelect,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [duration, setDuration] = useState(60);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError('');
    
    try {
      const params = {
        date: selectedDate,
        duration: duration,
      };

      if (selectedInstructor) {
        params.instructor_id = selectedInstructor;
      }

      if (selectedStudent) {
        params.student_id = selectedStudent;
      }

      if (selectedAircraft) {
        params.aircraft_id = selectedAircraft;
      }

      // Ensure all three resources are provided
      if (!params.student_id || !params.instructor_id || !params.aircraft_id) {
        setError('Please select Student, Instructor, and Aircraft to find available time slots.');
        setAvailableSlots([]);
        setLoading(false);
        return;
      }

      const response = await calendarService.getAvailableTimeSlots(params);

      if (response.success) {
        setAvailableSlots(response.data?.available_slots || []);
      } else {
        throw new Error(response.message || 'Failed to fetch available slots');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load available time slots';
      setError(errorMessage);
      showErrorToast(errorMessage);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedInstructor, selectedStudent, selectedAircraft, duration]);

  
  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchAvailableSlots();
    }
  }, [isOpen, selectedDate, selectedInstructor, selectedStudent, selectedAircraft, duration, fetchAvailableSlots]);

  
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedInstructor('');
      setSelectedStudent('');
      setSelectedAircraft('');
      setDuration(60);
      setAvailableSlots([]);
      setError('');
    }
  }, [isOpen]);

  const handleTimeSelect = (time) => {
    if (onTimeSelect) {
      onTimeSelect(
        time,
        selectedDate,
        selectedStudent || null,
        selectedInstructor || null,
        selectedAircraft || null,
        duration
      );
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-2xl font-semibold text-gray-800">Find a Time</h3>
            <p className="text-sm text-gray-600 mt-1">Find available time slots for scheduling</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close modal"
          >
            <FiX size={24} />
          </button>
        </div>

        {}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-1" size={16} />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiUsers className="inline mr-1" size={16} />
                Student
              </label>
              {loadingFormData ? (
                <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">
                  Loading...
                </div>
              ) : (
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name || student.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiUser className="inline mr-1" size={16} />
                Instructor
              </label>
              {loadingFormData ? (
                <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">
                  Loading...
                </div>
              ) : (
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  required
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name || instructor.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiPackage className="inline mr-1" size={16} />
                Aircraft
              </label>
              {loadingFormData ? (
                <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">
                  Loading...
                </div>
              ) : (
                <select
                  value={selectedAircraft}
                  onChange={(e) => setSelectedAircraft(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  required
                >
                  <option value="">Select Aircraft</option>
                  {aircraft.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.name} {ac.model ? `(${ac.model})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiClock className="inline mr-1" size={16} />
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>
          </div>
        </div>

        {}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Finding available time slots...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={fetchAvailableSlots}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <FiClock className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-2">No available time slots found</p>
              <p className="text-sm text-gray-500">
                Try selecting a different date or adjusting your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    Available Time Slots
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available
                    {selectedDate && ` on ${new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}`}
                  </p>
                </div>
                <button
                  onClick={fetchAvailableSlots}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSelect(slot.time)}
                    className="group relative p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                  >
                    <div className="flex flex-col items-center">
                      <FiClock className="text-gray-400 group-hover:text-blue-600 mb-1" size={20} />
                      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                        {formatTime(slot.time)}
                      </span>
                    </div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiCheck className="text-blue-600" size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindTimeModal;

