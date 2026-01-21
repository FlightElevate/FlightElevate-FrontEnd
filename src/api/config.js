

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const API_VERSION = 'v1';

export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;


export const ENDPOINTS = {
  
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
  },

  
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

  
  ORGANIZATIONS: {
    LIST: '/organizations',
    SHOW: (id) => `/organizations/${id}`,
    UPDATE: (id) => `/organizations/${id}`,
  },

  
  AIRCRAFT: {
    LIST: '/aircraft',
    SHOW: (id) => `/aircraft/${id}`,
    CREATE: '/aircraft',
    UPDATE: (id) => `/aircraft/${id}`,
    DELETE: (id) => `/aircraft/${id}`,
    MAINTENANCE: (id) => `/aircraft/${id}/maintenance`,
    SQUAWKS: (id) => `/aircraft/${id}/squawks`,
  },

  
  MAINTENANCE: {
    LIST: '/maintenance',
    SHOW: (id) => `/maintenance/${id}`,
    CREATE: '/maintenance',
    UPDATE: (id) => `/maintenance/${id}`,
    DELETE: (id) => `/maintenance/${id}`,
  },

  
  SQUAWKS: {
    LIST: '/squawks',
    SHOW: (id) => `/squawks/${id}`,
    CREATE: '/squawks',
    UPDATE: (id) => `/squawks/${id}`,
    RESOLVE: (id) => `/squawks/${id}/resolve`,
    DELETE: (id) => `/squawks/${id}`,
  },

  
  LESSONS: {
    LIST: '/lessons',
    SHOW: (id) => `/lessons/${id}`,
    CREATE: '/lessons',
    UPDATE: (id) => `/lessons/${id}`,
    DELETE: (id) => `/lessons/${id}`,
    READY: (id) => `/lessons/${id}/ready`,
  },
  
  RESERVATIONS: {
    LIST: '/reservations',
    SHOW: (id) => `/reservations/${id}`,
    CREATE: '/reservations',
    UPDATE: (id) => `/reservations/${id}`,
    DELETE: (id) => `/reservations/${id}`,
  },

  
  LOGBOOKS: {
    BASE: '/logbooks',
    LIST: '/logbooks',
    SHOW: (id) => `/logbooks/${id}`,
    CREATE: '/logbooks',
    UPDATE: (id) => `/logbooks/${id}`,
    DELETE: (id) => `/logbooks/${id}`,
  },

  
  SUPPORT: {
    LIST: '/support-tickets',
    SHOW: (id) => `/support-tickets/${id}`,
    CREATE: '/support-tickets',
    UPDATE: (id) => `/support-tickets/${id}`,
    COMPLETE: (id) => `/support-tickets/${id}/complete`,
    MESSAGES: (id) => `/support-tickets/${id}/messages`,
    SEND_MESSAGE: (id) => `/support-tickets/${id}/messages`,
  },

  
  ANNOUNCEMENTS: {
    LIST: '/announcements',
    SHOW: (id) => `/announcements/${id}`,
    CREATE: '/announcements',
    UPDATE: (id) => `/announcements/${id}`,
    DELETE: (id) => `/announcements/${id}`,
  },

  
  ROLES: {
    LIST: '/roles',
    SHOW: (id) => `/roles/${id}`,
    CREATE: '/roles',
    UPDATE: (id) => `/roles/${id}`,
    DELETE: (id) => `/roles/${id}`,
    PERMISSIONS: '/roles/permissions/list',
    UPDATE_PERMISSIONS: (id) => `/roles/${id}/permissions`,
  },

  
  SUBSCRIPTIONS: {
    SUBSCRIBERS: '/subscriptions/subscribers',
    PLANS: '/subscriptions/plans',
    PLAN_SHOW: (id) => `/subscriptions/plans/${id}`,
    CREATE_PLAN: '/subscriptions/plans',
    UPDATE_PLAN: (id) => `/subscriptions/plans/${id}`,
    DELETE_PLAN: (id) => `/subscriptions/plans/${id}`,
  },

  
  SUBSCRIPTION_PLANS: {
    LIST: '/subscription-plans',
    SHOW: (id) => `/subscription-plans/${id}`,
    CREATE: '/subscription-plans',
    UPDATE: (id) => `/subscription-plans/${id}`,
    DELETE: (id) => `/subscription-plans/${id}`,
  },

  
  ACTIVITY_LOGS: {
    LIST: '/activity-logs',
    SHOW: (id) => `/activity-logs/${id}`,
  },

  
  DASHBOARD: {
    STATS: '/dashboard/stats',
    WIDGETS: '/dashboard/widgets',
  },

  
  CALENDAR: {
    SCHEDULE: '/calendar/schedule',
    LOCATIONS: '/calendar/locations',
    SETTINGS: '/calendar/settings',
    AVAILABLE_SLOTS: '/calendar/available-slots',
    EVENTS: '/calendar/events',
    CREATE: '/calendar/events',
  },

  
  INBOX: {
    USER: '/chat/all',
    GETCONVERSATIONS: '/chat/conversations',
    CONVERSATION: '/chat/conversation',
    MESSAGES: (conversationId) => `/chat/conversation/${conversationId}/messages`,
    SHOW: (id) => `/inbox/messages/${id}`,
    SEND: (conversationId) =>`/chat/conversation/${conversationId}/message`,
    MARK_READ: (id) => `/inbox/messages/${id}/read`,
  },

  
  ORGANIZATIONS: {
    LIST: '/organizations',
    SHOW: (id) => `/organizations/${id}`,
    CREATE: '/organizations',
    UPDATE: (id) => `/organizations/${id}`,
    DELETE: (id) => `/organizations/${id}`,
  },


};


export const DEFAULT_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
};

