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

  const slotColors = [
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-amber-500 to-orange-500',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-cyan-500 to-sky-600',
  ];

  if (!isOpen) return null;

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const currentTimeSlotIndex = availableSlots.findIndex((slot) => {
    const [slotH, slotM] = slot.time.split(':').map(Number);
    return Math.abs(slotH * 60 + slotM - nowMinutes) <= 30;
  });

  const getSlotClassName = (index) => {
    const base = 'group relative py-5 px-4 rounded-2xl transition-all duration-200 text-center cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5';
    const color = slotColors[index % slotColors.length];
    const nowRing = currentTimeSlotIndex === index ? 'ring-4 ring-red-400 ring-offset-2' : '';
    return [base, color, nowRing].filter(Boolean).join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 shadow-sm">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Find a Time</h3>
            <p className="text-sm text-gray-500 mt-0.5">Select filters to find available time slots</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 p-2 rounded-full"
            aria-label="Close modal"
          >
            <FiX size={24} />
          </button>
        </div>

        {}
        <div className="px-7 py-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <FiCalendar className="inline mr-1" size={16} />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm hover:shadow-md transition-shadow"
              />
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <FiUsers className="inline mr-1" size={16} />
                Student
              </label>
              {loadingFormData ? (
                <div className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-500 text-sm shadow-sm">
                  Loading...
                </div>
              ) : (
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm hover:shadow-md transition-shadow"
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
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <FiUser className="inline mr-1" size={16} />
                Instructor
              </label>
              {loadingFormData ? (
                <div className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-500 text-sm shadow-sm">
                  Loading...
                </div>
              ) : (
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm hover:shadow-md transition-shadow"
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
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <FiPackage className="inline mr-1" size={16} />
                Aircraft
              </label>
              {loadingFormData ? (
                <div className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-500 text-sm shadow-sm">
                  Loading...
                </div>
              ) : (
                <select
                  value={selectedAircraft}
                  onChange={(e) => setSelectedAircraft(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm hover:shadow-md transition-shadow"
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
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <FiClock className="inline mr-1" size={16} />
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm hover:shadow-md transition-shadow"
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
        <div className="px-7 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-100 border-t-blue-600 mb-4"></div>
              <p className="text-gray-500 text-sm font-medium">Finding available time slots...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <button
                onClick={fetchAvailableSlots}
                className="mt-3 text-sm text-red-600 hover:text-red-800 font-semibold underline"
              >
                Try Again
              </button>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-16">
              <FiClock className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-600 font-semibold mb-1">No available time slots found</p>
              <p className="text-sm text-gray-400">
                Try selecting a different date or adjusting your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    Available Time Slots
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">
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
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSelect(slot.time)}
                    className={getSlotClassName(index)}
                  >
                    <div className="flex flex-col items-center">
                      <FiClock className="text-white/80 group-hover:text-white mb-2 transition-colors" size={20} />
                      <span className="text-base font-bold text-white tracking-tight">
                        {formatTime(slot.time)}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiCheck className="text-white/90" size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {}
        <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50/80">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindTimeModal;

