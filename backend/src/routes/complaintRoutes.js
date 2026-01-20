const express = require('express');
const router = express.Router();
const {
  fileComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  getComplaintsByUser,
} = require('../controllers/complaintController');

// File a new complaint
router.post('/', fileComplaint);

// Get all complaints
router.get('/', getComplaints);

// Get complaints by user
router.get('/user/:userId', getComplaintsByUser);

// Get complaint by ID
router.get('/:id', getComplaintById);

// Update complaint
router.put('/:id', updateComplaint);

module.exports = router;
