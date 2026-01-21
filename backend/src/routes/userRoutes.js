const express = require('express');
const router = express.Router();
const { getUsers, createUser, registerUser, loginUser, createDefaultAdmin } = require('../controllers/userController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/create-admin', createDefaultAdmin); // Create default admin

// Protected routes
router.get('/', getUsers);
router.post('/', createUser);

module.exports = router;