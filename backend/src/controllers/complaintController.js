const Complaint = require('../models/Complaint');
const ComplaintGroup = require('../models/ComplaintGroup');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Message = require('../models/Message');
const deduplicationService = require('../services/deduplicationService');
const geocodingService = require('../services/geocodingService');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

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
   Helper: Normalize sector to department
---------------------------------------------- */
const normalizeSectorToDepartment = (sector) => {
  const s = sector.toLowerCase();
  if (s.includes('water')) return 'Water';
  if (s.includes('road')) return 'Roads';
  if (s.includes('waste') || s.includes('garbage')) return 'Waste';
  if (s.includes('electric')) return 'Electricity';
  if (s.includes('health') || s.includes('medical')) return 'Health';
  if (s.includes('drain') || s.includes('sewer')) return 'Drainage';
  return 'General';
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

    // 🗺️ GEOCODE COORDINATES TO ADDRESS
    console.log('🗺️ Geocoding coordinates to address...');
    let address;
    try {
      address = await geocodingService.reverseGeocodeWithRetry(lat, lng);
      console.log('✅ Geocoding successful:', address.fullAddress);
    } catch (geocodingError) {
      console.error('❌ Geocoding failed:', geocodingError);
      address = geocodingService.getFallbackAddress(lat, lng);
    }

    // Validate address and ensure required fields
    const addressValidation = geocodingService.validateAddress(address);
    if (!addressValidation.isValid) {
      console.warn('⚠️ Address validation failed. Missing:', addressValidation.missing);

      // Force create a valid address if validation fails
      address = {
        fullAddress: address.fullAddress || `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        area: address.area || 'Unknown Area',
        locality: address.locality || 'Unknown Locality',
        city: address.city || 'Unknown City',
        state: address.state || 'Maharashtra',
        pincode: address.pincode || '',
        landmark: address.landmark || ''
      };

      console.log('🔧 Forced address creation:', address.fullAddress);
    }

    // Double-check required fields
    if (!address.fullAddress || !address.city) {
      console.error('🚨 Critical: Address still missing required fields!');
      address.fullAddress = address.fullAddress || `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      address.city = address.city || 'Unknown City';
      console.log('🔧 Emergency fix applied:', { fullAddress: address.fullAddress, city: address.city });
    }

    const sector = nlp_result.predicted_sector || 'General';
    const municipalityCode = geocodingService.getMunicipalityCode(address);

    /* 🛡️ JURISDICTION VALIDATION */
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Strictly enforce municipality match for regular users
    if (user.role === 'user' && user.municipalityCode && user.municipalityCode !== municipalityCode) {
      console.warn(`🚫 Jurisdiction mismatch: User (${user.municipalityCode}) vs Complaint (${municipalityCode})`);
      return res.status(403).json({
        message: `Jurisdiction mismatch. You can only file complaints for ${user.municipalityCode}. Detected location is in ${municipalityCode}.`,
        detectedMunicipality: municipalityCode,
        userMunicipality: user.municipalityCode
      });
    }

    /* 🤖 AUTO-ASSIGNMENT LOGIC */
    const normalizedDept = normalizeSectorToDepartment(sector);
    console.log(`🤖 Attempting auto-assignment for sector: ${sector} (Normalized: ${normalizedDept}) in ${municipalityCode}`);

    // Find eligible employees: same municipality, same department (normalized), available, sorted by lowest workload
    const bestEmployee = await User.findOne({
      role: 'employee',
      municipalityCode: municipalityCode,
      department: normalizedDept,
      availabilityStatus: 'AVAILABLE',
      currentWorkload: { $lt: 10 } // Use maxConcurrentComplaints if defined per user, but 10 is default
    }).sort({ currentWorkload: 1 });

    let assigned_to = null;
    let status = 'Pending';
    let assignmentNote = 'Awaiting manual assignment';

    if (bestEmployee) {
      assigned_to = bestEmployee._id;
      status = 'Assigned';
      assignmentNote = `Automatically assigned to ${bestEmployee.name}`;
      console.log(`✅ Auto-assigned to: ${bestEmployee.name} (Workload: ${bestEmployee.currentWorkload})`);

      // Increment employee workload
      await User.findByIdAndUpdate(bestEmployee._id, { $inc: { currentWorkload: 1 } });
    } else {
      console.log('⚠️ No available employees found for auto-assignment. Defaulting to Pending.');
    }

    const imageCheck = checkImageAuthenticity({
      image,
      nlp_result,
      cnn_result
    });

    const complaint = new Complaint({
      complaint_id,
      description,
      image,
      location: geoLocation,
      address: address,
      sector,
      municipalityCode,
      nlp_result,
      cnn_result,
      user_id,
      assigned_to, // Set by auto-assignment
      status,      // Set to 'Assigned' if auto-assigned
      notes: assignmentNote,
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

    // Debug: Log the complaint object before saving
    console.log('🔍 Complaint object before save:', {
      complaint_id: complaint.complaint_id,
      address_fullAddress: complaint.address.fullAddress,
      municipalityCode: complaint.municipalityCode,
      status: complaint.status,
      assigned_to: complaint.assigned_to ? 'YES' : 'NO'
    });

    const savedComplaint = await complaint.save();

    // 🔄 DEDUPLICATION LOGIC
    try {
      const deduplicationResult = await deduplicationService.processComplaint({
        _id: savedComplaint._id,
        location: geoLocation,
        address: address, // 🗺️ Use geocoded address
        sector,
        municipalityCode,
        description,
        nlp_result,
        user_id,
        image,
        assigned_to, // Pass auto-assignment data
        status       // Pass current status
      });

      console.log('🔄 Deduplication Result:', deduplicationResult.message);

      // Return enhanced response with group information
      res.status(201).json({
        message: 'Complaint filed successfully',
        complaint: savedComplaint,
        deduplication: {
          isNewGroup: deduplicationResult.isNewGroup,
          group: deduplicationResult.group,
          message: deduplicationResult.message
        }
      });
    } catch (dedupError) {
      console.error('Deduplication failed:', dedupError);
      // Still return success even if deduplication fails
      res.status(201).json({
        message: 'Complaint filed successfully',
        complaint: savedComplaint,
        warning: 'Deduplication processing failed'
      });
    }
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
    })
      .populate('assigned_to', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   GET /api/complaints/groups - Get all complaint groups
---------------------------------------------- */
const getComplaintGroups = async (req, res) => {
  try {
    const { status, sector, municipalityCode } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (sector) filter.sector = sector;
    if (municipalityCode) filter.municipalityCode = municipalityCode;

    const groups = await ComplaintGroup.find(filter)
      .populate('assigned_to', 'name email')
      .populate('affected_users', 'name email')
      .populate('complaints', 'complaint_id description status created_at')
      .sort({ last_updated: -1 });

    res.json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    console.error('Error fetching complaint groups:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   GET /api/complaints/groups/:groupId - Get specific group
---------------------------------------------- */
const getComplaintGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await ComplaintGroup.findOne({ group_id: groupId })
      .populate('assigned_to', 'name email phone')
      .populate('affected_users', 'name email phone')
      .populate({
        path: 'complaints',
        populate: {
          path: 'user_id',
          select: 'name email phone'
        }
      });

    if (!group) {
      return res.status(404).json({ message: 'Complaint group not found' });
    }

    res.json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Error fetching complaint group:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   PUT /api/complaints/groups/:groupId/assign - Assign group to employee
---------------------------------------------- */
const assignComplaintGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { assigned_to, notes, estimatedResolution } = req.body;

    const group = await ComplaintGroup.findOne({ group_id: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Complaint group not found' });
    }

    // Update group
    group.assigned_to = assigned_to;
    group.status = 'Assigned';
    if (notes) group.notes = notes;
    if (estimatedResolution) group.estimatedResolution = new Date(estimatedResolution);
    group.last_updated = new Date();

    await group.save();

    // Update all individual complaints in the group
    await Complaint.updateMany(
      { group_id: group._id },
      {
        assigned_to,
        status: 'Assigned',
        estimatedResolution: estimatedResolution ? new Date(estimatedResolution) : null
      }
    );

    const updatedGroup = await ComplaintGroup.findOne({ group_id: groupId })
      .populate('assigned_to', 'name email phone');

    res.json({
      success: true,
      message: `Complaint group assigned to employee`,
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error assigning complaint group:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   PUT /api/complaints/groups/:groupId/status - Update group status
---------------------------------------------- */
const getAssignedComplaintGroups = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const groups = await ComplaintGroup.find({ assigned_to: employeeId })
      .populate('complaints')
      .sort({ last_updated: -1 });

    res.json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    console.error('Error fetching assigned groups:', error);
    res.status(500).json({ message: error.message });
  }
};

const acknowledgeComplaintGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await ComplaintGroup.findOne({ group_id: groupId });

    if (!group) {
      return res.status(404).json({ message: 'Complaint group not found' });
    }

    group.status = 'In Progress';
    group.last_updated = new Date();
    await group.save();

    // Update individual complaints
    await Complaint.updateMany(
      { group_id: group._id },
      { status: 'In Progress' }
    );

    res.json({
      success: true,
      message: 'Complaint group acknowledged',
      group
    });
  } catch (error) {
    console.error('Error acknowledging group:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateComplaintGroupStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status, notes, resolvedDate, resolution_images } = req.body;

    const group = await ComplaintGroup.findOne({ group_id: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Complaint group not found' });
    }

    // Update group
    group.status = status;
    if (notes) group.notes = notes;
    if (resolution_images) group.resolution_images = resolution_images;

    if (status === 'Resolved' && !group.resolvedDate) {
      group.resolvedDate = resolvedDate ? new Date(resolvedDate) : new Date();
    }
    group.last_updated = new Date();

    await group.save();

    // Update all individual complaints in the group
    await Complaint.updateMany(
      { group_id: group._id },
      {
        status,
        notes: notes || '',
        resolvedDate: status === 'Resolved' ? (resolvedDate ? new Date(resolvedDate) : new Date()) : null
      }
    );

    const updatedGroup = await ComplaintGroup.findOne({ group_id: groupId })
      .populate('assigned_to', 'name email phone')
      .populate('affected_users', 'name email');

    // 📩 NOTIFY AFFECTED USERS
    if (updatedGroup.affected_users && updatedGroup.affected_users.length > 0) {
      for (const u of updatedGroup.affected_users) {
        // 1. In-App Notification
        const notification = new Message({
          sender: 'system',
          receiverId: u._id,
          title: `Update on Complaint Group: ${groupId}`,
          message: `The status of your complaint group has been updated to: ${status}. Notes: ${notes || 'N/A'}`
        });
        await notification.save();

        // 2. Email Notification
        try {
          await transporter.sendMail({
            from: '"CivicMind Updates" <' + process.env.GMAIL_USER + '>',
            to: u.email,
            subject: `Update: Complaint ${groupId} is now ${status}`,
            html: `<p>Hello ${u.name},</p><p>The status of your complaint group <b>${groupId}</b> has been updated to <b>${status}</b>.</p><p>Admin Notes: ${notes || 'No extra notes provided.'}</p>`
          });
        } catch (mailErr) {
          console.error('Failed to send status update email:', mailErr);
        }
      }
    }

    res.json({
      success: true,
      message: `Complaint group status updated to ${status}`,
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error updating complaint group status:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   GET /api/complaints/deduplication-stats - Get deduplication statistics
---------------------------------------------- */
const getDeduplicationStats = async (req, res) => {
  try {
    const stats = await deduplicationService.getDeduplicationStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching deduplication stats:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------------------------------
   GET /api/complaints/geocode - Reverse geocode lat/lng
---------------------------------------------- */
const reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: 'Missing required parameters: lat and lng'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        message: 'Invalid coordinates. Please provide valid latitude and longitude.'
      });
    }

    console.log('🗺️ Reverse geocoding coordinates:', latitude, longitude);

    const address = await geocodingService.reverseGeocodeWithRetry(latitude, longitude);
    const municipalityCode = geocodingService.getMunicipalityCode(address);

    res.json({
      success: true,
      address: {
        ...address,
        municipalityCode
      }
    });
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    res.status(500).json({
      message: 'Failed to geocode coordinates',
      error: error.message
    });
  }
};

/* ---------------------------------------------
   GET /api/complaints/search-address - Search address by name
---------------------------------------------- */
const searchAddress = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 3) {
      return res.status(400).json({
        message: 'Search query must be at least 3 characters long'
      });
    }

    console.log('🔍 Searching address:', q);

    const results = await geocodingService.searchAddress(q.trim());

    res.json({
      success: true,
      results: results.map(result => ({
        ...result,
        municipalityCode: geocodingService.getMunicipalityCode(result.address)
      }))
    });
  } catch (error) {
    console.error('Error in address search:', error);
    res.status(500).json({
      message: 'Failed to search addresses',
      error: error.message
    });
  }
};

/* ---------------------------------------------
   GET /api/complaints/admin-stats - Get dashboard statistics for admins
---------------------------------------------- */
const getAdminStats = async (req, res) => {
  try {
    const { municipalityCode } = req.query;
    const filter = municipalityCode ? { municipalityCode } : {};

    // 1. Status Counts
    const total = await ComplaintGroup.countDocuments(filter);
    const pending = await ComplaintGroup.countDocuments({ ...filter, status: { $in: ['Pending', 'Assigned'] } });
    const inProgress = await ComplaintGroup.countDocuments({ ...filter, status: 'In Progress' });
    const resolved = await ComplaintGroup.countDocuments({ ...filter, status: 'Resolved' });
    const urgent = await ComplaintGroup.countDocuments({ ...filter, priority: { $in: ['High', 'Critical'] } });

    // 2. Sector Distribution (for bar charts)
    const sectorStatsRaw = await ComplaintGroup.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$sector',
          pending: { $sum: { $cond: [{ $in: ['$status', ['Pending', 'Assigned']] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } }
        }
      }
    ]);

    const sectorStats = sectorStatsRaw.map(s => ({
      sector: s._id,
      pending: s.pending,
      inProgress: s.inProgress,
      resolved: s.resolved
    }));

    // 3. Recent Complaints
    const recent = await ComplaintGroup.find(filter)
      .populate('affected_users', 'name')
      .sort({ last_updated: -1 })
      .limit(5);

    const recentComplaints = recent.map(r => ({
      id: r.group_id,
      citizen: r.affected_users[0]?.name || 'Citizen',
      sector: r.sector,
      location: r.address.city,
      urgency: r.priority.toLowerCase(),
      status: r.status.toLowerCase().replace(' ', '-')
    }));

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        urgent
      },
      sectorStats,
      recentComplaints
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
  getAdminStats
};
