import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiDotsVertical } from "react-icons/hi";
import { lessonService } from "../../../api/services/lessonService";
import { toast } from "react-toastify";

const LessonTasks = () => {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await lessonService.getLesson(lessonId);
        if (response.success) {
          const lessonData = response.data;
          setLesson(lessonData);
          
          // Extract tasks from lesson_content
          if (lessonData.lesson_content && Array.isArray(lessonData.lesson_content) && lessonData.lesson_content.length > 0) {
            setTasks(lessonData.lesson_content);
          } else {
            // If no tasks in lesson_content, create a default task from lesson data
            setTasks([{
              id: lessonData.id,
              title: lessonData.title || lessonData.lesson_title || 'Main Lesson',
              description: lessonData.description || '',
              lesson_id: lessonData.id,
            }]);
          }
        } else {
          toast.error('Failed to load lesson');
          navigate('/my-lessons');
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast.error('Failed to load lesson');
        navigate('/my-lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId, navigate]);

  const handleTaskClick = (task) => {
    // Navigate to lesson details page
    navigate(`/my-lessons/${lessonId}`);
  };

  const handleBack = () => {
    navigate('/my-lessons');
  };

  const getLessonTitle = () => {
    if (!lesson) return 'Loading...';
    if (lesson.lesson_number && lesson.title) {
      return `Lesson ${lesson.lesson_number}: ${lesson.title}`;
    }
    return lesson.title || lesson.lesson_title || 'Lesson';
  };

  if (loading) {
    return (
      <div className="p-3">
        <div className="border border-gray-200 bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson tasks...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-3">
        <div className="border border-gray-200 bg-white rounded-xl p-8 text-center">
          <p className="text-gray-600">Lesson not found</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="border border-gray-200 bg-white rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between py-5 px-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800 transition"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800">My Lessons</h2>
          </div>
        </div>

        {/* Lesson Title */}
        <div className="py-4 px-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">{getLessonTitle()}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
          </p>
        </div>

        {/* Tasks List */}
        <div className="py-4 px-4">
          <div className="space-y-0">
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <div
                  key={task.id || index}
                  className="flex items-center justify-between py-4 px-4 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {task.title || task.name || `Task ${index + 1}`}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {task.grade && (
                      <span className="text-xs font-medium text-gray-600 px-2 py-1 bg-gray-100 rounded">
                        Grade: {task.grade}
                      </span>
                    )}
                    <div 
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HiDotsVertical
                        className="text-gray-600 cursor-pointer"
                        onClick={() => setOpenMenuId(openMenuId === (task.id || index) ? null : (task.id || index))}
                      />
                      {openMenuId === (task.id || index) && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleTaskClick(task);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm">
                No tasks found for this lesson.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonTasks;

