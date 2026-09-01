const groqService = require('../src/services/groqService');
const Complaint = require('../src/models/Complaint');
const mongoose = require('mongoose');

describe('Production-Grade Groq Failure Handling & Graceful Fallback', () => {
  const originalEnv = process.env;
  const MOCK_BASE64_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('1. MISSING_API_KEY — should return controlled error object when GROQ_API_KEY is missing', async () => {
    delete process.env.GROQ_API_KEY;
    groqService.client = null;

    const result = await groqService.classifyDefect({
      description: 'Clogged roadside drain',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('MISSING_API_KEY');
    expect(result.error).toContain('GROQ_API_KEY');
  });

  test('2. AUTH_FAILURE — should return controlled AUTH_FAILURE error on HTTP 401 response', async () => {
    process.env.GROQ_API_KEY = 'invalid_key';
    const authError = new Error('Invalid API Key');
    authError.status = 401;

    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(authError)
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Pothole on street',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('AUTH_FAILURE');
    expect(result.error).toContain('Authentication failed');
  });

  test('3. RATE_LIMIT_EXCEEDED — should return controlled RATE_LIMIT_EXCEEDED error on HTTP 429 response', async () => {
    process.env.GROQ_API_KEY = 'gsk_mock';
    const rateError = new Error('Rate limit exceeded');
    rateError.status = 429;

    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(rateError)
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Garbage dump on roadside',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(result.error).toContain('rate limit exceeded');
  });

  test('4. REQUEST_TIMEOUT — should return controlled REQUEST_TIMEOUT error on request timeout', async () => {
    process.env.GROQ_API_KEY = 'gsk_mock';
    const timeoutError = new Error('Request TIMEOUT after 30000ms');

    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(timeoutError)
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Fallen tree blocking lane',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('REQUEST_TIMEOUT');
    expect(result.error).toContain('timed out');
  });

  test('5. NETWORK_ERROR — should return controlled NETWORK_ERROR on connection failure', async () => {
    process.env.GROQ_API_KEY = 'gsk_mock';
    const netError = new Error('fetch failed ENOTFOUND api.groq.com');

    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(netError)
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Pipeline leak clean water',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.error).toContain('network connection failure');
  });

  test('6. GROQ_API_ERROR — should return controlled GROQ_API_ERROR on HTTP 500 response', async () => {
    process.env.GROQ_API_KEY = 'gsk_mock';
    const serverError = new Error('Internal Server Error');
    serverError.status = 500;

    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(serverError)
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Damaged electrical pole',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('GROQ_API_ERROR');
    expect(result.error).toContain('Groq server error');
  });

  test('7. MALFORMED_RESPONSE — should handle non-JSON raw AI completion output', async () => {
    process.env.GROQ_API_KEY = 'gsk_mock';

    groqService.client = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Sorry, as an AI language model I cannot answer this request in JSON.'
                }
              }
            ]
          })
        }
      }
    };

    const result = await groqService.classifyDefect({
      description: 'Damaged road sign',
      image: MOCK_BASE64_IMAGE
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('MALFORMED_RESPONSE');
    expect(result.error).toContain('Failed to parse model output as JSON');
  });

  test('8. Complaint Schema — should record failed AI classification status, errorCode, and errorMessage', () => {
    const complaint = new Complaint({
      complaint_id: 'CMP-FAIL-TEST-001',
      description: 'Water leak',
      image: MOCK_BASE64_IMAGE,
      location: { type: 'Point', coordinates: [72.87, 19.07] },
      address: { fullAddress: 'Mumbai', city: 'Mumbai' },
      user_id: new mongoose.Types.ObjectId(),
      sector: 'potholes_and_roadcracks',
      priority: 'Medium',
      flagged: true,
      flagReason: 'AI Classification Service Unavailable: RATE_LIMIT_EXCEEDED',
      aiClassification: {
        provider: 'Groq',
        model: 'qwen/qwen3.6-27b',
        defectClass: null,
        confidence: 0,
        confidenceTier: 'LOW_CONFIDENCE',
        detectedIssue: 'AI Classification Service Unavailable',
        evidence: 'AI Classification failed: Groq API rate limit exceeded.',
        status: 'FAILED',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        errorMessage: 'Groq API rate limit exceeded. Please try again later.'
      }
    });

    expect(complaint.aiClassification.status).toBe('FAILED');
    expect(complaint.aiClassification.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    expect(complaint.aiClassification.errorMessage).toContain('rate limit exceeded');
    expect(complaint.flagged).toBe(true);
  });
});
