// Example types file
// This file contains TypeScript-like type definitions (for JavaScript with JSDoc or future TS migration)

// User types
/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} role - User role
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} CreateUserRequest
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} password - User password
 */

/**
 * @typedef {Object} UpdateUserRequest
 * @property {string} [name] - User name
 * @property {string} [email] - User email
 * @property {string} [role] - User role
 */

// API Response types
/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} data - Response data
 * @property {string} [message] - Response message
 * @property {string} [error] - Error message if success is false
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} items - Array of items
 * @property {number} total - Total number of items
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} totalPages - Total number of pages
 */

// Form types
/**
 * @typedef {Object} LoginForm
 * @property {string} email - User email
 * @property {string} password - User password
 */

/**
 * @typedef {Object} RegisterForm
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} password - User password
 * @property {string} confirmPassword - Password confirmation
 */

// Component prop types
/**
 * @typedef {Object} ButtonProps
 * @property {string} [variant] - Button variant ('primary', 'secondary', 'danger')
 * @property {boolean} [disabled] - Whether the button is disabled
 * @property {Function} [onClick] - Click handler
 * @property {React.ReactNode} children - Button content
 */

/**
 * @typedef {Object} InputProps
 * @property {string} name - Input name
 * @property {string} [type] - Input type
 * @property {string} [placeholder] - Input placeholder
 * @property {string} value - Input value
 * @property {Function} onChange - Change handler
 * @property {string} [error] - Error message
 */

// Utility types
/**
 * @typedef {Object.<string, any>} Dictionary
 */

/**
 * @typedef {(string|number|boolean|null|undefined)} Primitive
 */

// Export types for potential future TypeScript migration
export const TYPES = {
  USER_ROLES: ['admin', 'user', 'guest'],
  HTTP_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  THEME_MODES: ['light', 'dark'],
};