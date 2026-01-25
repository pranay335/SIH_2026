const express = require('express');
const router = express.Router();
const { createEmployee, getEmployees, getUsers, createUser, registerUser, loginUser, createDefaultAdmin, forgotPassword, resetPassword } = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/create-admin', createDefaultAdmin); // Create default admin
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/', auth, getUsers);
router.post('/', auth, createUser);

// Admin-only employee management routes
router.post('/create-employee', auth, createEmployee);
router.get('/employees', auth, getEmployees);

module.exports = router;