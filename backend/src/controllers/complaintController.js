const Complaint = require('../models/Complaint');
const ComplaintGroup = require('../models/ComplaintGroup');
const crypto = require('crypto');
const deduplicationService = require('../services/deduplicationService');
const geocodingService = require('../services/geocodingService');

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
      address: address, // 🗺️ Use geocoded address
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

    // Debug: Log the complaint object before saving
    console.log('🔍 Complaint object before save:', {
      complaint_id: complaint.complaint_id,
      address_fullAddress: complaint.address.fullAddress,
      address_city: complaint.address.city,
      address_complete: !!complaint.address.fullAddress && !!complaint.address.city
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
        image
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
    }).sort({ createdAt: -1 });

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
const updateComplaintGroupStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status, notes, resolvedDate } = req.body;

    const group = await ComplaintGroup.findOne({ group_id: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Complaint group not found' });
    }

    // Update group
    group.status = status;
    if (notes) group.notes = notes;
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
      .populate('assigned_to', 'name email phone');

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
  searchAddress
};
