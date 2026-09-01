const Complaint = require('../models/Complaint');
const ComplaintGroup = require('../models/ComplaintGroup');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Message = require('../models/Message');
const deduplicationService = require('../services/deduplicationService');
const geocodingService = require('../services/geocodingService');
const fraudService = require('../services/fraudService');
const taxonomy = require('../config/taxonomy');
const routingResolver = require('../config/routingResolver');
const groqService = require('../services/claudeService');
const axios = require('axios');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

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
  if (!sector) return 'General';

  // 1. Check canonical taxonomy mapping first
  if (taxonomy.isValidClassId(sector)) {
    return taxonomy.mapClassToNormalizedDepartment(sector);
  }

  // 2. Fallback heuristic keyword matching
  const s = sector.toLowerCase();
  if (s.includes('water') || s.includes('pipeline')) return 'Water';
  if (s.includes('road') || s.includes('pothole') || s.includes('footpath') || s.includes('bridge') || s.includes('concrete')) return 'Roads';
  if (s.includes('waste') || s.includes('garbage') || s.includes('dumping')) return 'Waste';
  if (s.includes('electric') || s.includes('wire') || s.includes('light') || s.includes('pole')) return 'Electricity';
  if (s.includes('health') || s.includes('medical') || s.includes('animal')) return 'Health';
  if (s.includes('drain') || s.includes('sewer') || s.includes('flood') || s.includes('waterlog')) return 'Drainage';
  return 'General';
};

const getDepartmentAliases = (department) => {
  const map = {
    Water: ['Water', 'water'],
    Roads: ['Roads', 'Road', 'roads', 'road', 'Road & Infrastructure', 'Road and Infrastructure'],
    Waste: ['Waste', 'waste', 'Garbage', 'garbage'],
    Electricity: ['Electricity', 'electricity', 'Electrical', 'electrical'],
    Health: ['Health', 'health', 'Medical', 'medical'],
    Drainage: ['Drainage', 'drainage', 'Sewer', 'sewer'],
    General: ['General', 'general']
  };

  return map[department] || [department];
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
      user_id,
      sector: providedSector
    } = req.body;

    if (
      !complaint_id ||
      !description ||
      !image ||
      !location
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

    /* 🤖 GROQ MULTIMODAL AI CLASSIFICATION (PRIMARY CLASSIFICATION PATH) */
    console.log('🤖 Executing Groq Multimodal AI Classification...');
    const groqResult = await groqService.classifyDefect({
      description,
      image,
      address,
      municipalityCode
    });

    const groqValidator = require('../utils/groqValidator');
    let effectiveSector;
    let titleCaseSeverity;
    let nlp_result;
    let cnn_result;
    let complaintPriority;
    let aiClassificationPayload;

    if (!groqResult.success) {
      // 1. Client Input Validation Errors (Must return HTTP 400 Bad Request)
      const inputErrorCodes = ['INVALID_DESCRIPTION', 'INVALID_IMAGE', 'IMAGE_TOO_LARGE'];
      if (inputErrorCodes.includes(groqResult.code)) {
        console.error('❌ Groq Classification Input Validation Failed:', groqResult.error);
        return res.status(400).json({
          message: `Complaint submission failed: ${groqResult.error}`,
          code: groqResult.code
        });
      }

      // 2. Controlled Groq Service Failure Fallback (Groq unavailable / timeout / 401 / 429 / 500 / network error / malformed response)
      console.warn(`⚠️ Groq AI Classification unavailable (${groqResult.code}): ${groqResult.error}. Preserving complaint submission for manual admin review.`);

      // Use submitted sector if valid canonical class; otherwise default to 'potholes_and_roadcracks'
      const fallbackSector = (providedSector && taxonomy.isValidClassId(providedSector))
        ? providedSector.toLowerCase()
        : 'potholes_and_roadcracks';

      effectiveSector = fallbackSector;
      titleCaseSeverity = 'Medium';
      complaintPriority = 'Medium';

      nlp_result = {
        predicted_sector: fallbackSector,
        predicted_severity: 'Medium',
        groqSeverity: 'MEDIUM',
        confidence: 0,
        evidence: `AI Classification Service Unavailable: ${groqResult.error} (${groqResult.code})`,
        department: taxonomy.mapClassToDepartment(fallbackSector),
        operationalAction: 'Manual administrative inspection and routing required'
      };

      cnn_result = {
        predicted_issue: 'AI Classification Service Unavailable',
        predicted_class: fallbackSector,
        confidence: 0
      };

      aiClassificationPayload = {
        provider: 'Claude',
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        defectClass: null,
        confidence: 0,
        confidenceTier: 'LOW_CONFIDENCE',
        detectedIssue: 'AI Classification Service Unavailable',
        evidence: `AI Classification failed: ${groqResult.error} (${groqResult.code})`,
        classifiedAt: new Date(),
        status: 'FAILED',
        errorCode: groqResult.code,
        errorMessage: groqResult.error
      };

      // Override groqResult parameters for downstream safeguard checks
      groqResult.confidence = 0;
      groqResult.defectClass = fallbackSector;

    } else {
      console.log('✅ Groq Classification Success:', {
        defectClass: groqResult.defectClass,
        displayName: groqResult.displayName,
        department: groqResult.department,
        severity: groqResult.severity,
        confidence: groqResult.confidence
      });

      effectiveSector = groqResult.defectClass;
      titleCaseSeverity = groqValidator.toBackwardCompatibleSeverity(groqResult.severity);
      complaintPriority = titleCaseSeverity;

      nlp_result = {
        predicted_sector: groqResult.defectClass,
        predicted_severity: titleCaseSeverity,
        groqSeverity: groqResult.severity,
        confidence: groqResult.confidence,
        evidence: groqResult.evidence,
        department: groqResult.department,
        operationalAction: groqResult.operationalAction
      };

      cnn_result = {
        predicted_issue: groqResult.detectedIssue,
        predicted_class: groqResult.defectClass,
        confidence: groqResult.confidence
      };

      aiClassificationPayload = {
        provider: 'Claude',
        model: groqResult.modelUsed || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        defectClass: groqResult.defectClass,
        confidence: groqResult.confidence,
        confidenceTier: groqValidator.getConfidenceTier(groqResult.confidence),
        detectedIssue: groqResult.detectedIssue,
        evidence: groqResult.evidence,
        classifiedAt: new Date(),
        status: 'SUCCESS'
      };
    }

    /* 🕵️ FRAUD GATE - NEW LOCATION BEFORE AUTO-ASSIGNMENT */
    console.log('🕵️ Running fraud detection...');
    const fraudResult = await fraudService.evaluateFraud({
      image,
      nlp_result,
      cnn_result,
      user_id,
      description,
      sector: effectiveSector,
      location: geoLocation
    });

    /* 🤖 CONFIDENCE SAFEGUARD EVALUATION */
    const isLowConfidence = groqResult.confidence < 0.60;
    const confidenceTier = groqValidator.getConfidenceTier(groqResult.confidence);

    let finalFlagged = fraudResult.flagged || isLowConfidence;
    let combinedFlagReason = fraudResult.flagReason || '';

    if (isLowConfidence) {
      const confidenceMsg = `Low AI Classification Confidence (${(groqResult.confidence * 100).toFixed(1)}%)`;
      combinedFlagReason = combinedFlagReason ? `${combinedFlagReason}; ${confidenceMsg}` : confidenceMsg;
      console.log(`⚠️ Complaint FLAGGED due to low AI confidence: ${groqResult.confidence} (${confidenceTier})`);
    }

    let assigned_to = null;
    let status = 'Pending';
    let assignmentNote = 'Awaiting manual assignment';

    if (fraudResult.finalAction === 'Rejected') {
      console.log(`❌ Complaint REJECTED! Score: ${fraudResult.fraudScore}. Reason: ${fraudResult.flagReason}`);
      status = 'Rejected';
      assignmentNote = 'System automatically discarded this complaint as suspicious and likely fake.';

      // Send Email to Citizen
      transporter.sendMail({
        from: '"CivicMind Alerts" <' + process.env.GMAIL_USER + '>',
        to: user.email,
        subject: `❌ Your CivicMind Complaint Was Discarded — ${complaint_id}`,
        html: `<p>Hello ${user.name},</p>
               <p>Your recent complaint (ID: <b>${complaint_id}</b>) has been identified as highly suspicious by our verification systems and was <b>discarded</b>.</p>
               <p><b>Reason:</b> Both text classification and visual verification failed. This usually indicates a fake or irrelevant submission.</p>
               <p>If you believe this is an error, please ensure your image clearly matches your description and try submitting again.</p>`
      }).catch(err => console.error('Failed to send citizen rejection email:', err));

    } else if (fraudResult.finalAction === 'Flagged' || isLowConfidence) {
      console.log(`🚨 Complaint FLAGGED for review! Reason: ${combinedFlagReason}`);
      status = 'Flagged';
      assignmentNote = isLowConfidence && !fraudResult.flagged
        ? 'Flagged for admin review due to low AI classification confidence'
        : 'Flagged for admin review due to suspicious content';
      
      // Send Email to Citizen
      transporter.sendMail({
        from: '"CivicMind Alerts" <' + process.env.GMAIL_USER + '>',
        to: user.email,
        subject: `⚠️ Your CivicMind Complaint Needs Review — ${complaint_id}`,
        html: `<p>Hello ${user.name},</p>
               <p>Your recent complaint (ID: <b>${complaint_id}</b>) has been flagged by our automated system for manual review.</p>
               <p><b>Reason:</b> ${combinedFlagReason}</p>
               <p>An administrator will review your submission within 24 hours. If found legitimate, it will be assigned. Otherwise, it may be dismissed.</p>`
      }).catch(err => console.error('Failed to send citizen flag email:', err));

      // Send Email to Admin
      transporter.sendMail({
        from: '"CivicMind System" <' + process.env.GMAIL_USER + '>',
        to: process.env.GMAIL_USER, // or ADMIN_EMAIL
        subject: `🚨 Action Required: Complaint ${complaint_id} Flagged for Review`,
        html: `<p>A new complaint was submitted and flagged for admin review.</p>
               <p><b>ID:</b> ${complaint_id}<br/>
               <b>Citizen:</b> ${user.name} (${user.email})<br/>
               <b>Trust Score:</b> ${user.trustScore}<br/>
               <b>Fraud Score:</b> ${fraudResult.fraudScore}<br/>
               <b>AI Confidence:</b> ${groqResult.confidence} (${confidenceTier})<br/>
               <b>Reason:</b> ${combinedFlagReason}</p>
               <p>Please review it in the Admin Dashboard.</p>`
      }).catch(err => console.error('Failed to send admin flag notice email:', err));

    } else {
      /* 🤖 AUTO-ASSIGNMENT LOGIC (Only runs if not flagged) */
      const MAX_COMPLAINTS_DEFAULT = 5;
      const routing = routingResolver.resolveRoutingForClass(effectiveSector);
      console.log(`🤖 Attempting auto-assignment for defectClass: ${effectiveSector} (Official Dept: ${routing.officialDepartment}) in ${municipalityCode}`);

      const eligibleEmployees = await User.find({
        role: 'employee',
        municipalityCode: municipalityCode,
        department: { $in: routing.compatibleEmployeeDepartments }
      }).sort({ currentWorkload: 1 });

      if (eligibleEmployees.length > 0) {
        const bestEmployee = eligibleEmployees.find((emp) => {
          const employeeMax = emp.maxConcurrentComplaints || MAX_COMPLAINTS_DEFAULT;
          const employeeStatus = (emp.availabilityStatus || 'AVAILABLE').toUpperCase();
          const canTakeWork = emp.currentWorkload < employeeMax;
          const isBlocked = ['OFF_DUTY', 'ON_LEAVE', 'UNAVAILABLE'].includes(employeeStatus);
          return canTakeWork && !isBlocked;
        }) || null;

        if (bestEmployee) {
          const employeeMax = bestEmployee.maxConcurrentComplaints || MAX_COMPLAINTS_DEFAULT;
          assigned_to = bestEmployee._id;
          status = 'Assigned';
          assignmentNote = `Auto-assigned to employee ${bestEmployee.name} (${bestEmployee.department}). Current Workload: ${bestEmployee.currentWorkload + 1}/${employeeMax}.`;

          // Increment currentWorkload atomically
          await User.findByIdAndUpdate(bestEmployee._id, { $inc: { currentWorkload: 1 } });
          console.log(`✅ Auto-assigned to: ${bestEmployee.name} (New workload: ${bestEmployee.currentWorkload + 1}/${employeeMax})`);
        } else {
          console.log(`⚠️ All matching employees for department ${routing.officialDepartment} are at max capacity or unavailable.`);
          assignmentNote = `All matching employees in ${routing.officialDepartment} are currently busy or unavailable.`;
        }
      } else {
        console.log(`⚠️ No active employees found for department: ${routing.officialDepartment} in ${municipalityCode}`);
        assignmentNote = `No registered employees found for department ${routing.officialDepartment}.`;
      }
    }

    const complaint = new Complaint({
      complaint_id,
      description,
      image,
      location: geoLocation,
      address: address,
      sector: effectiveSector,
      municipalityCode,
      nlp_result,
      cnn_result,
      aiClassification: {
        provider: 'Claude',
        model: groqResult.modelUsed || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        defectClass: groqResult.defectClass,
        confidence: groqResult.confidence,
        confidenceTier: confidenceTier,
        detectedIssue: groqResult.detectedIssue,
        evidence: groqResult.evidence,
        classifiedAt: new Date()
      },
      user_id,
      assigned_to, // Set by auto-assignment
      status,      // Set to 'Assigned' if auto-assigned, 'Flagged' if low confidence/fraud
      notes: assignmentNote,
      priority: complaintPriority,
      flagged: finalFlagged,
      fraudScore: fraudResult.fraudScore,
      flagReason: combinedFlagReason,
      imageHash: fraudResult.imageHash,
      duplicateOf: fraudResult.duplicateOf
    });

    // Debug: Log the complaint object before saving
    console.log('🔍 Complaint object before save:', {
      complaint_id: complaint.complaint_id,
      address_fullAddress: complaint.address?.fullAddress || 'N/A',
      municipalityCode: complaint.municipalityCode,
      status: complaint.status,
      assigned_to: complaint.assigned_to ? 'YES' : 'NO'
    });

    const savedComplaint = await complaint.save();

    // --- START: n8n Webhook Integrations (Fire and Forget) ---
    // Trigger Complaint Acknowledgment
    axios.post('https://pranayhackaton1.app.n8n.cloud/webhook/complaint-ack', {
      event: 'complaint_created',
      email: user.email,
      complaint_id: savedComplaint.complaint_id,
      subject: `✅ Complaint ${savedComplaint.complaint_id} Received – CivicMind`,
      message: `✅ Complaint ${savedComplaint.complaint_id} Received – CivicMind`,
      status: savedComplaint.status,
      user_id: savedComplaint.user_id,
      municipality: savedComplaint.municipalityCode,
      sector: savedComplaint.sector,
      severity: savedComplaint.priority,
      description: savedComplaint.description
    }).catch(err => console.warn('n8n Webhook warning (complaint-ack):', err.message));

    // Trigger Employee Assignment (if auto-assigned upon creation)
    if (savedComplaint.assigned_to) {
      axios.post('https://pranayhackaton1.app.n8n.cloud/webhook/employee-assign', {
        event: 'employee_assigned',
        complaint_id: savedComplaint.complaint_id,
        assigned_employee_id: savedComplaint.assigned_to,
        status: savedComplaint.status
      }).catch(err => console.warn('n8n Webhook warning (employee-assign):', err.message));
    }
    // --- END: n8n Webhook Integrations ---

    // 🔄 DEDUPLICATION LOGIC
    try {
      const deduplicationResult = await deduplicationService.processComplaint({
        _id: savedComplaint._id,
        location: geoLocation,
        address: address, // 🗺️ Use geocoded address
        sector: effectiveSector,
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

    // Get the original complaint to check status change
    const originalComplaint = await Complaint.findById(req.params.id);
    if (!originalComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Handle workload decrement when complaint is resolved
    if (originalComplaint.status !== 'Resolved' && status === 'Resolved' && originalComplaint.assigned_to) {
      const employee = await User.findById(originalComplaint.assigned_to);
      if (employee) {
        const employeeMax = employee.maxConcurrentComplaints || 5;
        const newWorkload = Math.max(0, employee.currentWorkload - 1);
        await User.findByIdAndUpdate(originalComplaint.assigned_to, {
          currentWorkload: newWorkload,
          // Update availability status if they're now below their personal max capacity
          ...(newWorkload < employeeMax ? { availabilityStatus: 'AVAILABLE' } : {})
        });
        console.log(`📉 Workload decreased for ${employee.name}: ${employee.currentWorkload} → ${newWorkload}/${employeeMax}`);
        if (newWorkload < employeeMax && employee.availabilityStatus === 'UNAVAILABLE') {
          console.log(`✅ Employee ${employee.name} is now AVAILABLE`);
        }
      }
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, assigned_to, notes, priority },
      { new: true }
    );

    // --- START: n8n Webhook Integration (Fire and Forget) ---
    // Trigger if a new employee is assigned or assignment changed manually
    if (assigned_to && originalComplaint.assigned_to?.toString() !== assigned_to.toString()) {
      axios.post('https://pranayhackaton1.app.n8n.cloud/webhook/employee-assign', {
        event: 'employee_assigned',
        complaint_id: complaint.complaint_id,
        assigned_employee_id: complaint.assigned_to,
        status: complaint.status
      }).catch(err => console.warn('n8n Webhook warning (employee-reassign):', err.message));
    }
    // --- END: n8n Webhook Integration ---

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
      .populate('assigned_to', 'name email department currentWorkload maxConcurrentComplaints availabilityStatus')
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
    const { assigned_to, notes } = req.body;

    if (!assigned_to) {
      return res.status(400).json({ success: false, message: 'Employee ID (assigned_to) is required' });
    }

    const assignmentService = require('../services/assignmentService');
    const result = await assignmentService.reassignComplaintGroup(groupId, assigned_to, notes || '');

    res.json({
      success: true,
      message: 'Complaint group reassigned successfully',
      group: result.group
    });
  } catch (error) {
    console.error('Error assigning complaint group:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({ success: false, message });
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

    // Handle workload decrement when complaint group is resolved
    if (group.status !== 'Resolved' && status === 'Resolved' && group.assigned_to) {
      const employee = await User.findById(group.assigned_to);
      if (employee) {
        const employeeMax = employee.maxConcurrentComplaints || 5;
        // Count how many complaints are in this group to decrement by that amount
        const complaintsInGroup = await Complaint.countDocuments({ group_id: group._id });
        const newWorkload = Math.max(0, employee.currentWorkload - complaintsInGroup);

        await User.findByIdAndUpdate(group.assigned_to, {
          currentWorkload: newWorkload,
          // Update availability status if they're now below their personal max capacity
          ...(newWorkload < employeeMax ? { availabilityStatus: 'AVAILABLE' } : {})
        });
        console.log(`📉 Workload decreased for ${employee.name}: ${employee.currentWorkload} → ${newWorkload}/${employeeMax} (${complaintsInGroup} complaints resolved)`);
        if (newWorkload < employeeMax && employee.availabilityStatus === 'UNAVAILABLE') {
          console.log(`✅ Employee ${employee.name} is now AVAILABLE`);
        }
      }
    }

    // Update group
    group.status = status;
    if (notes) group.notes = notes;
    if (resolution_images) group.resolution_images = resolution_images;

    if (status === 'Resolved' && !group.resolvedDate) {
      group.resolvedDate = resolvedDate ? new Date(resolvedDate) : new Date();
    }
    // Set feedback status to PENDING when resolved (triggers citizen feedback flow)
    if (status === 'Resolved') {
      group.feedbackStatus = 'PENDING';
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

/* ---------------------------------------------
   GET /api/complaints/flagged - Get flagged complaints for admins
---------------------------------------------- */
const getFlaggedComplaints = async (req, res) => {
  try {
    const { municipalityCode } = req.query;
    const filter = { status: 'Flagged' };
    if (municipalityCode) filter.municipalityCode = municipalityCode;

    const complaints = await Complaint.find(filter)
      .populate('user_id', 'name email trustScore')
      .populate('duplicateOf', 'complaint_id location sector')
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
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
  getComplaintGroups,
  getComplaintGroupById,
  assignComplaintGroup,
  updateComplaintGroupStatus,
  getDeduplicationStats,
  reverseGeocode,
  searchAddress,
  getAssignedComplaintGroups,
  acknowledgeComplaintGroup,
  getAdminStats,
  getFlaggedComplaints
};
