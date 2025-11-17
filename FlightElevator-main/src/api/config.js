// API Configuration for FlightElevate Backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },

  // Settings
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
  },

  // Users
  USERS: {
    LIST: '/users',
    SHOW: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    ASSIGN_ROLE: (id) => `/users/${id}/roles`,
    BLOCK_USER: (id) => `/users/${id}/block`,
    UPDATE_PROFILE: '/users/profile/update',
    DOCUMENTS: (userId) => `/users/${userId}/documents`,
    DOCUMENT_DELETE: (userId, docId) => `/users/${userId}/documents/${docId}`,
  },

  // Aircraft
  AIRCRAFT: {
    LIST: '/aircraft',
    SHOW: (id) => `/aircraft/${id}`,
    CREATE: '/aircraft',
    UPDATE: (id) => `/aircraft/${id}`,
    DELETE: (id) => `/aircraft/${id}`,
    MAINTENANCE: (id) => `/aircraft/${id}/maintenance`,
    SQUAWKS: (id) => `/aircraft/${id}/squawks`,
  },

  // Lessons
  LESSONS: {
    LIST: '/lessons',
    SHOW: (id) => `/lessons/${id}`,
    CREATE: '/lessons',
    UPDATE: (id) => `/lessons/${id}`,
    DELETE: (id) => `/lessons/${id}`,
    READY: (id) => `/lessons/${id}/ready`,
  },

  // Support
  SUPPORT: {
    LIST: '/support-tickets',
    SHOW: (id) => `/support-tickets/${id}`,
    CREATE: '/support-tickets',
    UPDATE: (id) => `/support-tickets/${id}`,
    COMPLETE: (id) => `/support-tickets/${id}/complete`,
    MESSAGES: (id) => `/support-tickets/${id}/messages`,
    SEND_MESSAGE: (id) => `/support-tickets/${id}/messages`,
  },

  // Announcements
  ANNOUNCEMENTS: {
    LIST: '/announcements',
    SHOW: (id) => `/announcements/${id}`,
    CREATE: '/announcements',
    UPDATE: (id) => `/announcements/${id}`,
    DELETE: (id) => `/announcements/${id}`,
  },

  // Roles & Permissions
  ROLES: {
    LIST: '/roles',
    SHOW: (id) => `/roles/${id}`,
    CREATE: '/roles',
    UPDATE: (id) => `/roles/${id}`,
    DELETE: (id) => `/roles/${id}`,
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    SUBSCRIBERS: '/subscriptions/subscribers',
    PLANS: '/subscriptions/plans',
    PLAN_SHOW: (id) => `/subscriptions/plans/${id}`,
    CREATE_PLAN: '/subscriptions/plans',
    UPDATE_PLAN: (id) => `/subscriptions/plans/${id}`,
    DELETE_PLAN: (id) => `/subscriptions/plans/${id}`,
  },

  // Activity Logs
  ACTIVITY_LOGS: {
    LIST: '/activity-logs',
    SHOW: (id) => `/activity-logs/${id}`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    WIDGETS: '/dashboard/widgets',
  },

  // Calendar
  CALENDAR: {
    SCHEDULE: '/calendar/schedule',
    LOCATIONS: '/calendar/locations',
    SETTINGS: '/calendar/settings',
    AVAILABLE_SLOTS: '/calendar/available-slots',
    EVENTS: '/calendar/events',
    CREATE: '/calendar/events',
  },

  // Inbox
  INBOX: {
    MESSAGES: '/inbox/messages',
    SHOW: (id) => `/inbox/messages/${id}`,
    SEND: '/inbox/messages',
    MARK_READ: (id) => `/inbox/messages/${id}/read`,
  },

  // Organizations
  ORGANIZATIONS: {
    LIST: '/organizations',
    SHOW: (id) => `/organizations/${id}`,
    CREATE: '/organizations',
    UPDATE: (id) => `/organizations/${id}`,
    DELETE: (id) => `/organizations/${id}`,
  },
};

// Request configuration
export const DEFAULT_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
};

