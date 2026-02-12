const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const nodemailer = require('nodemailer');
const aadhaarService = require('../services/AadhaarService');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// @desc    Create employee (admin only)
// @route   POST /api/users/create-employee
// @access  Private (Admin)
const createEmployee = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { name, email, password, department, municipalityCode, employeeId, designation, phone } = req.body;
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existingEmployee = await User.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const employee = new User({
      name, email, password: hashedPassword, role: 'employee',
      department, municipalityCode: municipalityCode || 'BMC',
      employeeId: employeeId || `EMP-${Date.now()}`,
      designation: designation || 'Field Officer',
      phone: phone || '', isVerified: true,
      availabilityStatus: 'AVAILABLE', maxConcurrentComplaints: 10, currentWorkload: 0,
      performance: { avgResolutionTime: 0, successRate: 0, totalComplaintsHandled: 0 }
    });

    const savedEmployee = await employee.save();
    const employeeResponse = savedEmployee.toObject();
    delete employeeResponse.password;
    res.status(201).json({ message: 'Employee created successfully', employee: employeeResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployees = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    let query = { role: 'employee' };
    if (req.user.municipalityCode) {
      query.municipalityCode = req.user.municipalityCode;
    } else if (req.query.municipalityCode) {
      query.municipalityCode = req.query.municipalityCode;
    }
    const employees = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'user', municipalityCode } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'User already exists' });
    }
    let aadhaarVerified = false;
    if (req.file) {
      try {
        const aadhaarData = await aadhaarService.parseAadhaarXML(req.file.path);
        const validation = aadhaarService.validateMunicipality(aadhaarData, municipalityCode);
        if (!validation.isValid) {
          return res.status(403).json({ message: validation.message });
        }
        aadhaarVerified = true;
      } catch (err) {
        return res.status(400).json({ message: err.message || 'Invalid Aadhaar XML' });
      }
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const emailToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      name, email, password: hashedPassword, phone,
      municipalityCode: municipalityCode || 'BMC',
      aadhaar_verified: aadhaarVerified,
      emailVerificationToken: emailToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
      role
    });

    const savedUser = await user.save();
    try {
      const verifyURL = `http://localhost:3000/verify-email/${emailToken}`;
      await transporter.sendMail({
        from: '"CivicMind Support" <' + process.env.GMAIL_USER + '>',
        to: savedUser.email,
        subject: 'Verify your CivicMind Account',
        html: `<h1>Welcome to CivicMind</h1><p>Please verify your email clicking <a href="${verifyURL}">here</a></p>`
      });
    } catch (err) { console.error('Email failed:', err); }

    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email, role: savedUser.role, municipalityCode: savedUser.municipalityCode },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ token, user: savedUser });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    user.email_verified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    res.json({ message: 'Email verified' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updatePhoneVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.phone_verified = true;
    await user.save();
    res.json({ message: 'Phone verified' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;
    const user = await User.findOne({ email, role });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, municipalityCode: user.municipalityCode || 'BMC' },
      process.env.JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ token, user });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createUser = async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword, role });
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const createDefaultAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const admin = new User({ name, email, password: hashedPassword, role: 'admin', phone });
    const savedAdmin = await admin.save();
    res.status(201).json(savedAdmin);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    res.json({ message: 'Reset token generated', resetToken });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.clearPasswordResetFields();
    await user.save();
    res.json({ message: 'Reset successful' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) return res.status(403).json({ message: 'Not authorized' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    Object.assign(user, req.body);
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
  createEmployee, getEmployees, getUsers, registerUser, loginUser, createUser,
  createDefaultAdmin, forgotPassword, resetPassword, updateUser, deleteUser,
  verifyEmail, updatePhoneVerification
};