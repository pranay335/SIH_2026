const complaintController = require('../src/controllers/complaintController');
const groqService = require('../src/services/groqService');
const geocodingService = require('../src/services/geocodingService');
const deduplicationService = require('../src/services/deduplicationService');
const fraudService = require('../src/services/fraudService');
const User = require('../src/models/User');
const Complaint = require('../src/models/Complaint');
const ComplaintGroup = require('../src/models/ComplaintGroup');
const taxonomy = require('../src/config/taxonomy');
const mongoose = require('mongoose');

jest.mock('../src/services/groqService');
jest.mock('../src/services/geocodingService');
jest.mock('../src/services/deduplicationService');
jest.mock('../src/services/fraudService');
jest.mock('../src/models/User');
jest.mock('../src/models/Complaint');
jest.mock('../src/models/ComplaintGroup');

describe('COMPLETE CivicMind Complaint Pipeline Integration Test', () => {
  let req, res;
  const MOCK_BASE64_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
  const MOCK_USER_ID = new mongoose.Types.ObjectId().toString();
  const MOCK_EMPLOYEE_ID = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: MOCK_USER_ID,
        name: 'John Citizen',
        email: 'john@example.com',
        trustScore: 100
      },
      body: {
        complaint_id: 'CMP-1772512635456',
        description: 'Large pothole on main road causing severe traffic hazard and vehicle slow down',
        image: MOCK_BASE64_IMAGE,
        location: '19.0760, 72.8777',
        latitude: 19.0760,
        longitude: 72.8777,
        municipalityCode: 'BMC'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Should successfully execute end-to-end complaint pipeline and verify all 12 criteria', async () => {
    // 1. Mock Authentication & User Lookup
    User.findById.mockResolvedValue({
      _id: MOCK_USER_ID,
      name: 'John Citizen',
      email: 'john@example.com',
      trustScore: 100,
      role: 'user',
      municipalityCode: 'BMC'
    });

    // 2. Mock Reverse Geocoding
    geocodingService.reverseGeocodeWithRetry.mockResolvedValue({
      fullAddress: 'MG Road, Fort, Mumbai, Maharashtra 400001',
      city: 'Mumbai',
      area: 'Fort',
      pincode: '400001'
    });
    geocodingService.getFallbackAddress.mockReturnValue({
      fullAddress: 'MG Road, Fort, Mumbai, Maharashtra 400001',
      city: 'Mumbai',
      area: 'Fort',
      pincode: '400001'
    });
    geocodingService.validateAddress.mockReturnValue({
      isValid: true,
      missing: []
    });
    geocodingService.getMunicipalityCode.mockReturnValue('BMC');

    // 3. Mock Groq Multimodal Classification
    groqService.classifyDefect.mockResolvedValue({
      success: true,
      modelUsed: 'openai/gpt-oss-20b',
      defectClass: 'potholes_and_roadcracks',
      classId: 'potholes_and_roadcracks',
      displayName: 'Potholes and Road Cracks',
      department: 'Roads',
      operationalAction: 'Asphalt patching, road surface resurfacing',
      severity: 'HIGH',
      confidence: 0.95,
      evidence: 'Visual evidence shows deep asphalt crater in driving lane.',
      detectedIssue: 'Severe pothole in driving lane on MG Road'
    });

    // 4. Mock Fraud Detection & Image Hashing
    fraudService.evaluateFraud.mockResolvedValue({
      finalAction: 'Allowed',
      fraudScore: 0,
      flagged: false,
      flagReason: null,
      imageHash: 'a1b2c3d4e5f67890',
      duplicateOf: null
    });

    // 5. Mock Employee Selection for Department Routing ('Roads')
    const mockEmployee = {
      _id: MOCK_EMPLOYEE_ID,
      name: 'Road Engineer',
      department: 'Roads',
      currentWorkload: 1,
      maxConcurrentComplaints: 5,
      availabilityStatus: 'AVAILABLE'
    };

    User.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockEmployee])
    });
    User.findByIdAndUpdate.mockResolvedValue(true);

    // 6. Mock Complaint Save
    const mockSavedComplaint = {
      _id: new mongoose.Types.ObjectId(),
      complaint_id: 'CMP-1772512635456',
      description: req.body.description,
      image: req.body.image,
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760] // [longitude, latitude]
      },
      address: {
        fullAddress: 'MG Road, Fort, Mumbai, Maharashtra 400001',
        city: 'Mumbai'
      },
      sector: 'potholes_and_roadcracks',
      priority: 'High',
      municipalityCode: 'BMC',
      user_id: MOCK_USER_ID,
      assigned_to: MOCK_EMPLOYEE_ID,
      status: 'Assigned',
      notes: 'Auto-assigned to employee Road Engineer',
      flagged: false,
      fraudScore: 0,
      imageHash: 'a1b2c3d4e5f67890',
      aiClassification: {
        provider: 'Groq',
        model: 'openai/gpt-oss-20b',
        defectClass: 'potholes_and_roadcracks',
        confidence: 0.95,
        confidenceTier: 'HIGH_CONFIDENCE',
        detectedIssue: 'Severe pothole in driving lane on MG Road',
        evidence: 'Visual evidence shows deep asphalt crater in driving lane.',
        classifiedAt: new Date(),
        status: 'SUCCESS'
      }
    };

    Complaint.prototype.save = jest.fn().mockResolvedValue(mockSavedComplaint);

    // 7. Mock Deduplication Service
    deduplicationService.processComplaint.mockResolvedValue({
      isNewGroup: true,
      group: { group_id: 'GRP-1001' },
      message: 'New complaint group created'
    });

    // --- EXECUTE PIPELINE ---
    await complaintController.fileComplaint(req, res);

    // --- VERIFICATION OF ALL 12 POINTS ---
    // Point 1: Complaint is created successfully
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();

    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.message).toBe('Complaint filed successfully');
    expect(responsePayload.complaint).toBeDefined();

    const c = responsePayload.complaint;

    // Point 2: defectClass is valid canonical class ID
    expect(taxonomy.isValidClassId(c.aiClassification.defectClass)).toBe(true);
    expect(c.aiClassification.defectClass).toBe('potholes_and_roadcracks');

    // Point 3: sector is correctly populated
    expect(c.sector).toBe('potholes_and_roadcracks');

    // Point 4: priority is correctly populated
    expect(c.priority).toBe('High');

    // Point 5: AI metadata is stored
    expect(c.aiClassification).toBeDefined();
    expect(c.aiClassification.provider).toBe('Groq');
    expect(c.aiClassification.model).toBe('openai/gpt-oss-20b');
    expect(c.aiClassification.confidence).toBe(0.95);
    expect(c.aiClassification.confidenceTier).toBe('HIGH_CONFIDENCE');
    expect(c.aiClassification.status).toBe('SUCCESS');

    // Point 6: Department routing works
    expect(groqService.classifyDefect).toHaveBeenCalled();
    expect(User.find).toHaveBeenCalledWith(
      expect.objectContaining({
        department: { $in: expect.arrayContaining(['Roads']) }
      })
    );

    // Point 7: Employee assignment still works
    expect(c.assigned_to).toBe(MOCK_EMPLOYEE_ID);
    expect(c.status).toBe('Assigned');

    // Point 8: Duplicate detection still works
    expect(deduplicationService.processComplaint).toHaveBeenCalled();
    expect(responsePayload.deduplication.isNewGroup).toBe(true);

    // Point 9: Image hashing still works
    expect(c.imageHash).toBe('a1b2c3d4e5f67890');

    // Point 10: GPS coordinates remain [longitude, latitude]
    expect(c.location.coordinates).toEqual([72.8777, 19.0760]);

    // Point 11: Authentication still works
    expect(c.user_id).toBe(MOCK_USER_ID);

    // Point 12: Frontend API response shape remains compatible
    expect(responsePayload).toHaveProperty('message');
    expect(responsePayload).toHaveProperty('complaint');
    expect(responsePayload).toHaveProperty('deduplication');
  });
});
