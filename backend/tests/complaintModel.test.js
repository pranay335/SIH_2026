const Complaint = require('../src/models/Complaint');
const mongoose = require('mongoose');

describe('Complaint Model — AI Classification Metadata Subdocument', () => {
  test('Should instantiate complaint with valid aiClassification subdocument', () => {
    const complaintData = {
      complaint_id: 'CMP-MODEL-TEST-001',
      description: 'Dangling live wire near school',
      image: 'data:image/jpeg;base64,ABCDEF==',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760]
      },
      address: {
        fullAddress: 'MG Road, Fort, Mumbai',
        city: 'Mumbai'
      },
      sector: 'wire_and_lighting_hazards',
      priority: 'Critical',
      user_id: new mongoose.Types.ObjectId(),
      aiClassification: {
        provider: 'Groq',
        model: 'openai/gpt-oss-20b',
        defectClass: 'wire_and_lighting_hazards',
        confidence: 0.95,
        detectedIssue: 'Bare live wire dangling near sidewalk',
        evidence: 'Visual evidence shows low hanging cable over pedestrian walkway.',
        classifiedAt: new Date('2026-09-01T10:00:00Z')
      }
    };

    const complaint = new Complaint(complaintData);

    expect(complaint.complaint_id).toBe('CMP-MODEL-TEST-001');
    expect(complaint.sector).toBe('wire_and_lighting_hazards');
    expect(complaint.priority).toBe('Critical');

    // AI Classification Subdocument assertions
    expect(complaint.aiClassification).toBeDefined();
    expect(complaint.aiClassification.provider).toBe('Groq');
    expect(complaint.aiClassification.model).toBe('openai/gpt-oss-20b');
    expect(complaint.aiClassification.defectClass).toBe('wire_and_lighting_hazards');
    expect(complaint.aiClassification.confidence).toBe(0.95);
    expect(complaint.aiClassification.detectedIssue).toBe('Bare live wire dangling near sidewalk');
    expect(complaint.aiClassification.evidence).toContain('Visual evidence shows');
    expect(complaint.aiClassification.classifiedAt).toBeDefined();

    // Verify raw API key / full raw response are NOT attached
    expect(complaint.aiClassification.apiKey).toBeUndefined();
    expect(complaint.aiClassification.rawResponse).toBeUndefined();
  });

  test('Should apply default provider ("Groq") if unspecified', () => {
    const complaint = new Complaint({
      complaint_id: 'CMP-MODEL-TEST-002',
      description: 'Pothole on street',
      image: 'data:image/jpeg;base64,ABC==',
      location: { type: 'Point', coordinates: [72.87, 19.07] },
      address: { fullAddress: 'Thane', city: 'Thane' },
      user_id: new mongoose.Types.ObjectId(),
      aiClassification: {
        defectClass: 'potholes_and_roadcracks',
        confidence: 0.9
      }
    });

    expect(complaint.aiClassification.provider).toBe('Groq');
    expect(complaint.aiClassification.classifiedAt).toBeInstanceOf(Date);
  });
});
