const groqService = require('../src/services/groqService');
const taxonomy = require('../src/config/taxonomy');

// Sample valid small Base64 JPEG string for testing
const MOCK_BASE64_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';

describe('GroqService Multimodal & Text-Only Classification Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('1. text + image — should successfully classify with dual modality', async () => {
    process.env.GROQ_API_KEY = 'gsk_mock_valid_key';
    process.env.GROQ_MODEL = 'qwen/qwen3.6-27b';

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              classId: 'potholes_and_roadcracks',
              severity: 'HIGH',
              confidence: 0.95,
              evidence: 'Visual evidence shows deep asphalt crater and text mentions traffic slowdown.',
              detectedIssue: 'Deep road crater causing traffic slow down'
            })
          }
        }
      ]
    });

    groqService.client = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Deep road crater causing traffic slow down',
      image: MOCK_BASE64_IMAGE,
      address: 'MG Road, Fort, Mumbai',
      municipalityCode: 'BMC'
    });

    expect(result.success).toBe(true);
    expect(result.classId).toBe('potholes_and_roadcracks');
    expect(result.displayName).toBe('Potholes and Road Cracks');
    expect(result.department).toBe('Roads');
    expect(result.severity).toBe('HIGH');
    expect(result.confidence).toBe(0.95);
    expect(result.evidence).toContain('Visual evidence shows');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test('2. text only — should successfully classify without image payload', async () => {
    process.env.GROQ_API_KEY = 'gsk_mock_valid_key';
    process.env.GROQ_MODEL = 'qwen/qwen3.6-27b';

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              classId: 'wire_and_lighting_hazards',
              severity: 'HIGH',
              confidence: 0.90,
              evidence: 'Text description states live electric wire is dangling over sidewalk near school.',
              detectedIssue: 'Dangling live electric wire over sidewalk'
            })
          }
        }
      ]
    });

    groqService.client = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Live electric wire dangling low over pedestrian sidewalk near school',
      image: null,
      address: 'Dadar East, Mumbai',
      municipalityCode: 'BMC'
    });

    expect(result.success).toBe(true);
    expect(result.classId).toBe('wire_and_lighting_hazards');
    expect(result.department).toBe('Street Lighting');
    expect(result.severity).toBe('HIGH');
    expect(result.confidence).toBe(0.90);
    expect(result.evidence).toContain('Text description states');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test('3. empty description — should reject with INVALID_DESCRIPTION code', async () => {
    process.env.GROQ_API_KEY = 'mock_api_key';
    groqService.client = null;

    const result = await groqService.classifyDefect({
      description: '   ',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_DESCRIPTION');
    expect(result.error).toContain('Missing or empty complaint description');
  });

  test('4. invalid image — should reject malformed base64 image string with INVALID_IMAGE code', async () => {
    process.env.GROQ_API_KEY = 'mock_api_key';
    groqService.client = null;

    const result = await groqService.classifyDefect({
      description: 'Broken water pipe',
      image: 'not_a_valid_image_base64_payload!#@$'
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_IMAGE');
    expect(result.error).toContain('Invalid or malformed base64 image data');
  });

  test('should handle missing GROQ_API_KEY gracefully', async () => {
    delete process.env.GROQ_API_KEY;
    groqService.client = null;

    const result = await groqService.classifyDefect({
      description: 'Pothole on main road',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('MISSING_API_KEY');
    expect(result.error).toContain('GROQ_API_KEY');
  });

  test('should reject oversized image data', async () => {
    process.env.GROQ_API_KEY = 'mock_api_key';
    groqService.client = null;

    const giantImage = 'data:image/jpeg;base64,' + 'A'.repeat(15 * 1024 * 1024);

    const result = await groqService.classifyDefect({
      description: 'Large waste dumping',
      image: giantImage
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('IMAGE_TOO_LARGE');
  });

  test('should correctly format Base64 image into data URL', () => {
    const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const formatted = groqService.formatImageDataUrl(rawBase64);

    expect(formatted).not.toBeNull();
    expect(formatted.dataUrl).toContain('data:image/jpeg;base64,');
  });

  test('should handle rate limit errors (HTTP 429) gracefully', async () => {
    process.env.GROQ_API_KEY = 'gsk_mock_key';

    const rateLimitError = new Error('Rate limit exceeded');
    rateLimitError.status = 429;

    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(rateLimitError)
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Clogged gutter',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  test('should never expose GROQ_API_KEY in output or error objects', async () => {
    const secretKey = 'gsk_SUPER_SECRET_KEY_123456789';
    process.env.GROQ_API_KEY = secretKey;

    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('Connection failure'))
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Pipeline burst',
      image: MOCK_BASE64_IMAGE
    });

    const jsonString = JSON.stringify(result);
    expect(jsonString).not.toContain(secretKey);
  });
});
