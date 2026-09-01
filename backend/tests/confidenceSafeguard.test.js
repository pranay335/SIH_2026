const groqValidator = require('../src/utils/groqValidator');
const Complaint = require('../src/models/Complaint');
const mongoose = require('mongoose');

describe('Confidence-Based Classification Safeguards', () => {
  test('1. Should resolve confidence score >= 0.80 as HIGH_CONFIDENCE', () => {
    expect(groqValidator.getConfidenceTier(0.95)).toBe('HIGH_CONFIDENCE');
    expect(groqValidator.getConfidenceTier(0.80)).toBe('HIGH_CONFIDENCE');
  });

  test('2. Should resolve confidence score 0.60 - 0.79 as MEDIUM_CONFIDENCE', () => {
    expect(groqValidator.getConfidenceTier(0.79)).toBe('MEDIUM_CONFIDENCE');
    expect(groqValidator.getConfidenceTier(0.60)).toBe('MEDIUM_CONFIDENCE');
    expect(groqValidator.getConfidenceTier(0.65)).toBe('MEDIUM_CONFIDENCE');
  });

  test('3. Should resolve confidence score < 0.60 as LOW_CONFIDENCE', () => {
    expect(groqValidator.getConfidenceTier(0.59)).toBe('LOW_CONFIDENCE');
    expect(groqValidator.getConfidenceTier(0.30)).toBe('LOW_CONFIDENCE');
    expect(groqValidator.getConfidenceTier(0.00)).toBe('LOW_CONFIDENCE');
  });

  test('4. Complaint Model — Should validate confidenceTier enum in aiClassification subdocument', () => {
    const complaint = new Complaint({
      complaint_id: 'CMP-CONF-TEST-001',
      description: 'Minor road mark',
      image: 'data:image/jpeg;base64,ABCDEF==',
      location: { type: 'Point', coordinates: [72.87, 19.07] },
      address: { fullAddress: 'Bandra West, Mumbai', city: 'Mumbai' },
      user_id: new mongoose.Types.ObjectId(),
      sector: 'potholes_and_roadcracks',
      priority: 'Low',
      flagged: true,
      flagReason: 'Low AI Classification Confidence (45.0%)',
      aiClassification: {
        provider: 'Groq',
        model: 'openai/gpt-oss-20b',
        defectClass: 'potholes_and_roadcracks',
        confidence: 0.45,
        confidenceTier: 'LOW_CONFIDENCE',
        detectedIssue: 'Uncertain shallow mark on pavement',
        evidence: 'Text description lacks details.'
      }
    });

    expect(complaint.aiClassification.confidence).toBe(0.45);
    expect(complaint.aiClassification.confidenceTier).toBe('LOW_CONFIDENCE');
    expect(complaint.sector).toBe('potholes_and_roadcracks'); // Retained canonical class
    expect(complaint.flagged).toBe(true);
    expect(complaint.flagReason).toContain('Low AI Classification Confidence');
    expect(complaint.fraudScore).toBe(0); // Untouched fraudScore
  });
});
