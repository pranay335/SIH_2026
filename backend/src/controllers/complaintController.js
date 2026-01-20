const Complaint = require('../models/Complaint');

// @desc    File a new complaint
// @route   POST /api/complaints
// @access  Public
const fileComplaint = async (req, res) => {
  try {
    const { complaint_id, description, image, nlp_result, cnn_result, user_id } = req.body;

    // Validate required fields
    if (!complaint_id || !description || !image || !nlp_result || !cnn_result) {
      return res.status(400).json({
        message: 'Missing required fields: complaint_id, description, image, nlp_result, cnn_result',
      });
    }

    // Create new complaint
    const complaint = new Complaint({
      complaint_id,
      description,
      image,
      nlp_result,
      cnn_result,
      user_id,
      status: 'Pending',
      // Set priority based on predicted severity
      priority:
        nlp_result.predicted_severity === 'High'
          ? 'High'
          : nlp_result.predicted_severity === 'Medium'
            ? 'Medium'
            : 'Low',
    });

    const savedComplaint = await complaint.save();
    res.status(201).json({
      message: 'Complaint filed successfully',
      complaint: savedComplaint,
    });
  } catch (error) {
    console.error('Error filing complaint:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Public
const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('user_id', 'name email').populate('assigned_to', 'name email');
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Public
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user_id', 'name email')
      .populate('assigned_to', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id
// @access  Public
const updateComplaint = async (req, res) => {
  try {
    const { status, assigned_to, notes, priority } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status,
        assigned_to,
        notes,
        priority,
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({
      message: 'Complaint updated successfully',
      complaint,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complaints by user
// @route   GET /api/complaints/user/:userId
// @access  Public
const getComplaintsByUser = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user_id: req.params.userId })
      .populate('assigned_to', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  fileComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  getComplaintsByUser,
};
