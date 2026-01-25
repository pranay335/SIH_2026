const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Send OTP for Aadhaar verification (sandbox)
// @route   POST /api/users/aadhaar/send-otp
// @access  Private
const sendAadhaarOTP = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;

    // Validate Aadhaar number (12 digits)
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ message: 'Invalid Aadhaar number format' });
    }

    // Hash Aadhaar number for storage
    const aadhaarHash = await bcrypt.hash(aadhaarNumber, 10);

    // In sandbox, generate a static OTP
    const staticOTP = '123456';

    // Store OTP and hash in user record (in production, use Redis with TTL)
    await User.findByIdAndUpdate(req.user.id, {
      aadhaarHash,
      aadhaarOTP: staticOTP,
      aadhaarOTPExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
      aadhaarVerified: false
    });

    res.json({
      message: 'OTP sent successfully (sandbox mode)',
      otp: staticOTP // Only in sandbox mode
    });

  } catch (error) {
    console.error('Send Aadhaar OTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP and complete Aadhaar verification
// @route   POST /api/users/aadhaar/verify-otp
// @access  Private
const verifyAadhaarOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and hasn't expired
    if (!user.aadhaarOTP || Date.now() > user.aadhaarOTPExpires) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    // Verify OTP (in sandbox, accept static OTP)
    if (otp !== user.aadhaarOTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified
    await User.findByIdAndUpdate(req.user.id, {
      aadhaarVerified: true,
      aadhaarLast4: user.aadhaarHash.slice(-4), // Store last 4 of hash (not real Aadhaar)
      aadhaarOTP: null,
      aadhaarOTPExpires: null
    });

    res.json({
      message: 'Aadhaar verification successful',
      verified: true
    });

  } catch (error) {
    console.error('Verify Aadhaar OTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check Aadhaar verification status
// @route   GET /api/users/aadhaar/status
// @access  Private
const getAadhaarStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('aadhaarVerified aadhaarLast4');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      verified: user.aadhaarVerified,
      last4: user.aadhaarVerified ? user.aadhaarLast4 : null
    });

  } catch (error) {
    console.error('Get Aadhaar status error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendAadhaarOTP,
  verifyAadhaarOTP,
  getAadhaarStatus
};
