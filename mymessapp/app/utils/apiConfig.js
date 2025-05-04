import { Platform } from 'react-native';

// Change this value based on your environment
// For physical device testing, use your computer's IP address on the same network
// Example: '192.168.1.10:8080'
const API_HOST = 'localhost:8080';

// API configuration
const getBaseUrl = () => {
  // For web platform in development
  if (Platform.OS === 'web' && __DEV__) {
    return `http://${API_HOST}`;
  }
  
  // For Android emulator, use 10.0.2.2 (special IP to access host loopback interface)
  if (Platform.OS === 'android' && __DEV__) {
    return `http://10.0.2.2:8080`;
  }
  
  // For iOS simulator, use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    return `http://localhost:8080`;
  }
  
  // For physical devices or production, use actual server address
  // Change this to your production API URL when deploying
  return `http://${API_HOST}`;
};

export const API_BASE_URL = getBaseUrl();

// For debugging
console.log('Platform:', Platform.OS);
console.log('Using API URL:', API_BASE_URL);

// API endpoints
export const API_ENDPOINTS = {
  LEAVE: {
    APPLY: '/leave/apply',
    GET_BY_USER_EMAIL: (email) => `/leave/user/email/${encodeURIComponent(email)}`,
    GET_BY_OWNER_EMAIL: (email) => `/leave/owner/${encodeURIComponent(email)}`,
    GET_PENDING_BY_OWNER: (email) => `/leave/pending/owner/${encodeURIComponent(email)}`,
    APPROVE: (id) => `/leave/approve/${id}`,
    REJECT: (id) => `/leave/reject/${id}`,
    DELETE: (id) => `/leave/${id}`,
  },
  ATTENDANCE: {
    BY_USER: (email) => `/attendance/by-user?userEmail=${encodeURIComponent(email)}`,
    PRESENT_DATES_ONLY: (email) => `/attendance/present-dates-only?userEmail=${encodeURIComponent(email)}`,
    MONTHLY_SUMMARY: (email, year, month) => `/attendance/monthly-summary?userEmail=${encodeURIComponent(email)}&year=${year}&month=${month}`,
    BY_DATE_RANGE: (email, startDate, endDate) => `/attendance/present-dates/range?userEmail=${encodeURIComponent(email)}&startDate=${startDate}&endDate=${endDate}`
  },
  PAYMENT: {
    RECORD: '/payment/record',
    GET_USER_PAYMENTS: (email) => `/payment/user/${encodeURIComponent(email)}`,
    GET_MESS_PAYMENTS: (messId) => `/payment/mess/${encodeURIComponent(messId)}`,
    GET_USER_MESS_PAYMENTS: (email, messId) => `/payment/user/${encodeURIComponent(email)}/mess/${encodeURIComponent(messId)}`,
    GET_PENDING_DUES: (email, messId) => `/payment/pending/user/${encodeURIComponent(email)}/mess/${encodeURIComponent(messId)}`,
    GET_TOTAL_PENDING_DUES: (messId) => `/payment/total-pending/mess/${encodeURIComponent(messId)}`
  }
};

// Helper function to create full API URL
export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`; 