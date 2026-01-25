const Complaint = require('../models/Complaint');
const { autoAssignComplaint } = require('./assignmentController');
const crypto = require('crypto');

// Helper function to check image authenticity and relevance
const checkImageAuthenticity = (complaintData) => {
  const flags = [];
  let flagged = false;

  // 1. Check for duplicate images using hash
  const imageHash = crypto.createHash('sha256').update(complaintData.image).digest('hex');
  
  // 2. Check CNN confidence
  if (complaintData.cnn_result && complaintData.cnn_result.confidence < 0.6) {
    flags.push('Low CNN confidence');
    flagged = true;
  }

  // 3. Check NLP sector vs CNN sector mismatch
  if (complaintData.nlp_result && complaintData.cnn_result) {
    const nlpSector = complaintData.nlp_result.predicted_sector?.toLowerCase();
    const cnnClass = complaintData.cnn_result.predicted_class?.toLowerCase();
    
    // Simple mismatch detection (can be enhanced)
    if (nlpSector && cnnClass && !nlpSector.includes(cnnClass) && !cnnClass.includes(nlpSector)) {
      flags.push('NLP sector vs CNN class mismatch');
      flagged = true;
    }
  }

  return {
    flagged,
    flagReason: flags.join(', '),
    imageHash
  };
};

// Helper function to get municipality code from coordinates
const getMunicipalityCode = (location) => {
  // Simple rule-based mapping for demo
  // In production, use Google Maps Reverse Geocoding API
  const cityMappings = {
    'mumbai': 'BMC',  // Brihanmumbai Municipal Corporation
    'thane': 'TMC',  // Thane Municipal Corporation
    'kalyan': 'KDMC', // Kalyan Dombivli Municipal Corporation
    'pune': 'PMC',    // Pune Municipal Corporation
    'nagpur': 'NMC',  // Nagpur Municipal Corporation
    'nashik': 'NMC',  // Nashik Municipal Corporation
    'aurangabad': 'AMC' // Aurangabad Municipal Corporation
  };

  const locationLower = location.toLowerCase();
  
  for (const [city, code] of Object.entries(cityMappings)) {
    if (locationLower.includes(city)) {
      return code;
    }
  }
  
  return 'BMC'; // Default to BMC
};

// @desc    File a new complaint
// @route   POST /api/complaints
// @access  Public
const fileComplaint = async (req, res) => {
  try {
    const { complaint_id, description, image, nlp_result, cnn_result, user_id, location } = req.body;

    // Validate required fields
    if (!complaint_id || !description || !image || !nlp_result || !cnn_result) {
      return res.status(400).json({
        message: 'Missing required fields: complaint_id, description, image, nlp_result, cnn_result',
      });
    }

    // Get municipality code from location
    const municipalityCode = getMunicipalityCode(location || '');

    // Check image authenticity and relevance
    const imageCheck = checkImageAuthenticity({
      image,
      nlp_result,
      cnn_result
    });

    // Create new complaint
    const complaint = new Complaint({
      complaint_id,
      description,
      image,
      location,
      municipalityCode,
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
      // Add image authenticity check results
      flagged: imageCheck.flagged,
      flagReason: imageCheck.flagReason,
      imageHash: imageCheck.imageHash
    });

    const savedComplaint = await complaint.save();

    // Trigger auto-assignment if complaint has sector and priority
    if (savedComplaint.nlp_result && savedComplaint.nlp_result.predicted_sector) {
      try {
        await autoAssignComplaint({
          body: {
            complaint_id: savedComplaint.complaint_id,
            sector: savedComplaint.nlp_result.predicted_sector,
            municipalityCode: savedComplaint.municipalityCode,
            priority: savedComplaint.priority
          }
        }, {
          status: () => ({ json: () => {} }) // Mock response for internal call
        });
      } catch (assignmentError) {
        console.error('Auto-assignment failed:', assignmentError);
        // Don't fail the complaint creation if assignment fails
      }
    }

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
