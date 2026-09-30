// config/notificationEvents.js
// Event keys mirror App\Notifications\Enums\NotificationEvent on the backend.
// The backend is the source of truth for labels/channels (see GET /notifications/preferences);
// this file only holds what the UI needs: keys, categories and toast severity.

export const NOTIFICATION_EVENTS = {
  RESERVATION_REQUESTED: 'reservation.requested',
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  RESERVATION_RESCHEDULED: 'reservation.rescheduled',
  RESERVATION_AIRCRAFT_CHANGED: 'reservation.aircraft_changed',
  RESERVATION_INSTRUCTOR_CHANGED: 'reservation.instructor_changed',
  RESERVATION_REMINDER_12H: 'reservation.reminder_12h',
  RESERVATION_REMINDER_1H: 'reservation.reminder_1h',
  AIRCRAFT_GROUNDED: 'aircraft.grounded',
  MAINTENANCE_DUE: 'maintenance.due',
  WEATHER_ADVISORY: 'weather.advisory',
  LESSON_CHANGED: 'lesson.changed',
  STUDENT_PROGRESS_UPDATED: 'student.progress_updated',
  AI_REMINDER: 'ai.reminder',
  DOCUMENT_EXPIRING: 'document.expiring',
  MESSAGE_RECEIVED: 'message.received',
};

export const CATEGORY_META = {
  reservation: { label: 'Reservations' },
  aircraft: { label: 'Aircraft' },
  maintenance: { label: 'Maintenance' },
  weather: { label: 'Weather' },
  lesson: { label: 'Lessons' },
  student: { label: 'Student progress' },
  ai: { label: 'Smart reminders' },
  document: { label: 'Documents' },
  message: { label: 'Messages' },
};

export const categoryOf = (event = '') => event.split('.')[0];

// Toast severity per event. Unknown (plug-in) events fall back to "info".
const WARNING_EVENTS = new Set([
  NOTIFICATION_EVENTS.RESERVATION_CANCELLED,
  NOTIFICATION_EVENTS.AIRCRAFT_GROUNDED,
  NOTIFICATION_EVENTS.MAINTENANCE_DUE,
  NOTIFICATION_EVENTS.WEATHER_ADVISORY,
  NOTIFICATION_EVENTS.DOCUMENT_EXPIRING,
  NOTIFICATION_EVENTS.RESERVATION_REMINDER_1H,
]);

export const toastTypeFor = (notification) =>
  notification?.priority === 'high' || WARNING_EVENTS.has(notification?.event) ? 'warning' : 'info';
