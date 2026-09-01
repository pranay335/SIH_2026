const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    submitFeedback,
    getFeedbackStatus,
    getAllFeedback
} = require('../controllers/feedbackController');

// Get all feedback (admin only) - must be before /:groupId
router.get('/', auth, getAllFeedback);

// Get feedback status for a specific group
router.get('/:groupId', auth, getFeedbackStatus);

// Submit feedback for a complaint group
router.put('/:groupId', auth, submitFeedback);

module.exports = router;
