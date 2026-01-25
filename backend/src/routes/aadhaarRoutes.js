const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendAadhaarOTP,
  verifyAadhaarOTP,
  getAadhaarStatus
} = require('../controllers/aadhaarController');

// Send OTP for Aadhaar verification (protected)
router.post('/send-otp', auth, sendAadhaarOTP);

// Verify OTP (protected)
router.post('/verify-otp', auth, verifyAadhaarOTP);

// Get verification status (protected)
router.get('/status', auth, getAadhaarStatus);

module.exports = router;
