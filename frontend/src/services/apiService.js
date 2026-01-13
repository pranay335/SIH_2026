// Example API service
// This file contains functions for making API calls

const API_BASE_URL = 'https://api.example.com';

// Generic fetch wrapper
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
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
};

// Authentication service
export const authService = {
  async login(credentials) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout() {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  async refreshToken() {
    return apiRequest('/auth/refresh', {
      method: 'POST',
    });
  },
};