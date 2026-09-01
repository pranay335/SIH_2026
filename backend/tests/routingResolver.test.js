const routingResolver = require('../src/config/routingResolver');
const taxonomy = require('../src/config/taxonomy');

describe('Municipal Routing Resolver & Employee Compatibility (13 Classes)', () => {
  const EXPECTED_MUNICIPAL_ROUTING = [
    {
      classId: 'potholes_and_roadcracks',
      expectedOfficialDept: 'Roads',
      expectedEmployeeDept: 'Roads'
    },
    {
      classId: 'footpath_split',
      expectedOfficialDept: 'Roads',
      expectedEmployeeDept: 'Roads'
    },
    {
      classId: 'damagedroadsigns',
      expectedOfficialDept: 'Traffic / Roads',
      expectedEmployeeDept: 'Roads'
    },
    {
      classId: 'garbage_and_dumping',
      expectedOfficialDept: 'Solid Waste Management',
      expectedEmployeeDept: 'Waste'
    },
    {
      classId: 'deadanimalspollution',
      expectedOfficialDept: 'SWM / Public Health',
      expectedEmployeeDept: 'Health'
    },
    {
      classId: 'drainage_waterlogging',
      expectedOfficialDept: 'Storm Water Drains',
      expectedEmployeeDept: 'Drainage'
    },
    {
      classId: 'damagedelectricalpoles',
      expectedOfficialDept: 'Street Lighting / MSEDCL',
      expectedEmployeeDept: 'Electricity'
    },
    {
      classId: 'wire_and_lighting_hazards',
      expectedOfficialDept: 'Street Lighting',
      expectedEmployeeDept: 'Electricity'
    },
    {
      classId: 'pipeline_leaks',
      expectedOfficialDept: 'Hydraulic Engineer',
      expectedEmployeeDept: 'Water'
    },
    {
      classId: 'damaged_concrete_structures',
      expectedOfficialDept: 'Bridges / Maintenance',
      expectedEmployeeDept: 'Roads'
    },
    {
      classId: 'fallentrees',
      expectedOfficialDept: 'Tree Authority / Gardens',
      expectedEmployeeDept: 'Health'
    },
    {
      classId: 'graffitti_and_vandalism',
      expectedOfficialDept: 'License / Maintenance',
      expectedEmployeeDept: 'General'
    },
    {
      classId: 'illegalparking_obstruction',
      expectedOfficialDept: 'Anti-Encroachment / Traffic',
      expectedEmployeeDept: 'Roads'
    }
  ];

  test('Should cover all 13 canonical defect classes in test suite', () => {
    expect(EXPECTED_MUNICIPAL_ROUTING.length).toBe(13);
    const testedClasses = EXPECTED_MUNICIPAL_ROUTING.map(c => c.classId);
    taxonomy.CANONICAL_CLASS_IDS.forEach(canonicalId => {
      expect(testedClasses).toContain(canonicalId);
    });
  });

  EXPECTED_MUNICIPAL_ROUTING.forEach(({ classId, expectedOfficialDept, expectedEmployeeDept }) => {
    test(`Class [${classId}] should resolve to official department '${expectedOfficialDept}' and compatible employee department '${expectedEmployeeDept}'`, () => {
      const resolved = routingResolver.resolveRoutingForClass(classId);

      expect(resolved.classId).toBe(classId);
      expect(resolved.officialDepartment).toBe(expectedOfficialDept);
      expect(resolved.primaryEmployeeEnum).toBe(expectedEmployeeDept);
      expect(Array.isArray(resolved.compatibleEmployeeDepartments)).toBe(true);
      expect(resolved.compatibleEmployeeDepartments.length).toBeGreaterThan(0);
      expect(resolved.compatibleEmployeeDepartments).toContain(expectedEmployeeDept);
    });
  });

  test('Should handle invalid or unknown defect class gracefully', () => {
    const fallback = routingResolver.resolveRoutingForClass('unknown_defect_class');

    expect(fallback.officialDepartment).toBe('General');
    expect(fallback.primaryEmployeeEnum).toBe('General');
    expect(fallback.compatibleEmployeeDepartments).toContain('General');
  });

  test('Should return compatible query array for official department string', () => {
    const wasteDepts = routingResolver.getCompatibleEmployeeDepartments('Solid Waste Management');
    expect(wasteDepts).toContain('Waste');

    const waterDepts = routingResolver.getCompatibleEmployeeDepartments('Hydraulic Engineer');
    expect(waterDepts).toContain('Water');
  });
});
