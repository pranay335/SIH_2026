// Application configuration
export const API_BASE_URL = 'http://localhost:5000/api';
export const ML_API_BASE_URL = 'http://localhost:8000';
export const APP_NAME = 'Urban Complaint System';
export const VERSION = '1.0.0';

// API endpoints
export const API_ENDPOINTS = {
  USERS: '/users',
  COMPLAINTS: '/complaints',
  PREDICTIONS: '/predict',
};

// Feature flags
export const FEATURES = {
  enableDarkMode: true,
  enableNotifications: true,
  enableMLPredictions: true,
};

// Timeout configurations (in milliseconds)
export const TIMEOUTS = {
  API_CALL: 30000,
  ML_PREDICTION: 60000,
};
