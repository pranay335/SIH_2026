const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// @desc    Create employee (admin only)
// @route   POST /api/users/create-employee
// @access  Private (Admin)
const createEmployee = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, email, password, department, municipalityCode, employeeId, designation } = req.body;

    // Validate required fields
    if (!name || !email || !password || !department) {
      return res.status(400).json({
        message: 'Missing required fields: name, email, password, department'
      });
    }

    // Check if employee already exists
    const existingEmployee = await User.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employee
    const employee = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      department,
      municipalityCode: municipalityCode || 'BMC',
      employeeId: employeeId || `EMP${Date.now()}`,
      designation: designation || 'Field Officer',
      phone: '',
      availabilityStatus: 'AVAILABLE',
      maxConcurrentComplaints: 10,
      currentWorkload: 0,
      performance: {
        avgResolutionTime: 0,
        successRate: 0,
        totalComplaintsHandled: 0
      }
    });

    const savedEmployee = await employee.save();
    console.log(`Employee created: ${email} (${savedEmployee.employeeId})`);

    // Remove password from response
    const employeeResponse = savedEmployee.toObject();
    delete employeeResponse.password;

    res.status(201).json({
      message: 'Employee created successfully',
      employee: employeeResponse
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all employees (admin only)
// @route   GET /api/users/employees
// @access  Private (Admin)
const getEmployees = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const employees = await User.find({ role: 'employee' })
      .select('-password -aadhaarHash -aadhaarOTP -aadhaarOTPExpires')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'user' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role // Allow role specification for admin creation
    });

    const savedUser = await user.save();
    console.log(` User registered successfully: ${email} (${savedUser.role})`);

    // Generate JWT
    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        phone: savedUser.phone
      }
    });
  } catch (error) {
    console.error(' Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check role
    if (user.role !== role) {
      return res.status(400).json({ message: 'Invalid role for this account' });
    }

    console.log(` User logged in successfully: ${email} (${user.role})`);

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(' Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a user (admin only)
// @route   POST /api/users
// @access  Private
const createUser = async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword, role });
    const savedUser = await user.save();
    
    res.status(201).json({
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create default admin user
// @route   POST /api/users/create-admin
// @access  Public (for initial setup)
const createDefaultAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const admin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      phone
    });

    const savedAdmin = await admin.save();
    console.log(` Default admin created: ${email}`);

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role,
        phone: savedAdmin.phone
      }
    });
  } catch (error) {
    console.error(' Error creating admin:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    console.log(` Password reset token generated for: ${email}`);
    console.log(` Reset token (for development): ${resetToken}`);
    
    // In production, you would send an email here
    // For now, we'll just return success with the token for development
    res.json({
      message: 'Password reset link sent to your email',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error(' Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset fields
    user.password = hashedPassword;
    user.clearPasswordResetFields();
    await user.save();

    console.log(` Password reset successful for: ${user.email}`);

    res.json({
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error(' Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createEmployee,
  getEmployees,
  getUsers, 
  registerUser, 
  loginUser, 
  createUser,
  createDefaultAdmin,
  forgotPassword,
  resetPassword
};