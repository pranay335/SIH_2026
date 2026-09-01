const groqValidator = require('../src/utils/groqValidator');
const taxonomy = require('../src/config/taxonomy');

describe('Groq Classification Response Validator & Backend Taxonomy Overwrite', () => {
  const validPayload = {
    defectClass: 'potholes_and_roadcracks',
    severity: 'HIGH',
    confidence: 0.95,
    evidence: 'Visual evidence shows a 10cm deep crater in driving lane.',
    detectedIssue: 'Deep asphalt pothole causing traffic slowdown.',
    department: 'Roads',
    operationalAction: 'Asphalt filling, surface leveling, and road patching'
  };

  test('1. Valid Class — Should pass validation and return sanitized data', () => {
    const result = groqValidator.validateAndEnforceTaxonomy(validPayload);

    expect(result.valid).toBe(true);
    expect(result.data.defectClass).toBe('potholes_and_roadcracks');
    expect(result.data.severity).toBe('HIGH');
    expect(result.data.confidence).toBe(0.95);
    expect(result.data.evidence).toContain('Visual evidence shows');
    expect(result.data.detectedIssue).toContain('Deep asphalt pothole');
    expect(result.data.department).toBe('Roads');
    expect(result.data.operationalAction).toBe('Asphalt patching, road surface resurfacing, and fissure sealing');
  });

  test('2. Invalid Class — Should return controlled error and not silently invent class', () => {
    const invalidClassPayload = {
      ...validPayload,
      defectClass: 'alien_ufo_landing'
    };

    const result = groqValidator.validateAndEnforceTaxonomy(invalidClassPayload);

    expect(result.valid).toBe(false);
    expect(result.code).toBe('INVALID_TAXONOMY_CLASS');
    expect(result.error).toContain("Invalid defect class 'alien_ufo_landing'");
  });

  test('3. Invalid Severity — Should reject non-enum severity levels', () => {
    const invalidSeverityPayload = {
      ...validPayload,
      severity: 'EXTREME_DANGER'
    };

    const result = groqValidator.validateAndEnforceTaxonomy(invalidSeverityPayload);

    expect(result.valid).toBe(false);
    expect(result.code).toBe('INVALID_SEVERITY');
    expect(result.error).toContain("Invalid severity 'EXTREME_DANGER'");
  });

  test('4. Confidence Outside 0..1 — Should reject negative or > 1 confidence scores', () => {
    // Negative confidence
    const negResult = groqValidator.validateAndEnforceTaxonomy({
      ...validPayload,
      confidence: -0.5
    });
    expect(negResult.valid).toBe(false);
    expect(negResult.code).toBe('CONFIDENCE_OUT_OF_BOUNDS');

    // > 1.0 confidence
    const highResult = groqValidator.validateAndEnforceTaxonomy({
      ...validPayload,
      confidence: 1.5
    });
    expect(highResult.valid).toBe(false);
    expect(highResult.code).toBe('CONFIDENCE_OUT_OF_BOUNDS');

    // Non-number confidence
    const stringResult = groqValidator.validateAndEnforceTaxonomy({
      ...validPayload,
      confidence: '0.95'
    });
    expect(stringResult.valid).toBe(false);
    expect(stringResult.code).toBe('INVALID_CONFIDENCE');
  });

  test('5. Missing Fields — Should reject payload if evidence, detectedIssue, or class is missing', () => {
    // Missing evidence
    const noEvidence = { ...validPayload, evidence: '' };
    const resEv = groqValidator.validateAndEnforceTaxonomy(noEvidence);
    expect(resEv.valid).toBe(false);
    expect(resEv.code).toBe('MISSING_EVIDENCE');

    // Missing defectClass
    const noClass = { ...validPayload, defectClass: undefined, classId: undefined };
    const resClass = groqValidator.validateAndEnforceTaxonomy(noClass);
    expect(resClass.valid).toBe(false);
    expect(resClass.code).toBe('MISSING_DEFECT_CLASS');

    // Missing severity
    const noSev = { ...validPayload, severity: undefined };
    const resSev = groqValidator.validateAndEnforceTaxonomy(noSev);
    expect(resSev.valid).toBe(false);
    expect(resSev.code).toBe('MISSING_SEVERITY');
  });

  test('6. Department Mismatch — Should OVERWRITE model-generated department with canonical backend taxonomy department', () => {
    const mismatchedDeptPayload = {
      ...validPayload,
      defectClass: 'garbage_and_dumping',
      department: 'Parks and Recreation' // Model wrongly hallucinated "Parks" instead of "Solid Waste Management"
    };

    const result = groqValidator.validateAndEnforceTaxonomy(mismatchedDeptPayload);

    expect(result.valid).toBe(true);
    expect(result.data.defectClass).toBe('garbage_and_dumping');

    // VERIFY BACKEND AUTHORITATIVE OVERWRITE
    expect(result.data.department).not.toBe('Parks and Recreation');
    expect(result.data.department).toBe('Solid Waste Management');
  });

  test('7. Operational Action Mismatch — Should OVERWRITE model-generated action with canonical backend operational action', () => {
    const mismatchedActionPayload = {
      ...validPayload,
      defectClass: 'pipeline_leaks',
      operationalAction: 'Send a worker with a mop' // Model wrongly suggested arbitrary action
    };

    const result = groqValidator.validateAndEnforceTaxonomy(mismatchedActionPayload);

    expect(result.valid).toBe(true);
    expect(result.data.defectClass).toBe('pipeline_leaks');

    // VERIFY BACKEND AUTHORITATIVE OVERWRITE
    expect(result.data.department).toBe('Hydraulic Engineer');
    expect(result.data.operationalAction).not.toBe('Send a worker with a mop');
    expect(result.data.operationalAction).toBe('Pipe valve isolation, leak patching, and main pipeline replacement');
  });
});
