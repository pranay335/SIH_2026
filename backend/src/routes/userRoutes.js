const express = require('express');
const router = express.Router();
const {
    createEmployee,
    getEmployees,
    getUsers,
    createUser,
    registerUser,
    loginUser,
    createDefaultAdmin,
    forgotPassword,
    resetPassword,
    updateUser,
    deleteUser,
    verifyEmail,
    updatePhoneVerification
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer Config for Aadhaar XML
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `aadhaar-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.xml') {
            cb(null, true);
        } else {
            cb(new Error('Only Aadhaar XML files are allowed!'), false);
        }
    }
});

// Public routes
router.post('/register', upload.single('aadhaarXml'), registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/create-admin', createDefaultAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/', auth, getUsers);
router.post('/', auth, createUser);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.post('/update-phone-verification', auth, updatePhoneVerification);

// Admin-only employee management routes
router.post('/create-employee', auth, createEmployee);
router.get('/employees', auth, getEmployees);

module.exports = router;