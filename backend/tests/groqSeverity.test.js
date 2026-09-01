const groqValidator = require('../src/utils/groqValidator');
const groqPrompt = require('../src/config/groqPrompt');

describe('Groq Severity Prediction & Backward Compatibility', () => {
  const basePayload = {
    defectClass: 'wire_and_lighting_hazards',
    confidence: 0.95,
    evidence: 'Exposed live wire touching puddle on sidewalk.',
    detectedIssue: 'Dangling live electrical wire near water.'
  };

  test('1. CRITICAL Severity — Should validate uppercase enum and map to "Critical"', () => {
    const result = groqValidator.validateAndEnforceTaxonomy({
      ...basePayload,
      severity: 'CRITICAL'
    });

    expect(result.valid).toBe(true);
    expect(result.data.severity).toBe('CRITICAL');
    expect(result.data.titleCaseSeverity).toBe('Critical');
    expect(groqValidator.toBackwardCompatibleSeverity('CRITICAL')).toBe('Critical');
  });

  test('2. HIGH Severity — Should validate uppercase enum and map to "High"', () => {
    const result = groqValidator.validateAndEnforceTaxonomy({
      ...basePayload,
      severity: 'HIGH'
    });

    expect(result.valid).toBe(true);
    expect(result.data.severity).toBe('HIGH');
    expect(result.data.titleCaseSeverity).toBe('High');
    expect(groqValidator.toBackwardCompatibleSeverity('HIGH')).toBe('High');
  });

  test('3. MEDIUM Severity — Should validate uppercase enum and map to "Medium"', () => {
    const result = groqValidator.validateAndEnforceTaxonomy({
      ...basePayload,
      severity: 'MEDIUM'
    });

    expect(result.valid).toBe(true);
    expect(result.data.severity).toBe('MEDIUM');
    expect(result.data.titleCaseSeverity).toBe('Medium');
    expect(groqValidator.toBackwardCompatibleSeverity('MEDIUM')).toBe('Medium');
  });

  test('4. LOW Severity — Should validate uppercase enum and map to "Low"', () => {
    const result = groqValidator.validateAndEnforceTaxonomy({
      ...basePayload,
      severity: 'LOW'
    });

    expect(result.valid).toBe(true);
    expect(result.data.severity).toBe('LOW');
    expect(result.data.titleCaseSeverity).toBe('Low');
    expect(groqValidator.toBackwardCompatibleSeverity('LOW')).toBe('Low');
  });

  test('System prompt should instruct Groq model on all 10 severity evaluation criteria', () => {
    const prompt = groqPrompt.buildSystemPrompt();

    expect(prompt).toContain('MULTIMODAL SEVERITY EVALUATION CRITERIA');
    expect(prompt).toContain('1. Immediate danger to citizens');
    expect(prompt).toContain('2. Risk of injury');
    expect(prompt).toContain('3. Electrical hazards');
    expect(prompt).toContain('4. Structural instability');
    expect(prompt).toContain('5. Flooding or severe waterlogging');
    expect(prompt).toContain('6. Fallen trees blocking major roads');
    expect(prompt).toContain('7. Obstruction of major public thoroughfares');
    expect(prompt).toContain('8. Environmental / biological hazards');
    expect(prompt).toContain('9. Extent of visible physical damage');
    expect(prompt).toContain('10. Citizen text description context');
  });
});
