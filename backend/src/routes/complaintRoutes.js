const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  fileComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  getComplaintsByUser,
} = require('../controllers/complaintController');

// File a new complaint (protected)
router.post('/', auth, fileComplaint);

// Get all complaints (protected)
router.get('/', auth, getComplaints);

// Get complaints by user (protected)
router.get('/user/:userId', auth, getComplaintsByUser);

// Get complaint by ID (protected)
router.get('/:id', auth, getComplaintById);

// Update complaint (protected)
router.put('/:id', auth, updateComplaint);

module.exports = router;
