// Base URL for API requests
export const BASE_URL = 'http://localhost:8080'; // Update this with your actual API base URL

// API endpoints
export const ENDPOINTS = {
  // User endpoints
  USER: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
    GET_BY_MESS_ID: (messId: string) => `/api/user/mess/${messId}`,
  },
  
  // Mess endpoints
  MESS: {
    CREATE: '/api/mess/create',
    GET: (messId: string) => `/api/mess/${messId}`,
    UPDATE: '/api/mess/update',
    JOIN: '/api/mess/join',
    LEAVE: '/api/mess/leave',
  },
  
  // Menu endpoints
  MENU: {
    GET: (messId: string) => `/api/menu/${messId}`,
    UPDATE: '/api/menu/update',
  },
  
  // Notification endpoints
  NOTIFICATION: {
    GET_USER_NOTIFICATIONS: (userEmail: string) => `/api/notifications/user/${userEmail}`,
    SEND: '/api/notifications/send',
    SEND_BULK: '/api/notifications/send-bulk',
    MARK_READ: (notificationId: string) => `/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: (userEmail: string) => `/api/notifications/user/${userEmail}/read-all`,
  },
  
  // Payment endpoints
  PAYMENT: {
    CREATE: '/api/payment/create',
    GET_USER_PAYMENTS: (userEmail: string) => `/api/payment/user/${userEmail}`,
    GET_MESS_PAYMENTS: (messId: string) => `/api/payment/mess/${messId}`,
  },
};

// Request timeouts
export const REQUEST_TIMEOUT = 10000; // 10 seconds 