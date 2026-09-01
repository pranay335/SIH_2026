const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markRead } = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.post('/', auth, sendMessage);
router.get('/', auth, getMessages);
router.put('/:id/read', auth, markRead);

module.exports = router;
