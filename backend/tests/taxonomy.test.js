const {
  DEFECT_TAXONOMY,
  CANONICAL_CLASS_IDS,
  isValidClassId,
  validateAiClass,
  getDefectClass,
  getAllDefectClasses,
  mapClassToDepartment,
  mapClassToNormalizedDepartment
} = require('../src/config/taxonomy');

describe('CivicMind Canonical Municipal Defect Taxonomy', () => {
  const EXPECTED_CLASSES = [
    'potholes_and_roadcracks',
    'footpath_split',
    'damagedroadsigns',
    'garbage_and_dumping',
    'deadanimalspollution',
    'drainage_waterlogging',
    'damagedelectricalpoles',
    'wire_and_lighting_hazards',
    'pipeline_leaks',
    'damaged_concrete_structures',
    'fallentrees',
    'graffitti_and_vandalism',
    'illegalparking_obstruction'
  ];

  test('should contain exactly 13 canonical defect classes', () => {
    expect(CANONICAL_CLASS_IDS.length).toBe(13);
    expect([...CANONICAL_CLASS_IDS].sort()).toEqual([...EXPECTED_CLASSES].sort());
  });

  test.each(EXPECTED_CLASSES)('class %s should have all required taxonomy fields', (classId) => {
    const item = DEFECT_TAXONOMY[classId];
    expect(item).toBeDefined();
    expect(item.classId).toBe(classId);
    expect(typeof item.displayName).toBe('string');
    expect(item.displayName.length).toBeGreaterThan(0);
    expect(typeof item.department).toBe('string');
    expect(item.department.length).toBeGreaterThan(0);
    expect(typeof item.operationalAction).toBe('string');
    expect(item.operationalAction.length).toBeGreaterThan(0);
    expect(typeof item.description).toBe('string');
    expect(item.description.length).toBeGreaterThan(0);
    expect(Array.isArray(item.examples)).toBe(true);
    expect(item.examples.length).toBeGreaterThan(0);
    expect(typeof item.severityHints).toBe('object');
    expect(item.severityHints.Low).toBeDefined();
    expect(item.severityHints.Medium).toBeDefined();
    expect(item.severityHints.High).toBeDefined();
  });

  test('isValidClassId should correctly validate canonical classes', () => {
    EXPECTED_CLASSES.forEach((id) => {
      expect(isValidClassId(id)).toBe(true);
      expect(isValidClassId(`  ${id.toUpperCase()}  `)).toBe(true);
    });

    expect(isValidClassId('unknown_defect')).toBe(false);
    expect(isValidClassId('alien_invasion')).toBe(false);
    expect(isValidClassId('')).toBe(false);
    expect(isValidClassId(null)).toBe(false);
  });

  test('validateAiClass should accept valid classes and reject invalid classes', () => {
    const validResult = validateAiClass('potholes_and_roadcracks');
    expect(validResult.valid).toBe(true);
    expect(validResult.defectClass).toBeDefined();
    expect(validResult.defectClass.department).toBe('Roads');

    const invalidResult = validateAiClass('random_ai_hallucination');
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toContain("Invalid defect class 'random_ai_hallucination'");
  });

  test('mapClassToDepartment should map classes to specified official departments', () => {
    expect(mapClassToDepartment('potholes_and_roadcracks')).toBe('Roads');
    expect(mapClassToDepartment('footpath_split')).toBe('Roads');
    expect(mapClassToDepartment('damagedroadsigns')).toBe('Traffic / Roads');
    expect(mapClassToDepartment('garbage_and_dumping')).toBe('Solid Waste Management');
    expect(mapClassToDepartment('deadanimalspollution')).toBe('SWM / Public Health');
    expect(mapClassToDepartment('drainage_waterlogging')).toBe('Storm Water Drains');
    expect(mapClassToDepartment('damagedelectricalpoles')).toBe('Street Lighting / MSEDCL');
    expect(mapClassToDepartment('wire_and_lighting_hazards')).toBe('Street Lighting');
    expect(mapClassToDepartment('pipeline_leaks')).toBe('Hydraulic Engineer');
    expect(mapClassToDepartment('damaged_concrete_structures')).toBe('Bridges / Maintenance');
    expect(mapClassToDepartment('fallentrees')).toBe('Tree Authority / Gardens');
    expect(mapClassToDepartment('graffitti_and_vandalism')).toBe('License / Maintenance');
    expect(mapClassToDepartment('illegalparking_obstruction')).toBe('Anti-Encroachment / Traffic');
  });

  test('mapClassToNormalizedDepartment should map to internal assignment departments', () => {
    expect(mapClassToNormalizedDepartment('potholes_and_roadcracks')).toBe('Roads');
    expect(mapClassToNormalizedDepartment('garbage_and_dumping')).toBe('Waste');
    expect(mapClassToNormalizedDepartment('deadanimalspollution')).toBe('Health');
    expect(mapClassToNormalizedDepartment('drainage_waterlogging')).toBe('Drainage');
    expect(mapClassToNormalizedDepartment('damagedelectricalpoles')).toBe('Electricity');
    expect(mapClassToNormalizedDepartment('pipeline_leaks')).toBe('Water');
    expect(mapClassToNormalizedDepartment('invalid_id')).toBe('General');
  });

  test('getAllDefectClasses should return array of 13 defect classes', () => {
    const list = getAllDefectClasses();
    expect(list.length).toBe(13);
  });
});
