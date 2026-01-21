const express = require('express');
const router = express.Router();
const { getUsers, createUser, registerUser, loginUser, createDefaultAdmin, forgotPassword, resetPassword } = require('../controllers/userController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/create-admin', createDefaultAdmin); // Create default admin
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/', getUsers);
router.post('/', createUser);

module.exports = router;