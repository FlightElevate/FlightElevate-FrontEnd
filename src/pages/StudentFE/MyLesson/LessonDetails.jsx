import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { RiHome6Line } from "react-icons/ri";
import { lessonService } from "../../../api/services/lessonService";

const LessonDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Details");
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const response = await lessonService.getLesson(lessonId);
        
        if (response.success) {
          const lessonData = response.data;
          setLesson({
            id: lessonData.id,
            title: lessonData.flight_type || "Flight Lesson",
            status: lessonData.status || "Pending",
            description: lessonData.notes || "No description available",
            instructor: lessonData.instructor?.name || lessonData.instructor_name || "N/A",
            date: lessonData.date || lessonData.full_date || lessonData.lesson_date,
            time: lessonData.time || lessonData.full_time || lessonData.lesson_time,
            specialInstructions: lessonData.notes || "No special instructions provided.",
            aircraft: lessonData.aircraft?.name || lessonData.aircraft_name || "N/A",
            duration: lessonData.duration_minutes || 0,
            feedback: lessonData.feedback || "No feedback available yet.",
          });
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

  // Get status colors with case-insensitive matching
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

  // Format status for display (capitalize first letter)
  const formatStatus = (status) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col px-6 gap-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col px-6 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "Lesson not found"}</p>
          <Link to="/my-lessons" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to My Lessons
          </Link>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Format time
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

  return (
    <div className="flex  flex-col px-6 gap-6">
      <div className="flex  text-sm text-gray-500  gap-4 leading-5.5 tracking-[0px] fw6 font-inter">
        <Link to="/" className="flex items-center  ">
          <RiHome6Line className="text-gray-500 w-5 h-5" />
        </Link>
        <span className="w-4 h-4">{">"}</span>
        <Link to="/my-lessons" className="fw4  text-[#7D7D7D]">
          My Lessons
        </Link>
        <span className="w-4 h-4">{">"}</span>
        <span className="text-[#0A090B] font-medium">{lesson.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm ">
        <div className=" border-b border-gray-100">
          <div className="flex items-center justify-between py-5 px-4 border-b border-[#F3F4F6]">
            <div className=" flex flex-col gap-2.5">
              <h1 className="text-xl fw6 text-gray-900 flex items-center gap-4 leading-[100%] tracking-[0px] ">
                {lesson.title}
                <span
                  className={`text-xs px-2 py-1 rounded-[5px] align-middle leading-4.5 tracking-[4%] font-medium ${
                    getStatusColor(lesson.status)
                  }`}
                >
                  {formatStatus(lesson.status)}
                </span>
              </h1>
              <p className="text-sm fw4 font-inter leading-5 tracking-[-0.05px] text-[#7F7D83] ">
                {lesson.description}
              </p>
            </div>
          </div>

          <div className="flex border-b border-gray-200 py-3 px-4 gap-4 ">
            {["Details", "Feedback"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? " text-[#262628] bg-[#C6E4FF]"
                    : " text-[#8A8A8A] hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Details" && (
          <div className="flex flex-col  text-base fw4  leading-6 tracking-[0%] gap-6 p-4 ">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-3">
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
              {lesson.aircraft && (
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
          </div>
        )}

        {activeTab === "Feedback" && (
          <div className=" flex flex-col gap-2 p-5 text-sm">
            <h3 className="text-base text-[#101828] leading-[100%] tracking-[0px] fw6">
              Feedback
            </h3>
            <p className="text-[#344054] leading-6 tracking-[0%]">
              {lesson.feedback}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetails;
