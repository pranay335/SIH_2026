const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'employee'],
    default: 'user',
  },
  phone: {
    type: String,
    default: '',
  },
  municipalityId: {
    type: String,
    default: '',
  },
  municipalityCode: {
    type: String,
    ref: 'Municipality',
    default: 'BMC'
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  aadhaarVerified: {
    type: Boolean,
    default: false,
  },
  aadhaarLast4: {
    type: String,
  },
  aadhaarHash: {
    type: String,
  },
  aadhaarOTP: {
    type: String,
  },
  aadhaarOTPExpires: {
    type: Date,
  },
  // Employee specific fields
  employeeId: {
    type: String,
    sparse: true,
    unique: true,
  },
  department: {
    type: String,
    enum: ['Water', 'Roads', 'Waste', 'Electricity', 'Health', 'General'],
  },
  designation: {
    type: String,
  },
  workArea: {
    type: {
      type: String,
      enum: ['Polygon'],
    },
    coordinates: [[[Number]]],
  },
  skills: [String],
  maxConcurrentComplaints: {
    type: Number,
    default: 10,
  },
  currentWorkload: {
    type: Number,
    default: 0,
  },
  availabilityStatus: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_LEAVE'],
    default: 'AVAILABLE',
  },
  performance: {
    avgResolutionTime: { type: Number }, // hours
    successRate: { type: Number }, // percentage
    totalComplaintsHandled: { type: Number, default: 0 }
  },
  workingHours: {
    start: { type: String }, // "09:00"
    end: { type: String } // "17:00"
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Clear password reset fields
userSchema.methods.clearPasswordResetFields = function() {
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
};

module.exports = mongoose.model('User', userSchema);