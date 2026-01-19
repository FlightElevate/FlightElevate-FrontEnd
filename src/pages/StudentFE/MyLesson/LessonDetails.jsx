import React, { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { RiHome6Line } from "react-icons/ri";
import { FiX } from "react-icons/fi";
import { lessonService } from "../../../api/services/lessonService";
import { useRole } from "../../../hooks/useRole";
import { useAuth } from "../../../context/AuthContext";
import { showSuccessToast, showErrorToast } from "../../../utils/notifications";

const LessonDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const from = searchParams.get('from') || 'lessons'; // Default to 'lessons'
  const { isInstructor, isAdmin, isSuperAdmin, isStudent } = useRole();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'feedback'
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id || id === '0' || id === 'undefined') {
        setError("Invalid lesson ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const lessonId = parseInt(id, 10);
        if (isNaN(lessonId) || lessonId <= 0) {
          setError("Invalid lesson ID");
          setLoading(false);
          return;
        }

        // Try reservation first, then lesson (backend show method checks both, but using correct endpoint is better)
        let response = await lessonService.getReservation(lessonId);
        if (!response.success) {
          response = await lessonService.getLesson(lessonId);
        }
        
        if (response.success) {
          const lessonData = response.data;
          
          // Check if this is a lesson template (has lesson_title but no lesson_date/lesson_time)
          // For reservations, lesson_title comes from lessonTemplate relation
          const isLessonTemplate = lessonData.lesson_title && !lessonData.lesson_date && !lessonData.lesson_time;
          
          setLesson({
            id: lessonData.id,
            // For lesson templates, use lesson_title; for reservations, use flight_type
            title: isLessonTemplate 
              ? (lessonData.lesson_number ? `Lesson ${lessonData.lesson_number}: ${lessonData.lesson_title}` : lessonData.lesson_title)
              : (lessonData.flight_type || lessonData.title || "Flight Lesson"),
            status: lessonData.status || "Pending",
            description: lessonData.notes || "No description available",
            instructor: typeof lessonData.instructor === 'string' 
              ? lessonData.instructor 
              : (lessonData.instructor?.name || lessonData.instructor_name || lessonData.instructors?.[0]?.name || "N/A"),
            date: lessonData.date || lessonData.full_date || lessonData.lesson_date,
            time: lessonData.time || lessonData.full_time || lessonData.lesson_time,
            specialInstructions: lessonData.notes || "No special instructions provided.",
            aircraft: lessonData.aircraft?.name || lessonData.aircraft_name || "N/A",
            duration: lessonData.duration_minutes || 0,
            // Lesson template specific fields
            isLessonTemplate: isLessonTemplate,
            lesson_title: lessonData.lesson_title || null,
            lesson_number: lessonData.lesson_number || null,
            lesson_content: lessonData.lesson_content || [],
            feedback: lessonData.feedback || '',
            student: typeof lessonData.student === 'string' 
              ? lessonData.student 
              : (lessonData.student?.name || lessonData.student_name || lessonData.students?.[0]?.name || 'N/A'),
            instructor_ids: lessonData.instructors?.map(inst => inst.id) || [],
            student_ids: lessonData.students?.map(std => std.id) || [],
          });
          
          // Set feedback text if feedback exists
          if (lessonData.feedback) {
            setFeedbackText(lessonData.feedback);
          }
        } else {
          setError("Failed to load lesson details");
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError("Failed to load lesson details");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);


  
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

  if (loading) {
    return (
      <div className="flex flex-col px-3 sm:px-6 gap-4 sm:gap-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col px-3 sm:px-6 gap-4 sm:gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 break-words">{error || "Lesson not found"}</p>
          <button
            onClick={() => {
              if (from === 'reservations') {
                navigate('/lessons');
              } else if (from === 'requests') {
                navigate('/lessons?view=requests');
              } else if (from === 'lessons') {
                navigate('/my-lessons');
              } else {
                navigate('/lessons?view=lessons');
              }
            }}
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Back to {from === 'reservations' ? 'Reservations' : from === 'requests' ? 'Requests' : 'My Lessons'}
          </button>
        </div>
      </div>
    );
  }

  
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes || '00'} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Check if current user is the assigned instructor for this reservation
  const isAssignedInstructor = () => {
    if (!lesson || !user?.id) return false;
    return lesson.instructor_ids?.includes(user.id) || false;
  };

  // Check if current user is the assigned student for this reservation
  const isAssignedStudent = () => {
    if (!lesson || !user?.id) return false;
    return lesson.student_ids?.includes(user.id) || false;
  };

  // Check if user can see feedback tab (assigned instructor or student, or admin/superadmin)
  const canViewFeedback = () => {
    if (!lesson) return false;
    if (isAdmin() || isSuperAdmin()) return true; // Admins can view all
    return isAssignedInstructor() || isAssignedStudent();
  };

  // Check if user can edit feedback (only assigned instructor - NOT admin/superadmin)
  const canEditFeedback = () => {
    if (!lesson) return false;
    // Only assigned instructor can add/edit feedback
    return isAssignedInstructor();
  };

  // Handle submit feedback
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !lesson?.id) return;
    
    setSubmittingFeedback(true);
    try {
      const response = await lessonService.updateLesson(lesson.id, {
        feedback: feedbackText.trim()
      });
      
      if (response.success) {
        showSuccessToast('Feedback submitted successfully');
        // Update lesson state with new feedback
        setLesson(prev => ({
          ...prev,
          feedback: feedbackText.trim()
        }));
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

  return (
    <div className="flex flex-col px-3 sm:px-6 gap-4 sm:gap-6">
      <div className="flex flex-wrap text-sm text-gray-500 gap-2 sm:gap-4 leading-5.5 tracking-[0px] fw6 font-inter">
        <Link to="/" className="flex items-center  ">
          <RiHome6Line className="text-gray-500 w-5 h-5" />
        </Link>
        <span className="w-4 h-4">{">"}</span>
        <button
          onClick={() => {
            // Navigate back based on source
            if (from === 'reservations') {
              navigate('/lessons');
            } else if (from === 'requests') {
              navigate('/lessons?view=requests');
            } else if (from === 'lessons') {
              // For students, navigate to /my-lessons
              navigate('/my-lessons');
            } else {
              navigate('/lessons?view=lessons');
            }
          }}
          className="fw4  text-[#7D7D7D] hover:text-blue-600"
        >
          {from === 'reservations' ? 'Reservations' : from === 'requests' ? 'Requests' : 'My Lessons'}
        </button>
        <span className="w-4 h-4">{">"}</span>
        <span className="text-[#0A090B] font-medium break-words">{lesson.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-5 px-3 sm:px-4 border-b border-[#F3F4F6] gap-3">
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl fw6 text-gray-900 flex flex-wrap items-center gap-2 sm:gap-4 leading-[100%] tracking-[0px]">
                <span className="break-words">{lesson.title}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-[5px] align-middle leading-4.5 tracking-[4%] font-medium whitespace-nowrap ${
                    getStatusColor(lesson.status)
                  }`}
                >
                  {formatStatus(lesson.status)}
                </span>
              </h1>
              <p className="text-sm fw4 font-inter leading-5 tracking-[-0.05px] text-[#7F7D83] break-words">
                {lesson.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for Reservations when user is assigned instructor, assigned student, Admin, or SuperAdmin */}
        {!lesson.isLessonTemplate && canViewFeedback() && (
          <div className="border-b border-[#F3F4F6] px-3 sm:px-4 pt-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'details'
                    ? 'bg-[#EBF0FB] text-[#113B98] border-b-2 border-[#113B98]'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'feedback'
                    ? 'bg-[#EBF0FB] text-[#113B98] border-b-2 border-[#113B98]'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Feedback
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col text-base fw4 leading-6 tracking-[0%] gap-4 sm:gap-6 p-3 sm:p-4">
            {lesson.isLessonTemplate ? (
              // Lesson Template View - Show tasks
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col gap-3">
                  <h3 className="fw6 text-[#101828] text-base sm:text-lg">Lesson Information</h3>
                  {lesson.lesson_number && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-500">Lesson Number</span>
                      <p className="text-[#3D3D3D]">{lesson.lesson_number}</p>
                    </div>
                  )}
                  {lesson.lesson_title && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-500">Lesson Title</span>
                      <p className="text-[#3D3D3D]">{lesson.lesson_title}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="fw6 text-[#101828] text-base sm:text-lg">
                    Tasks ({lesson.lesson_content?.length || 0})
                  </h3>
                  {lesson.lesson_content && lesson.lesson_content.length > 0 ? (
                    <div className="space-y-3">
                      {lesson.lesson_content.map((task, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              {task.title && (
                                <h4 className="font-semibold text-gray-800 mb-1 break-words">{task.title}</h4>
                              )}
                              {task.description && (
                                <p className="text-[#344054] text-sm break-words">{task.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#344054] text-sm">No tasks added to this lesson yet.</p>
                  )}
                </div>
              </div>
            ) : (
              // Reservation View - Show flight details or feedback based on active tab
              <>
                {activeTab === 'details' || !canViewFeedback() ? (
                  <>
                    {/* Attached Lesson Information */}
                    {(lesson.lesson_title || lesson.lesson_number) && !lesson.isLessonTemplate && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Attached Lesson</h3>
                        <p className="text-base font-semibold text-blue-800">
                          {lesson.lesson_number && lesson.lesson_title
                            ? `Lesson ${lesson.lesson_number}: ${lesson.lesson_title}`
                            : lesson.lesson_number
                            ? `Lesson ${lesson.lesson_number}`
                            : lesson.lesson_title || 'N/A'}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 py-3">
                      {(isAssignedInstructor() || isAdmin() || isSuperAdmin()) && (
                        <div className="flex flex-col gap-3">
                          <h3 className="fw6 text-[#101828]">Student</h3>
                          <p className=" text-[#3D3D3D]">{lesson.student}</p>
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        <h3 className="fw6 text-[#101828]">Instructor</h3>
                        <p className=" text-[#3D3D3D]">{lesson.instructor}</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <h3 className="fw6 text-[#101828]">Date</h3>
                        <p className=" text-[#3D3D3D]">{formatDate(lesson.date)}</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <h3 className="fw6 text-[#101828]">Time</h3>
                        <p className=" text-[#3D3D3D]">{formatTime(lesson.time)}</p>
                      </div>
                      {lesson.aircraft && lesson.aircraft !== "N/A" && (
                        <div className="flex flex-col gap-3">
                          <h3 className="fw6 text-[#101828]">Aircraft</h3>
                          <p className=" text-[#3D3D3D]">{lesson.aircraft}</p>
                        </div>
                      )}
                      {lesson.duration && (
                        <div className="flex flex-col gap-3">
                          <h3 className="fw6 text-[#101828]">Duration</h3>
                          <p className=" text-[#3D3D3D]">{lesson.duration} minutes</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3.5">
                      <h3 className="text-base text-[#101828] leading-[100%] tracking-[0px] fw6">
                        Special Instructions
                      </h3>
                      <p className="text-[#344054]">{lesson.specialInstructions}</p>
                    </div>
                  </>
                ) : (
                  // Feedback Tab - Visible for assigned instructor, assigned student, admins, and super admins
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-base text-[#101828] leading-[100%] tracking-[0px] fw6">
                        {canEditFeedback() ? `Feedback for ${lesson.student}` : 'Feedback'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {canEditFeedback() 
                          ? 'Add feedback for this reservation and student.'
                          : 'View feedback from your instructor.'}
                      </p>
                    </div>

                    {canEditFeedback() ? (
                      // Only assigned Instructor can add/edit feedback
                      <>
                        <div className="flex flex-col gap-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Feedback
                          </label>
                          <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            rows={8}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Enter your feedback for this lesson and student..."
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            onClick={handleSubmitFeedback}
                            disabled={submittingFeedback || !feedbackText.trim()}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {submittingFeedback ? 'Submitting...' : lesson.feedback ? 'Update Feedback' : 'Submit Feedback'}
                          </button>
                        </div>

                        {lesson.feedback && (
                          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Feedback:</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{lesson.feedback}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      // Students and Admins can only view feedback (read-only)
                      <div className="flex flex-col gap-3">
                        {lesson.feedback ? (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Instructor Feedback:</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{lesson.feedback}</p>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                            <p className="text-sm text-gray-500">No feedback has been added yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
      </div>
    </div>
  );
};

export default LessonDetails;
