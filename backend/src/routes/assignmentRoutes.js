const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  autoAssignComplaint,
  getEmployeeAssignments,
  updateAssignmentStatus,
  getAllAssignments
} = require('../controllers/assignmentController');

// Auto-assign complaint (protected)
router.post('/auto-assign', auth, autoAssignComplaint);

// Get assignments for employee (protected)
router.get('/employee/:employeeId', auth, getEmployeeAssignments);

// Update assignment status (protected)
router.put('/:id', auth, updateAssignmentStatus);

// Get all assignments (admin only)
router.get('/', auth, getAllAssignments);

module.exports = router;
