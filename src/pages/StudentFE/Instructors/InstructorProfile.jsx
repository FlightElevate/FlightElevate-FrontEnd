import React, { useState, useEffect } from "react";
import { FiSearch, FiMoreVertical, FiX, FiCalendar, FiClock } from "react-icons/fi";
import { useParams } from "react-router-dom";
import gear from "../../../assets/SVG/gear.svg";
import profileImg from "../../../assets/img/profile.jpg";
import { userService } from "../../../api/services/userService";
import { documentService } from "../../../api/services/documentService";
import { lessonService } from "../../../api/services/lessonService";
import { aircraftService } from "../../../api/services/aircraftService";
import { calendarService } from "../../../api/services/calendarService";
import { showDeleteConfirm, showSuccessToast, showErrorToast, showInfoToast } from "../../../utils/notifications";
import { formatDate, formatTime } from "../../../utils/dateFormatter";
import { useAuth } from "../../../context/AuthContext";

const InstructorProfile = () => {
  const { id: instructorId } = useParams();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [flightLogs, setFlightLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchLogs, setSearchLogs] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [openMenu, setOpenMenu] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [aircraft, setAircraft] = useState([]);
  const [loadingAircraft, setLoadingAircraft] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState({
    instructor: null,
    aircraft: null,
    checking: false,
  });
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [availableAircraft, setAvailableAircraft] = useState([]);
  const [requestForm, setRequestForm] = useState({
    lesson_date: '',
    lesson_time: '',
    flight_type: '',
    aircraft_id: '',
    duration_minutes: 60,
    notes: '',
  });

  useEffect(() => {
    if (instructorId) {
      fetchUser();
      fetchDocuments();
      fetchFlightLogs();
    }
  }, [instructorId]);

  const fetchUser = async () => {
    setLoadingUser(true);
    try {
      const response = await userService.getUser(instructorId);
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchDocuments = async () => {
    if (!instructorId) return;
    setLoadingDocs(true);
    try {
      const response = await documentService.getUserDocuments(instructorId);
      if (response.success) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  
  const getInstructorImage = (instructor) => {
    if (instructor?.avatar || instructor?.image || instructor?.profile_image) {
      return instructor.avatar || instructor.image || instructor.profile_image;
    }
    
    const imageIds = [1, 5, 8, 12, 15, 20, 25, 33, 47, 51, 68, 70];
    const imageId = imageIds[instructor?.id % imageIds.length] || 1;
    return `https://i.pravatar.cc/150?img=${imageId}`;
  };

  const fetchFlightLogs = async () => {
    if (!instructorId) return;
    setLoadingLogs(true);
    try {
      const response = await lessonService.getUserLessons(instructorId, { per_page: 10, type: 'instructor' });
      if (response.success) {
        setFlightLogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching flight logs:', error);
      setFlightLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDeleteDoc = async (documentId, docTitle) => {
    const confirmed = await showDeleteConfirm(docTitle || 'this document');
    if (!confirmed) return;
    
    try {
      await documentService.deleteDocument(instructorId, documentId);
      showSuccessToast('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      showErrorToast('Failed to delete document');
    }
  };

  const handleRequestSession = () => {
    setShowRequestModal(true);
    fetchAircraft();
  };

  // Fetch aircraft list
  const fetchAircraft = async () => {
    setLoadingAircraft(true);
    try {
      const response = await aircraftService.getAircraft();
      if (response.success) {
        setAircraft(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching aircraft:', error);
      setAircraft([]);
    } finally {
      setLoadingAircraft(false);
    }
  };

  // Check availability for instructor and aircraft
  const checkAvailability = async () => {
    if (!requestForm.lesson_date || !requestForm.lesson_time || !requestForm.duration_minutes) {
      return;
    }

    if (!instructorId) {
      return;
    }

    setAvailabilityStatus(prev => ({ ...prev, checking: true }));
    setAvailabilityMessage('');

    try {
      const params = {
        date: requestForm.lesson_date,
        duration: requestForm.duration_minutes || 60,
        instructor_id: parseInt(instructorId),
      };

      // Check availability for instructor
      const response = await calendarService.getAvailableTimeSlots(params);
      
      if (response.success) {
        const selectedTime = requestForm.lesson_time;
        const availableSlots = response.data.available_slots || [];
        
        // Check if selected time is in available slots for instructor
        const isInstructorAvailable = availableSlots.some(slot => {
          const slotTime = slot.time.split(':');
          const selectedTimeParts = selectedTime.split(':');
          return slotTime[0] === selectedTimeParts[0] && slotTime[1] === selectedTimeParts[1];
        });

        // Now check aircraft availability
        const availableAircraftList = [];
        
        for (const ac of aircraft) {
          const aircraftParams = {
            date: requestForm.lesson_date,
            duration: requestForm.duration_minutes || 60,
            aircraft_id: ac.id,
          };

          const aircraftResponse = await calendarService.getAvailableTimeSlots(aircraftParams);
          
          if (aircraftResponse.success) {
            const aircraftSlots = aircraftResponse.data.available_slots || [];
            const isAircraftAvailable = aircraftSlots.some(slot => {
              const slotTime = slot.time.split(':');
              const selectedTimeParts = selectedTime.split(':');
              return slotTime[0] === selectedTimeParts[0] && slotTime[1] === selectedTimeParts[1];
            });

            if (isAircraftAvailable && isInstructorAvailable) {
              availableAircraftList.push(ac);
            }
          }
        }

        setAvailableAircraft(availableAircraftList);

        // Update availability status
        setAvailabilityStatus({
          instructor: isInstructorAvailable,
          aircraft: availableAircraftList.length > 0,
          checking: false,
        });

        // Set availability message
        if (isInstructorAvailable && availableAircraftList.length > 0) {
          setAvailabilityMessage(`✅ Instructor and ${availableAircraftList.length} aircraft(s) are available at this time.`);
        } else if (isInstructorAvailable && availableAircraftList.length === 0) {
          setAvailabilityMessage('⚠️ Instructor is available but no aircraft are available at this time.');
        } else if (!isInstructorAvailable && availableAircraftList.length > 0) {
          setAvailabilityMessage('⚠️ Aircraft are available but instructor is not available at this time.');
        } else {
          setAvailabilityMessage('❌ Neither instructor nor aircraft are available at this time. Please choose a different time.');
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus(prev => ({ ...prev, checking: false }));
      setAvailabilityMessage('⚠️ Unable to check availability. Please try again.');
    }
  };

  // Debounced availability check
  useEffect(() => {
    if (!requestForm.lesson_date || !requestForm.lesson_time || !requestForm.duration_minutes) {
      setAvailabilityStatus({
        instructor: null,
        aircraft: null,
        checking: false,
      });
      setAvailabilityMessage('');
      setAvailableAircraft([]);
      return;
    }

    if (aircraft.length === 0 && !loadingAircraft) {
      // Don't check if aircraft list is not loaded yet
      return;
    }

    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestForm.lesson_date, requestForm.lesson_time, requestForm.duration_minutes, instructorId, aircraft.length, loadingAircraft]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser?.id || !instructorId) {
      showErrorToast('Unable to submit request. Please try again.');
      return;
    }

    
    if (!requestForm.lesson_date || !requestForm.lesson_time || !requestForm.flight_type) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    // Check availability before submitting
    if (availabilityStatus.checking) {
      showErrorToast('Please wait while we check availability...');
      return;
    }

    if (availabilityStatus.instructor === false || availabilityStatus.aircraft === false) {
      showErrorToast('Cannot submit request: Selected time slot is not available. Please choose a different time.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const requestData = {
        // Convert single IDs to arrays for many-to-many relationship
        student_ids: [currentUser.id],
        instructor_ids: [parseInt(instructorId)],
        flight_type: requestForm.flight_type,
        lesson_date: requestForm.lesson_date,
        lesson_time: requestForm.lesson_time,
        duration_minutes: requestForm.duration_minutes || 60,
        notes: requestForm.notes || '',
        aircraft_id: requestForm.aircraft_id || null,
        is_request: true, 
        status: 'requested', 
      };

      const response = await lessonService.createLesson(requestData);
      
      if (response.success) {
        showSuccessToast('Session request submitted successfully!');
        setShowRequestModal(false);
        setRequestForm({
          lesson_date: '',
          lesson_time: '',
          flight_type: '',
          aircraft_id: '',
          duration_minutes: 60,
          notes: '',
        });
        setAvailabilityStatus({
          instructor: null,
          aircraft: null,
          checking: false,
        });
        setAvailabilityMessage('');
        setAvailableAircraft([]);
      } else {
        showErrorToast(response.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.message ||
                          error.message || 
                          'Failed to submit session request';
      showErrorToast(errorMessage);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setRequestForm({
      lesson_date: '',
      lesson_time: '',
      flight_type: '',
      aircraft_id: '',
      duration_minutes: 60,
      notes: '',
    });
    setAvailabilityStatus({
      instructor: null,
      aircraft: null,
      checking: false,
    });
    setAvailabilityMessage('');
    setAvailableAircraft([]);
  };

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  const certificates = [
    { name: "CFI", color: "bg-blue-100 text-blue-700" },
    { name: "CFII", color: "bg-red-100 text-red-700" },
    { name: "MEI", color: "bg-yellow-100 text-yellow-700" },
  ];

  
  const filteredFlightLogs = flightLogs.filter((log) => {
    if (!searchLogs) return true;
    const searchLower = searchLogs.toLowerCase();
    return (
      log.date?.toLowerCase().includes(searchLower) ||
      log.time?.toLowerCase().includes(searchLower) ||
      log.instructor?.toLowerCase().includes(searchLower) ||
      log.status?.toLowerCase().includes(searchLower) ||
      log.flight_type?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".menu-container")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600">The user with ID {instructorId} could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-sm rounded-lg">
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
              <img 
                src={getInstructorImage(user)} 
                alt={user?.name || 'Instructor'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold';
                  fallback.textContent = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'IN';
                  parent.appendChild(fallback);
                }}
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              <div className="mt-2 flex gap-2">
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {user?.roles?.[0] || 'Student Pilot'}
                </span>
                {documents.length > 0 && (
                  <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {documents.length} Documents
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleRequestSession} className="mt-4 sm:mt-0 px-5 py-2.5 flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <img src={gear} alt="Settings" className="w-4 h-4" />
            <span className="text-sm font-medium">Request Session</span>
          </button>
        </div>
        <div className="border-b border-gray-200">
          <div className="px-6 flex gap-2">
            <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`} onClick={() => setActiveTab("profile")}>
              Profile Details
            </button>
            <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "documents" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`} onClick={() => setActiveTab("documents")}>
              Documents
            </button>
          </div>
        </div>

        {}
        {activeTab === "profile" ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mb-8">
              <div><p className="text-sm text-gray-500 mb-1">Name</p><p className="text-sm font-medium text-gray-900">{user?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Certificates</p><div className="flex gap-2">{certificates.map((cert, i) => (<span key={i} className={`px-2 py-0.5 text-xs font-medium rounded ${cert.color}`}>{cert.name}</span>))}</div></div>
              <div><p className="text-sm text-gray-500 mb-1">Location</p><p className="text-sm font-medium text-gray-900">{user?.organization?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Phone</p><p className="text-sm font-medium text-gray-900">{user?.phone || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Email</p><p className="text-sm font-medium text-gray-900">{user?.email || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Username</p><p className="text-sm font-medium text-gray-900">{user?.username || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Balance</p><p className="text-sm font-medium text-gray-900">$0.00</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Company</p><p className="text-sm font-medium text-gray-900">{user?.organization?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Created</p><p className="text-sm font-medium text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Last Flight</p><p className="text-sm font-medium text-gray-900">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Last Login</p><p className="text-sm font-medium text-gray-900">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}</p></div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Flight Logs</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 bg-white px-3 py-2 rounded-lg w-64">
                    <FiSearch className="text-gray-400 mr-2" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search flights..." 
                      value={searchLogs}
                      onChange={(e) => setSearchLogs(e.target.value)}
                      className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full" 
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                {loadingLogs ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredFlightLogs.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Instructor</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Flight Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFlightLogs.map((log, index) => (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3">{log.date || formatDate(log.full_date)}</td>
                          <td className="px-4 py-3">{log.time || formatTime(log.full_time)}</td>
                          <td className="px-4 py-3">{log.instructor}</td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{log.status}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{log.flight_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">No flight logs found</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {loadingDocs ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition">
                    <div className="w-1/3">
                      <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                    </div>
                    <div className="flex-1 flex flex-col items-end pr-4">
                      {doc.details && doc.details.length > 0 ? (
                        doc.details.map((detail, idx) => (
                          <p key={idx} className={`text-sm ${detail.toLowerCase().includes('expired') && !detail.toLowerCase().includes('expires at') ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {detail}
                          </p>
                        ))
                      ) : doc.expiry_date ? (
                        <p className={`text-sm ${doc.is_expired ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {doc.is_expired ? 'Expired: ' : 'Expires at: '}{doc.expiry_date}
                        </p>
                      ) : null}
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded menu-container relative" onClick={() => toggleMenu(index)}>
                      <FiMoreVertical className="text-gray-500" />
                      {openMenu === index && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => alert(`Edit: ${doc.title}`)}>Edit</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDeleteDoc(doc.id, doc.title)}>Delete</button>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Request Session</h3>
              <button
                onClick={handleCloseRequestModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      value={requestForm.lesson_date}
                      onChange={(e) => setRequestForm({ ...requestForm, lesson_date: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="time"
                      value={requestForm.lesson_time}
                      onChange={(e) => setRequestForm({ ...requestForm, lesson_time: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={requestForm.flight_type}
                    onChange={(e) => setRequestForm({ ...requestForm, flight_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Select Flight Type</option>
                    <option value="Solo">Solo</option>
                    <option value="Duo Landing">Duo Landing</option>
                    <option value="Windy Smooth landing">Windy Smooth landing</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Crash landing">Crash landing</option>
                    <option value="Night Flight">Night Flight</option>
                    <option value="Cross Country">Cross Country</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={requestForm.duration_minutes}
                    onChange={(e) => setRequestForm({ ...requestForm, duration_minutes: parseInt(e.target.value) || 60 })}
                    min="15"
                    max="480"
                    step="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Aircraft Dropdown - Show when we have date/time/duration and aircraft list */}
                {requestForm.lesson_date && requestForm.lesson_time && requestForm.duration_minutes && aircraft.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aircraft (Optional)
                    </label>
                    {loadingAircraft ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        Loading aircraft...
                      </div>
                    ) : (
                      <select
                        value={requestForm.aircraft_id}
                        onChange={(e) => setRequestForm({ ...requestForm, aircraft_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={availabilityStatus.checking}
                      >
                        <option value="">No aircraft selected</option>
                        {aircraft.map((ac) => {
                          // Check if this aircraft is available (only if we've checked availability)
                          const isAvailable = availableAircraft.length > 0 
                            ? availableAircraft.some(avAc => avAc.id === ac.id)
                            : true; // Show all as available if we haven't checked yet
                          
                          return (
                            <option 
                              key={ac.id} 
                              value={ac.id}
                              disabled={!isAvailable && availableAircraft.length > 0 && !availabilityStatus.checking}
                              style={!isAvailable && availableAircraft.length > 0 ? { color: '#999' } : {}}
                            >
                              {ac.name} {ac.model ? `(${ac.model})` : ''} 
                              {availableAircraft.length > 0 && !isAvailable && !availabilityStatus.checking ? ' (Not available)' : ''}
                              {isAvailable && availableAircraft.length > 0 && !availabilityStatus.checking ? ' ✓ Available' : ''}
                            </option>
                          );
                        })}
                      </select>
                    )}
                    {availabilityStatus.checking && (
                      <p className="text-xs text-gray-500 mt-1">Checking aircraft availability...</p>
                    )}
                    {!availabilityStatus.checking && availableAircraft.length === 0 && availabilityStatus.instructor === true && (
                      <p className="text-xs text-yellow-600 mt-1">No aircraft available at this time, but you can still submit the request.</p>
                    )}
                  </div>
                )}

                {/* Availability Status */}
                {availabilityMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    availabilityMessage.includes('✅') 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : availabilityMessage.includes('⚠️')
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {availabilityStatus.checking ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Checking availability...</span>
                      </div>
                    ) : (
                      availabilityMessage
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes / Special Instructions
                  </label>
                  <textarea
                    value={requestForm.notes}
                    onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                    placeholder="Any special instructions or requirements..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseRequestModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorProfile;
