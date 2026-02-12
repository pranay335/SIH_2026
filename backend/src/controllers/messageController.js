const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message (Admin/Employee only)
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { receiverId, municipality, title, message, isBroadcast } = req.body;
        const senderRole = req.user.role;

        if (senderRole !== 'admin' && senderRole !== 'employee') {
            return res.status(403).json({ message: 'Unauthorized to send messages' });
        }

        if (isBroadcast) {
            // Broadcast logic: Create a message without a specific receiverId
            const newMessage = new Message({
                sender: senderRole,
                municipality,
                title,
                message,
                isBroadcast: true
            });
            await newMessage.save();
            return res.status(201).json({ message: 'Broadcast message sent successfully' });
        }

        // Direct message logic
        const newMessage = new Message({
            sender: senderRole,
            receiverId,
            title,
            message
        });
        await newMessage.save();

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages for logged-in user
// @route   GET /api/messages
// @access  Private
const getMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        // Fetch direct messages + applicable broadcasts
        const messages = await Message.find({
            $or: [
                { receiverId: userId },
                {
                    isBroadcast: true,
                    $or: [
                        { municipality: user.municipalityCode },
                        { municipality: { $exists: false } },
                        { municipality: '' }
                    ]
                }
            ]
        }).sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        message.read = true;
        await message.save();

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    markRead
};
