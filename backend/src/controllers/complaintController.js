const Complaint = require('../models/Complaint');
const { autoAssignComplaint } = require('./assignmentController');
const crypto = require('crypto');
const { reverseGeocode, getMunicipalityFromAddress } = require('../services/geocodingService');

/* ---------------------------------------------
   Helper: Image authenticity & relevance
---------------------------------------------- */
const checkImageAuthenticity = ({ image, nlp_result, cnn_result }) => {
  const flags = [];
  let flagged = false;

  const imageHash = crypto
    .createHash('sha256')
    .update(image)
    .digest('hex');

  if (cnn_result?.confidence < 0.6) {
    flags.push('Low CNN confidence');
    flagged = true;
  }

  if (nlp_result && cnn_result) {
    const nlpSector = nlp_result.predicted_sector?.toLowerCase();
    const cnnClass = cnn_result.predicted_class?.toLowerCase();

    if (
      nlpSector &&
      cnnClass &&
      !nlpSector.includes(cnnClass) &&
      !cnnClass.includes(nlpSector)
    ) {
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

/* ---------------------------------------------
   Helper: Municipality Code
---------------------------------------------- */
const getMunicipalityCode = (locationText) => {
  const map = {
    mumbai: 'BMC',
    thane: 'TMC',
    kalyan: 'KDMC',
    pune: 'PMC',
    nagpur: 'NMC',
    nashik: 'NMC',
    aurangabad: 'AMC'
  };

  const lower = locationText.toLowerCase();
  for (const city in map) {
    if (lower.includes(city)) return map[city];
  }

  return 'BMC';
};

/* ---------------------------------------------
   POST /api/complaints
---------------------------------------------- */
const fileComplaint = async (req, res) => {
  try {
    const {
      complaint_id,
      description,
      image,
      location, // "lat, lng"
      nlp_result,
      cnn_result,
      user_id
    } = req.body;

    if (
      !complaint_id ||
      !description ||
      !image ||
      !location ||
      !nlp_result ||
      !cnn_result
    ) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    /* 🔥 CONVERT STRING LOCATION → GEOJSON */
    const [lat, lng] = location.split(',').map(Number);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        message: 'Invalid location format. Expected "lat, lng"'
      });
    }

    const geoLocation = {
      type: 'Point',
      coordinates: [lng, lat] // Mongo expects [lng, lat]
    };

    const sector = nlp_result.predicted_sector || 'General';
    const municipalityCode = getMunicipalityCode(location);

    const imageCheck = checkImageAuthenticity({
      image,
      nlp_result,
      cnn_result
    });

    const complaint = new Complaint({
      complaint_id,
      description,
      image,
      location: geoLocation, // ✅ FIXED
      sector,
      municipalityCode,
      nlp_result,
      cnn_result,
      user_id,
      status: 'Pending',
      priority:
        nlp_result.predicted_severity === 'High'
          ? 'High'
          : nlp_result.predicted_severity === 'Medium'
          ? 'Medium'
          : 'Low',
      flagged: imageCheck.flagged,
      flagReason: imageCheck.flagReason,
      imageHash: imageCheck.imageHash
    });

    const savedComplaint = await complaint.save();

    // Auto assignment
    try {
      await autoAssignComplaint(
        {
          body: {
            complaint_id: savedComplaint.complaint_id,
            sector: savedComplaint.sector,
            municipalityCode: savedComplaint.municipalityCode,
            priority: savedComplaint.priority
          }
        },
        { status: () => ({ json: () => {} }) }
      );
    } catch (err) {
      console.error('Auto-assign failed:', err);
    }

    res.status(201).json({
      message: 'Complaint filed successfully',
      complaint: savedComplaint
    });
  } catch (error) {
    console.error('Error filing complaint:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   GET /api/complaints
---------------------------------------------- */
const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('user_id', 'name email')
      .populate('assigned_to', 'name email');

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   GET /api/complaints/:id
---------------------------------------------- */
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

/* ---------------------------------------------
   PUT /api/complaints/:id
---------------------------------------------- */
const updateComplaint = async (req, res) => {
  try {
    const { status, assigned_to, notes, priority } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, assigned_to, notes, priority },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   GET /api/complaints/user/:userId
---------------------------------------------- */
const getComplaintsByUser = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      user_id: req.params.userId
    }).sort({ createdAt: -1 });

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
  getComplaintsByUser
};
