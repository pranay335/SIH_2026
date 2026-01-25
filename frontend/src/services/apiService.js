// API service for communicating with backend
import { API_BASE_URL, ML_API_BASE_URL } from '../config/config.js';

// Generic fetch wrapper
const apiRequest = async (endpoint, options = {}) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('civicmind_token');
    
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// ML API request wrapper for predictions
const mlApiRequest = async (endpoint, formData) => {
  try {
    const url = `${ML_API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // Use FormData directly, don't set Content-Type
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ML API request failed:', error);
    throw error;
  }
};

// User-related API calls
export const userService = {
  async getUsers() {
    return apiRequest('/users');
  },

  async getUserById(id) {
    return apiRequest(`/users/${id}`);
  },

  async createUser(userData) {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id, userData) {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id) {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  async createEmployee(employeeData) {
    return apiRequest('/users/create-employee', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  },

  async getEmployees() {
    return apiRequest('/users/employees');
  },
};

// Complaint-related API calls
export const complaintService = {
  async fileComplaint(complaintData) {
    return apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
  },

  async getComplaints() {
    return apiRequest('/complaints');
  },

  async getComplaintById(id) {
    return apiRequest(`/complaints/${id}`);
  },

  async getComplaintsByUser(userId) {
    return apiRequest(`/complaints/user/${userId}`);
  },

  async updateComplaint(id, complaintData) {
    return apiRequest(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(complaintData),
    });
  },
};

// ML Prediction API calls
export const predictionService = {
  async predictComplaint(description, image) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('image', image);

    return mlApiRequest('/predict', formData);
  },
};

// Authentication service
export const authService = {
  async login(credentials) {
    return apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout() {
    return apiRequest('/users/logout', {
      method: 'POST',
    });
  },

  async refreshToken() {
    return apiRequest('/users/refresh', {
      method: 'POST',
    });
  },
};

// Default export for compatibility
export default {
  userService,
  complaintService,
  predictionService,
  authService
};
