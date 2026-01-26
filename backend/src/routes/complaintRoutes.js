const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  fileComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  getComplaintsByUser,
  getComplaintGroups,
  getComplaintGroupById,
  assignComplaintGroup,
  updateComplaintGroupStatus,
  getDeduplicationStats,
  reverseGeocode,
  searchAddress
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

// COMPLAINT GROUPS ROUTES

// Get all complaint groups (protected)
router.get('/groups', auth, getComplaintGroups);

// Get deduplication statistics (protected)
router.get('/deduplication-stats', auth, getDeduplicationStats);

// Get specific complaint group (protected)
router.get('/groups/:groupId', auth, getComplaintGroupById);

// Assign complaint group to employee (protected)
router.put('/groups/:groupId/assign', auth, assignComplaintGroup);

// Update complaint group status (protected)
router.put('/groups/:groupId/status', auth, updateComplaintGroupStatus);

// GEOCODING ROUTES

// Reverse geocode lat/lng to address (public - no auth required)
router.get('/geocode', reverseGeocode);

// Search address by name (public - no auth required)
router.get('/search-address', searchAddress);

module.exports = router;
