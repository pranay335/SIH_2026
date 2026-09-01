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
  searchAddress,
  getAssignedComplaintGroups,
  acknowledgeComplaintGroup,
  getAdminStats,
  getFlaggedComplaints
} = require('../controllers/complaintController');

// File a new complaint (protected)
router.post('/', auth, fileComplaint);

// GEOCODING ROUTES

// Reverse geocode lat/lng to address (public - no auth required)
router.get('/geocode', reverseGeocode);

// Search address by name (public - no auth required)
router.get('/search-address', searchAddress);

// Get all complaints (protected)
router.get('/', auth, getComplaints);

// Get complaints by user (protected)
router.get('/user/:userId', auth, getComplaintsByUser);

// Get assigned complaints (protected)
router.get('/assigned/:employeeId', auth, getAssignedComplaintGroups);

// COMPLAINT GROUPS ROUTES (must be before /:id route)

// Get all complaint groups (protected)
router.get('/groups', auth, getComplaintGroups);

// Get admin dashboard statistics (protected)
router.get('/admin-stats', auth, getAdminStats);

// Get deduplication statistics (protected)
router.get('/deduplication-stats', auth, getDeduplicationStats);

// Get specific complaint group (protected)
router.get('/groups/:groupId', auth, getComplaintGroupById);

// Assign complaint group to employee (protected)
router.put('/groups/:groupId/assign', auth, assignComplaintGroup);

// Update complaint group status (protected)
router.put('/groups/:groupId/status', auth, updateComplaintGroupStatus);

// Acknowledge complaint group (protected)
router.put('/groups/:groupId/acknowledge', auth, acknowledgeComplaintGroup);

// Get flagged complaints (protected)
router.get('/flagged', auth, getFlaggedComplaints);

// Get complaint by ID (protected) - MUST BE LAST
router.get('/:id', auth, getComplaintById);

// Update complaint (protected)
router.put('/:id', auth, updateComplaint);


module.exports = router;
