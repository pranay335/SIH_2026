const ComplaintGroup = require('../models/ComplaintGroup');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Message = require('../models/Message');
const nodemailer = require('nodemailer');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// ---------------------------------------------
//    PUT /api/feedback/:groupId - Submit feedback
// ---------------------------------------------- */
const submitFeedback = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { status, message } = req.body;
        const userId = req.user.userId;

        // Validate status
        if (!['SATISFIED', 'NOT_SATISFIED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid feedback status. Must be SATISFIED or NOT_SATISFIED' });
        }

        // Find the complaint group
        const group = await ComplaintGroup.findOne({ group_id: groupId })
            .populate('assigned_to', 'name email')
            .populate('affected_users', 'name email');

        if (!group) {
            return res.status(404).json({ message: 'Complaint group not found' });
        }

        // Check if group is in Resolved status
        if (group.status !== 'Resolved') {
            return res.status(400).json({ message: 'Feedback can only be given for resolved complaints' });
        }

        // Check if feedback already given
        if (group.feedbackStatus && group.feedbackStatus !== 'PENDING') {
            return res.status(400).json({ message: 'Feedback has already been submitted for this complaint group' });
        }

        // Check if user is an affected user (skip check for admin)
        const currentUser = await User.findById(userId);
        const isAffectedUser = group.affected_users.some(u => u._id.toString() === userId);
        const isAdmin = currentUser && currentUser.role === 'admin';

        if (!isAffectedUser && !isAdmin) {
            return res.status(403).json({ message: 'Only affected citizens or admins can submit feedback' });
        }

        // Update feedback fields
        group.feedbackStatus = status;
        group.feedbackMessage = message || '';
        group.feedbackGivenBy = userId;
        group.feedbackGivenAt = new Date();

        if (status === 'SATISFIED') {
            // Mark as Closed permanently
            group.status = 'Closed';
            group.last_updated = new Date();
            await group.save();

            // Update all individual complaints to Closed
            await Complaint.updateMany(
                { group_id: group._id },
                { status: 'Closed' }
            );

            // Notify employee of positive feedback
            if (group.assigned_to) {
                const notification = new Message({
                    sender: 'system',
                    receiverId: group.assigned_to._id,
                    title: `✅ Positive Feedback: ${groupId}`,
                    message: `A citizen has confirmed that complaint group ${groupId} was resolved satisfactorily. ${message ? 'Comment: ' + message : ''}`
                });
                await notification.save();
            }

        } else if (status === 'NOT_SATISFIED') {
            // Reopen the complaint
            group.reopened = true;
            group.reopenCount = (group.reopenCount || 0) + 1;
            group.status = 'In Progress';
            group.resolvedDate = null;
            group.last_updated = new Date();
            await group.save();

            // Update all individual complaints back to In Progress
            await Complaint.updateMany(
                { group_id: group._id },
                { status: 'In Progress', resolvedDate: null }
            );

            // Increase employee workload back
            if (group.assigned_to) {
                const employee = await User.findById(group.assigned_to._id);
                if (employee) {
                    const complaintsInGroup = await Complaint.countDocuments({ group_id: group._id });
                    const newWorkload = employee.currentWorkload + complaintsInGroup;
                    const employeeMax = employee.maxConcurrentComplaints || 5;

                    await User.findByIdAndUpdate(employee._id, {
                        currentWorkload: newWorkload,
                        ...(newWorkload >= employeeMax ? { availabilityStatus: 'BUSY' } : {})
                    });

                    console.log(`📈 Workload increased for ${employee.name}: ${employee.currentWorkload} → ${newWorkload}/${employeeMax} (complaint reopened)`);
                }

                // Notify employee of reopening
                const notification = new Message({
                    sender: 'system',
                    receiverId: group.assigned_to._id,
                    title: `🔄 Complaint Reopened: ${groupId}`,
                    message: `A citizen was not satisfied with the resolution of complaint group ${groupId}. The ticket has been reopened. ${message ? 'Reason: ' + message : ''}`
                });
                await notification.save();

                // Send email to employee
                try {
                    await transporter.sendMail({
                        from: '"CivicMind Updates" <' + process.env.GMAIL_USER + '>',
                        to: group.assigned_to.email,
                        subject: `🔄 Complaint Reopened: ${groupId}`,
                        html: `<p>Hello ${group.assigned_to.name},</p>
              <p>A citizen was <b>not satisfied</b> with the resolution of complaint group <b>${groupId}</b>.</p>
              <p>The ticket has been <b>reopened</b> and reassigned to you.</p>
              ${message ? '<p><b>Citizen\'s Reason:</b> ' + message + '</p>' : ''}
              <p>Please review and address the issue again.</p>`
                    });
                } catch (mailErr) {
                    console.error('Failed to send reopen notification email:', mailErr);
                }
            }
        }

        const updatedGroup = await ComplaintGroup.findOne({ group_id: groupId })
            .populate('assigned_to', 'name email phone')
            .populate('affected_users', 'name email')
            .populate('feedbackGivenBy', 'name email');

        res.json({
            success: true,
            message: status === 'SATISFIED'
                ? 'Thank you for your feedback! The complaint has been closed.'
                : 'Complaint has been reopened. The assigned employee will be notified.',
            group: updatedGroup
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------
//    GET /api/feedback/:groupId - Get feedback status
// ---------------------------------------------- */
const getFeedbackStatus = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await ComplaintGroup.findOne({ group_id: groupId })
            .populate('feedbackGivenBy', 'name email')
            .populate('assigned_to', 'name email')
            .select('feedbackStatus feedbackMessage feedbackGivenBy feedbackGivenAt resolution_images reopened reopenCount status group_id issue_title');

        if (!group) {
            return res.status(404).json({ message: 'Complaint group not found' });
        }

        res.json({
            success: true,
            feedback: {
                groupId: group.group_id,
                issueTitle: group.issue_title,
                status: group.status,
                feedbackStatus: group.feedbackStatus,
                feedbackMessage: group.feedbackMessage,
                feedbackGivenBy: group.feedbackGivenBy,
                feedbackGivenAt: group.feedbackGivenAt,
                resolutionImages: group.resolution_images,
                reopened: group.reopened,
                reopenCount: group.reopenCount
            }
        });

    } catch (error) {
        console.error('Error getting feedback status:', error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------
//    GET /api/feedback - Get all feedback (Admin)
// ---------------------------------------------- */
const getAllFeedback = async (req, res) => {
    try {
        const { filter } = req.query;

        // Check if user is admin
        const currentUser = await User.findById(req.user.userId);
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can view all feedback' });
        }

        // Build query - only groups that have been through feedback flow
        let query = { feedbackStatus: { $ne: null } };

        if (filter && ['PENDING', 'SATISFIED', 'NOT_SATISFIED'].includes(filter)) {
            query.feedbackStatus = filter;
        }

        const groups = await ComplaintGroup.find(query)
            .populate('assigned_to', 'name email department')
            .populate('feedbackGivenBy', 'name email')
            .populate('affected_users', 'name email')
            .sort({ feedbackGivenAt: -1, last_updated: -1 });

        // Calculate resolution time for each group
        const feedbackData = groups.map(group => {
            let resolutionTime = null;
            if (group.resolvedDate && group.first_reported) {
                resolutionTime = Math.round((new Date(group.resolvedDate) - new Date(group.first_reported)) / (1000 * 60 * 60)); // hours
            }

            return {
                groupId: group.group_id,
                issueTitle: group.issue_title,
                issueDescription: group.issue_description,
                sector: group.sector,
                status: group.status,
                priority: group.priority,
                feedbackStatus: group.feedbackStatus,
                feedbackMessage: group.feedbackMessage,
                feedbackGivenBy: group.feedbackGivenBy,
                feedbackGivenAt: group.feedbackGivenAt,
                assignedTo: group.assigned_to,
                affectedUsers: group.affected_users,
                resolutionImages: group.resolution_images,
                reopened: group.reopened,
                reopenCount: group.reopenCount,
                resolutionTimeHours: resolutionTime,
                complaintCount: group.complaint_count,
                createdAt: group.createdAt
            };
        });

        res.json({
            success: true,
            total: feedbackData.length,
            feedback: feedbackData
        });

    } catch (error) {
        console.error('Error getting all feedback:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitFeedback,
    getFeedbackStatus,
    getAllFeedback
};
