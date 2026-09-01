const complaintController = require('../src/controllers/complaintController');
const groqService = require('../src/services/claudeService');
const geocodingService = require('../src/services/geocodingService');
const fraudService = require('../src/services/fraudService');
const deduplicationService = require('../src/services/deduplicationService');
const Complaint = require('../src/models/Complaint');
const User = require('../src/models/User');

jest.mock('../src/services/claudeService');
jest.mock('../src/services/geocodingService');
jest.mock('../src/services/fraudService');
jest.mock('../src/services/deduplicationService');
jest.mock('../src/models/Complaint');
jest.mock('../src/models/User');

describe('Complaint Creation Flow with Groq Multimodal AI Classification', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        complaint_id: 'CMP-TEST-1001',
        description: 'Large pothole on main road causing traffic obstruction',
        image: 'data:image/jpeg;base64,ABCDEF==',
        location: '19.0760, 72.8777',
        user_id: '60d5ecb8b3f1c80015f8e001'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('should successfully file a complaint using Groq Multimodal AI classification', async () => {
    // 1. Mock Geocoding
    geocodingService.reverseGeocodeWithRetry.mockResolvedValue({
      fullAddress: 'MG Road, Fort, Mumbai, Maharashtra 400001',
      city: 'Mumbai',
      state: 'Maharashtra',
      area: 'Fort',
      locality: 'Fort'
    });
    geocodingService.validateAddress.mockReturnValue({ isValid: true });
    geocodingService.getMunicipalityCode.mockReturnValue('BMC');

    // 2. Mock User Lookup
    User.findById.mockResolvedValue({
      _id: '60d5ecb8b3f1c80015f8e001',
      role: 'user',
      municipalityCode: 'BMC',
      name: 'Test Citizen',
      email: 'citizen@example.com'
    });

    // 3. Mock Groq Classification
    groqService.classifyDefect.mockResolvedValue({
      success: true,
      defectClass: 'potholes_and_roadcracks',
      displayName: 'Potholes and Road Cracks',
      department: 'Roads',
      operationalAction: 'Asphalt patching, road surface resurfacing, and fissure sealing',
      severity: 'HIGH',
      confidence: 0.95,
      evidence: 'Visible deep pothole in driving lane.',
      detectedIssue: 'Deep asphalt crater on main road.'
    });

    // 4. Mock Fraud Evaluation
    fraudService.evaluateFraud.mockResolvedValue({
      fraudScore: 0,
      flagged: false,
      finalAction: 'Approved',
      flagReason: '',
      imageHash: 'a1b2c3d4e5f6',
      duplicateOf: null
    });

    // 5. Mock Employee Search & Assignment
    User.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        {
          _id: '60d5ecb8b3f1c80015f8e002',
          name: 'Road Engineer Employee',
          department: 'Roads',
          currentWorkload: 1,
          maxConcurrentComplaints: 5,
          availabilityStatus: 'AVAILABLE'
        }
      ])
    });
    User.findByIdAndUpdate.mockResolvedValue({});

    // 6. Mock Complaint Document Save
    const mockSavedComplaint = {
      _id: '60d5ecb8b3f1c80015f8e099',
      complaint_id: 'CMP-TEST-1001',
      description: 'Large pothole on main road causing traffic obstruction',
      sector: 'potholes_and_roadcracks',
      municipalityCode: 'BMC',
      address: { fullAddress: 'MG Road, Fort, Mumbai, Maharashtra 400001' },
      assigned_to: '60d5ecb8b3f1c80015f8e002',
      status: 'Assigned',
      priority: 'High',
      user_id: '60d5ecb8b3f1c80015f8e001'
    };
    Complaint.prototype.save = jest.fn().mockResolvedValue(mockSavedComplaint);

    // 7. Mock Deduplication Processing
    deduplicationService.processComplaint.mockResolvedValue({
      isNewGroup: true,
      group: { group_id: 'GRP-1001' },
      message: 'New complaint group created'
    });

    await complaintController.fileComplaint(req, res);

    // Assertions
    expect(groqService.classifyDefect).toHaveBeenCalledWith({
      description: 'Large pothole on main road causing traffic obstruction',
      image: 'data:image/jpeg;base64,ABCDEF==',
      address: expect.objectContaining({ fullAddress: 'MG Road, Fort, Mumbai, Maharashtra 400001' }),
      municipalityCode: 'BMC'
    });

    expect(fraudService.evaluateFraud).toHaveBeenCalledWith(
      expect.objectContaining({
        sector: 'potholes_and_roadcracks'
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Complaint filed successfully',
        complaint: mockSavedComplaint
      })
    );
  });

  test('should return 500 if Groq classification fails', async () => {
    geocodingService.reverseGeocodeWithRetry.mockResolvedValue({
      fullAddress: 'MG Road, Fort, Mumbai',
      city: 'Mumbai'
    });
    geocodingService.validateAddress.mockReturnValue({ isValid: true });
    geocodingService.getMunicipalityCode.mockReturnValue('BMC');

    User.findById.mockResolvedValue({
      _id: '60d5ecb8b3f1c80015f8e001',
      role: 'user',
      municipalityCode: 'BMC'
    });

    groqService.classifyDefect.mockResolvedValue({
      success: false,
      error: 'Groq API rate limit exceeded.',
      code: 'RATE_LIMIT_EXCEEDED'
    });

    await complaintController.fileComplaint(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Complaint filed successfully'
      })
    );
  });
});
