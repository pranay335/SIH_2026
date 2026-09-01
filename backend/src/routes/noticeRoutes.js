const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');

// Create a new notice (protected - admin only)
router.post('/', auth, adminAuth, createNotice);

// Get all notices for user's municipality (protected)
router.get('/', auth, getNotices);

// Get notice by ID (protected)
router.get('/:id', auth, getNoticeById);

// Update notice (protected - admin only)
router.put('/:id', auth, adminAuth, updateNotice);

// Delete notice (protected - admin only)
router.delete('/:id', auth, adminAuth, deleteNotice);

module.exports = router;
