const groqService = require('../src/services/groqService');
const taxonomy = require('../src/config/taxonomy');
const groqValidator = require('../src/utils/groqValidator');

const MOCK_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';

describe('CivicMind Groq Multimodal Classification — 13-Class Taxonomy & Discriminating Pair Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GROQ_API_KEY: 'gsk_mock_integration_key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // Helper to mock Groq SDK JSON completion response
  const setupMockGroqResponse = (payload) => {
    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify(payload)
                }
              }
            ]
          })
        }
      }
    };
  };

  describe('Part 1: Realistic Test Cases for All 13 Canonical Classes', () => {
    const CANONICAL_TEST_CASES = [
      {
        classId: 'potholes_and_roadcracks',
        description: 'Deep 6-inch crater in the middle of driving lane on SV Road causing severe vehicle damage',
        expectedDept: 'Roads',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'potholes_and_roadcracks',
          severity: 'HIGH',
          confidence: 0.94,
          evidence: 'Visual evidence shows deep asphalt crater in driving lane.',
          detectedIssue: 'Severe road crater on SV Road'
        }
      },
      {
        classId: 'footpath_split',
        description: 'Missing paver blocks and cracked concrete sidewalk slab creating tripping hazard for pedestrians',
        expectedDept: 'Roads',
        allowedSeverities: ['LOW', 'MEDIUM', 'HIGH'],
        mockResponse: {
          classId: 'footpath_split',
          severity: 'MEDIUM',
          confidence: 0.88,
          evidence: 'Displaced paver tiles on pedestrian walkway.',
          detectedIssue: 'Damaged sidewalk tiles on foot path'
        }
      },
      {
        classId: 'damagedroadsigns',
        description: 'Bent Stop sign post knocked over by vehicle at major 4-way intersection',
        expectedDept: 'Traffic / Roads',
        allowedSeverities: ['LOW', 'MEDIUM', 'HIGH'],
        mockResponse: {
          classId: 'damagedroadsigns',
          severity: 'HIGH',
          confidence: 0.91,
          evidence: 'Regulatory traffic sign bent at ground level.',
          detectedIssue: 'Damaged regulatory traffic sign post'
        }
      },
      {
        classId: 'garbage_and_dumping',
        description: 'Overflowing municipal trash bin with household waste spilling over street and sidewalk',
        expectedDept: 'Solid Waste Management',
        allowedSeverities: ['LOW', 'MEDIUM', 'HIGH'],
        mockResponse: {
          classId: 'garbage_and_dumping',
          severity: 'MEDIUM',
          confidence: 0.93,
          evidence: 'Accumulated uncollected solid waste spreading on road.',
          detectedIssue: 'Overflowing municipal garbage bin'
        }
      },
      {
        classId: 'deadanimalspollution',
        description: 'Decomposing stray animal carcass lying on public road causing extreme foul stench and biohazard',
        expectedDept: 'SWM / Public Health',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'deadanimalspollution',
          severity: 'HIGH',
          confidence: 0.96,
          evidence: 'Dead animal carcass in public space requiring sanitary disposal.',
          detectedIssue: 'Decomposing animal carcass on street'
        }
      },
      {
        classId: 'drainage_waterlogging',
        description: 'Storm water drain inlet blocked with monsoon plastic debris causing knee-deep waterlogging on road',
        expectedDept: 'Storm Water Drains',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'drainage_waterlogging',
          severity: 'HIGH',
          confidence: 0.92,
          evidence: 'Standing water covering entire road intersection due to clogged drain.',
          detectedIssue: 'Monsoon waterlogging from blocked storm drain'
        }
      },
      {
        classId: 'damagedelectricalpoles',
        description: 'Severely rusted electric utility pole leaning precariously over road at 45 degree angle after collision',
        expectedDept: 'Street Lighting / MSEDCL',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'damagedelectricalpoles',
          severity: 'CRITICAL',
          confidence: 0.97,
          evidence: 'Concrete electric pole structural crack and steep tilt posing collapse risk.',
          detectedIssue: 'Dangerous leaning utility pole risk of collapse'
        }
      },
      {
        classId: 'wire_and_lighting_hazards',
        description: 'Bare live electrical wire dangling from street light fixture reaching knee level near water puddle',
        expectedDept: 'Street Lighting',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'wire_and_lighting_hazards',
          severity: 'CRITICAL',
          confidence: 0.98,
          evidence: 'Uninsulated bare electrical cable hanging near ground posing electrocution hazard.',
          detectedIssue: 'Dangling live electrical wire near pedestrian path'
        }
      },
      {
        classId: 'pipeline_leaks',
        description: 'Underground municipal water main burst gushing high-pressure clean drinking water 10 feet into air',
        expectedDept: 'Hydraulic Engineer',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'pipeline_leaks',
          severity: 'HIGH',
          confidence: 0.95,
          evidence: 'Gushing clean water supply pipeline break wasting potable water.',
          detectedIssue: 'Burst main water supply pipeline'
        }
      },
      {
        classId: 'damaged_concrete_structures',
        description: 'Exposed rusted steel rebar and crumbling spalling concrete on flyover load-bearing pillar',
        expectedDept: 'Bridges / Maintenance',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'damaged_concrete_structures',
          severity: 'HIGH',
          confidence: 0.89,
          evidence: 'Structural concrete degradation and exposed rebar on bridge pier.',
          detectedIssue: 'Spalling concrete and exposed rebar on flyover pillar'
        }
      },
      {
        classId: 'fallentrees',
        description: 'Uprooted banyan tree blocking both lanes of main thoroughfare and pulling down utility lines',
        expectedDept: 'Tree Authority / Gardens',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'fallentrees',
          severity: 'CRITICAL',
          confidence: 0.96,
          evidence: 'Large uprooted tree completely blocking roadway traffic.',
          detectedIssue: 'Uprooted tree blocking main thoroughfare'
        }
      },
      {
        classId: 'graffitti_and_vandalism',
        description: 'Illegal political paper posters and spray-painted graffiti covering public heritage wall facade',
        expectedDept: 'License / Maintenance',
        allowedSeverities: ['LOW', 'MEDIUM', 'HIGH'],
        mockResponse: {
          classId: 'graffitti_and_vandalism',
          severity: 'MEDIUM',
          confidence: 0.87,
          evidence: 'Unauthorized paper flyers and spray paint defacing public wall.',
          detectedIssue: 'Public wall defacement with illegal posters and graffiti'
        }
      },
      {
        classId: 'illegalparking_obstruction',
        description: 'Commercial delivery truck parked illegally directly across hospital emergency entrance gate',
        expectedDept: 'Anti-Encroachment / Traffic',
        allowedSeverities: ['MEDIUM', 'HIGH', 'CRITICAL'],
        mockResponse: {
          classId: 'illegalparking_obstruction',
          severity: 'CRITICAL',
          confidence: 0.93,
          evidence: 'Vehicle parked blocking critical emergency access gate.',
          detectedIssue: 'Illegal vehicle obstruction blocking hospital gate'
        }
      }
    ];

    CANONICAL_TEST_CASES.forEach(testCase => {
      test(`Class [${testCase.classId}] should validate canonical taxonomy, department, and severity`, async () => {
        setupMockGroqResponse(testCase.mockResponse);

        const result = await groqService.classifyDefect({
          description: testCase.description,
          image: MOCK_IMAGE,
          address: 'Mumbai, Maharashtra',
          municipalityCode: 'BMC'
        });

        expect(result.success).toBe(true);
        expect(taxonomy.CANONICAL_CLASS_IDS).toContain(result.defectClass);
        expect(result.defectClass).toBe(testCase.classId);
        expect(result.department).toBe(testCase.expectedDept);
        expect(testCase.allowedSeverities).toContain(result.severity);
        expect(typeof result.confidence).toBe('number');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Part 2: Discrimination Tests for Confusing Defect Pairs', () => {
    test('1. potholes_and_roadcracks vs footpath_split', async () => {
      // Scenario A: Road crater in asphalt driving lane -> potholes_and_roadcracks
      setupMockGroqResponse({
        classId: 'potholes_and_roadcracks',
        severity: 'HIGH',
        confidence: 0.92,
        evidence: 'Defect is on main asphalt driving lane.',
        detectedIssue: 'Road surface crater'
      });

      const resRoad = await groqService.classifyDefect({
        description: 'Large hole in middle of asphalt road driving lane',
        image: MOCK_IMAGE
      });
      expect(resRoad.defectClass).toBe('potholes_and_roadcracks');

      // Scenario B: Loose paver tiles on sidewalk -> footpath_split
      setupMockGroqResponse({
        classId: 'footpath_split',
        severity: 'MEDIUM',
        confidence: 0.90,
        evidence: 'Defect is on pedestrian sidewalk paver block path.',
        detectedIssue: 'Broken sidewalk paver blocks'
      });

      const resFootpath = await groqService.classifyDefect({
        description: 'Cracked paver blocks and displaced tiles on pedestrian sidewalk',
        image: MOCK_IMAGE
      });
      expect(resFootpath.defectClass).toBe('footpath_split');
    });

    test('2. damagedelectricalpoles vs wire_and_lighting_hazards', async () => {
      // Scenario A: Tilted utility pole -> damagedelectricalpoles
      setupMockGroqResponse({
        classId: 'damagedelectricalpoles',
        severity: 'HIGH',
        confidence: 0.94,
        evidence: 'Concrete pole is structurally leaning.',
        detectedIssue: 'Leaning concrete utility pole'
      });

      const resPole = await groqService.classifyDefect({
        description: 'Cracked concrete electric pole leaning dangerously over road',
        image: MOCK_IMAGE
      });
      expect(resPole.defectClass).toBe('damagedelectricalpoles');

      // Scenario B: Hanging wire / unlit lamps -> wire_and_lighting_hazards
      setupMockGroqResponse({
        classId: 'wire_and_lighting_hazards',
        severity: 'HIGH',
        confidence: 0.95,
        evidence: 'Exposed live wire hanging low without pole collapse.',
        detectedIssue: 'Dangling electric cable hazard'
      });

      const resWire = await groqService.classifyDefect({
        description: 'Open electrical junction box with live dangling wires',
        image: MOCK_IMAGE
      });
      expect(resWire.defectClass).toBe('wire_and_lighting_hazards');
    });

    test('3. garbage_and_dumping vs deadanimalspollution', async () => {
      // Scenario A: Trash pile -> garbage_and_dumping
      setupMockGroqResponse({
        classId: 'garbage_and_dumping',
        severity: 'MEDIUM',
        confidence: 0.91,
        evidence: 'Solid waste trash dump with plastic wrappers.',
        detectedIssue: 'Unattended garbage pile'
      });

      const resGarbage = await groqService.classifyDefect({
        description: 'Pile of uncollected household garbage and plastic bags near market',
        image: MOCK_IMAGE
      });
      expect(resGarbage.defectClass).toBe('garbage_and_dumping');

      // Scenario B: Animal carcass -> deadanimalspollution
      setupMockGroqResponse({
        classId: 'deadanimalspollution',
        severity: 'HIGH',
        confidence: 0.97,
        evidence: 'Dead animal carcass requiring sanitary spray.',
        detectedIssue: 'Dead stray animal on street'
      });

      const resAnimal = await groqService.classifyDefect({
        description: 'Decomposing dead dog lying on side of street causing foul odor',
        image: MOCK_IMAGE
      });
      expect(resAnimal.defectClass).toBe('deadanimalspollution');
    });

    test('4. drainage_waterlogging vs pipeline_leaks', async () => {
      // Scenario A: Monsoon puddle -> drainage_waterlogging
      setupMockGroqResponse({
        classId: 'drainage_waterlogging',
        severity: 'HIGH',
        confidence: 0.93,
        evidence: 'Stagnant monsoon water accumulation due to blocked storm drain.',
        detectedIssue: 'Monsoon waterlogging'
      });

      const resDrain = await groqService.classifyDefect({
        description: 'Knee deep stagnant monsoon rainwater on road from blocked gutter',
        image: MOCK_IMAGE
      });
      expect(resDrain.defectClass).toBe('drainage_waterlogging');

      // Scenario B: Burst water main -> pipeline_leaks
      setupMockGroqResponse({
        classId: 'pipeline_leaks',
        severity: 'HIGH',
        confidence: 0.96,
        evidence: 'High-pressure clean water gushing from underground supply pipe.',
        detectedIssue: 'Clean water supply line leak'
      });

      const resPipe = await groqService.classifyDefect({
        description: 'Clean drinking water gushing out from burst underground supply pipe',
        image: MOCK_IMAGE
      });
      expect(resPipe.defectClass).toBe('pipeline_leaks');
    });

    test('5. damaged_concrete_structures vs potholes_and_roadcracks', async () => {
      // Scenario A: Flyover pillar spalling -> damaged_concrete_structures
      setupMockGroqResponse({
        classId: 'damaged_concrete_structures',
        severity: 'HIGH',
        confidence: 0.91,
        evidence: 'Cracked bridge concrete pillar with exposed rusted rebar.',
        detectedIssue: 'Crumbling concrete bridge pillar'
      });

      const resStruct = await groqService.classifyDefect({
        description: 'Exposed rebar and crumbling concrete on flyover support pillar',
        image: MOCK_IMAGE
      });
      expect(resStruct.defectClass).toBe('damaged_concrete_structures');

      // Scenario B: Road crater -> potholes_and_roadcracks
      setupMockGroqResponse({
        classId: 'potholes_and_roadcracks',
        severity: 'HIGH',
        confidence: 0.95,
        evidence: 'Asphalt surface fissure on driving lane.',
        detectedIssue: 'Road surface pothole'
      });

      const resRoad = await groqService.classifyDefect({
        description: 'Deep asphalt pothole crater on driving road surface',
        image: MOCK_IMAGE
      });
      expect(resRoad.defectClass).toBe('potholes_and_roadcracks');
    });

    test('6. graffitti_and_vandalism vs garbage_and_dumping', async () => {
      // Scenario A: Wall posters/spray paint -> graffitti_and_vandalism
      setupMockGroqResponse({
        classId: 'graffitti_and_vandalism',
        severity: 'MEDIUM',
        confidence: 0.89,
        evidence: 'Wall defaced with paper posters and spray paint.',
        detectedIssue: 'Illegal wall posters and graffiti'
      });

      const resVandal = await groqService.classifyDefect({
        description: 'Public heritage wall covered in illegal paper advertisements and spray paint',
        image: MOCK_IMAGE
      });
      expect(resVandal.defectClass).toBe('graffitti_and_vandalism');

      // Scenario B: Trash dump -> garbage_and_dumping
      setupMockGroqResponse({
        classId: 'garbage_and_dumping',
        severity: 'MEDIUM',
        confidence: 0.92,
        evidence: 'Accumulation of solid garbage waste on ground.',
        detectedIssue: 'Solid waste trash accumulation'
      });

      const resDump = await groqService.classifyDefect({
        description: 'Heap of rotting household garbage dumped on vacant roadside plot',
        image: MOCK_IMAGE
      });
      expect(resDump.defectClass).toBe('garbage_and_dumping');
    });

    test('7. illegalparking_obstruction vs normal parking', async () => {
      // Scenario A: Gate blockage -> illegalparking_obstruction
      setupMockGroqResponse({
        classId: 'illegalparking_obstruction',
        severity: 'HIGH',
        confidence: 0.94,
        evidence: 'Vehicle parked across active entrance gate obstructing passage.',
        detectedIssue: 'Vehicle blocking hospital gate'
      });

      const resIllegal = await groqService.classifyDefect({
        description: 'Car parked directly across hospital gate preventing ambulance access',
        image: MOCK_IMAGE
      });
      expect(resIllegal.defectClass).toBe('illegalparking_obstruction');

      // Scenario B: Legally parked car inside marked slot -> Model should indicate normal parking or general
      setupMockGroqResponse({
        classId: 'illegalparking_obstruction',
        severity: 'LOW',
        confidence: 0.40,
        evidence: 'Vehicle is parked within marked bay without clear gate or lane blockage.',
        detectedIssue: 'Vehicle parked in bay with minimal obstruction'
      });

      const resNormal = await groqService.classifyDefect({
        description: 'Car parked in marked public parking bay',
        image: MOCK_IMAGE
      });

      // Low confidence (<0.60) triggers safeguard review flag
      expect(resNormal.confidence).toBeLessThan(0.60);
      expect(groqValidator.getConfidenceTier(resNormal.confidence)).toBe('LOW_CONFIDENCE');
    });
  });
});
