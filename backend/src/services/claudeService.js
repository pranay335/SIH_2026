const Anthropic = require('@anthropic-ai/sdk');
const taxonomy = require('../config/taxonomy');
const groqPrompt = require('../config/groqPrompt');
const groqValidator = require('../utils/groqValidator');

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5';
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Base64 size limit
const REQUEST_TIMEOUT_MS = 30000; // 30s timeout limit

// Forces the model to return a structured object instead of free-form text that has
// to be parsed and hoped-for — this is what prevents mislabeled/garbled classifications
// from ever reaching the database. If the model can't satisfy this schema, the SDK call
// itself fails loudly instead of silently producing a plausible-looking wrong answer.
const CLASSIFY_TOOL = {
  name: 'classify_complaint',
  description: 'Classify a municipal civic complaint into exactly one canonical defect class with a severity and calibrated confidence.',
  input_schema: {
    type: 'object',
    properties: {
      classId: {
        type: 'string',
        enum: taxonomy.getAllDefectClasses().map(c => c.classId),
        description: 'Exactly one canonical defect class ID from the taxonomy provided in the system prompt.'
      },
      severity: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Calibrated confidence per the confidence calibration rubric in the system prompt.'
      },
      evidence: {
        type: 'string',
        description: 'Factual summary of what evidence was actually available and how it was weighed, including any text/image mismatch case that applied.'
      },
      detectedIssue: {
        type: 'string',
        description: 'Concise one-sentence summary of the detected defect.'
      }
    },
    required: ['classId', 'severity', 'confidence', 'evidence', 'detectedIssue']
  }
};

class ClaudeService {
  constructor() {
    this.client = null;
  }

  getClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !apiKey.trim()) return null;
    if (!this.client) {
      this.client = new Anthropic({ apiKey: apiKey.trim() });
    }
    return this.client;
  }

  /**
   * Ensures base64 string is properly formatted for Claude's image content blocks.
   * @param {string} imageInput
   * @returns {{ base64: string, mediaType: string, sizeBytes: number } | null}
   */
  formatImageBlock(imageInput) {
    if (!imageInput || typeof imageInput !== 'string') return null;

    let base64Data = imageInput.trim();
    let mediaType = 'image/jpeg';

    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',');
      if (parts.length < 2) return null;

      const header = parts[0];
      base64Data = parts[1];

      const match = header.match(/data:(image\/[a-zA-Z0-9+.-]+);base64/);
      if (match) {
        mediaType = match[1];
      } else {
        return null;
      }
    }

    if (!base64Data || base64Data.length < 8) return null;
    if (/[^A-Za-z0-9+/=.-]/.test(base64Data)) return null;

    const sizeBytes = Math.ceil((base64Data.length * 3) / 4);

    // Claude only accepts these four media types for image blocks.
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(mediaType)) {
      mediaType = 'image/jpeg';
    }

    return { base64: base64Data, mediaType, sizeBytes };
  }

  /**
   * Classify municipal issue using Claude's vision + tool-use API.
   * @param {Object} params
   * @param {string} params.description
   * @param {string} params.image Base64 string or data URL
   * @param {string} [params.address]
   * @param {string} [params.municipalityCode]
   * @returns {Promise<Object>}
   */
  async classifyDefect({ description, image, address, municipalityCode }) {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY environment variable is missing or empty.',
        code: 'MISSING_API_KEY'
      };
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return {
        success: false,
        error: 'Missing or empty complaint description.',
        code: 'INVALID_DESCRIPTION'
      };
    }

    let imageBlock = null;
    if (image !== undefined && image !== null && typeof image === 'string' && image.trim() !== '') {
      imageBlock = this.formatImageBlock(image);
      if (!imageBlock) {
        return {
          success: false,
          error: 'Invalid or malformed base64 image data.',
          code: 'INVALID_IMAGE'
        };
      }
      if (imageBlock.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
        return {
          success: false,
          error: `Image size (${(imageBlock.sizeBytes / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of 10MB.`,
          code: 'IMAGE_TOO_LARGE'
        };
      }
    } else if (image !== undefined && image !== null && typeof image !== 'string') {
      return {
        success: false,
        error: 'Invalid or malformed base64 image data.',
        code: 'INVALID_IMAGE'
      };
    }

    const modelName = process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;

    let userText = `Citizen Complaint Description: "${description.trim()}"`;
    if (address) {
      const formattedAddress = typeof address === 'object' ? address.fullAddress || JSON.stringify(address) : address;
      userText += `\nLocation Address: ${formattedAddress}`;
    }
    if (municipalityCode) {
      userText += `\nMunicipality Code / Jurisdiction: ${municipalityCode}`;
    }

    const content = [];
    if (imageBlock) {
      userText += `\n[Visual Evidence: An image IS attached below and you CAN see it. Apply Step 2 of your reasoning process to compare it against the text.]`;
      content.push({ type: 'text', text: userText });
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageBlock.mediaType,
          data: imageBlock.base64
        }
      });
    } else {
      userText += `\n[Visual Evidence Attached: None. No image was provided by the citizen. Classify based solely on the description, per Step 3. Do NOT fabricate visual evidence.]`;
      content.push({ type: 'text', text: userText });
    }

    try {
      const requestPromise = client.messages.create({
        model: modelName,
        max_tokens: 2000,
        system: groqPrompt.buildSystemPrompt(),
        tools: [CLASSIFY_TOOL],
        tool_choice: { type: 'tool', name: 'classify_complaint' },
        messages: [{ role: 'user', content }]
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Anthropic API request timed out after 30 seconds')), REQUEST_TIMEOUT_MS)
      );

      const response = await Promise.race([requestPromise, timeoutPromise]);

      const toolUse = response.content?.find(block => block.type === 'tool_use' && block.name === 'classify_complaint');
      if (!toolUse || !toolUse.input) {
        return {
          success: false,
          error: 'Claude did not return the expected classify_complaint tool call.',
          code: 'EMPTY_RESPONSE'
        };
      }

      // Reuse the same taxonomy validation/enforcement Groq responses go through —
      // department/operationalAction are always authoritatively overwritten from
      // taxonomy.js here too, never trusted from the model.
      const validation = groqValidator.validateAndEnforceTaxonomy(toolUse.input);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          code: validation.code,
          rawParsed: toolUse.input
        };
      }

      const { data } = validation;

      return {
        success: true,
        modelUsed: modelName,
        provider: 'Claude',
        imageAnalyzed: !!imageBlock,
        defectClass: data.defectClass,
        classId: data.defectClass,
        displayName: data.displayName,
        department: data.department,
        operationalAction: data.operationalAction,
        severity: data.severity,
        confidence: data.confidence,
        evidence: data.evidence,
        detectedIssue: data.detectedIssue,
        taxonomyMetadata: taxonomy.getDefectClass(data.defectClass)
      };

    } catch (err) {
      const errorMessage = err.message || 'Unknown Anthropic API error';
      const statusCode = err.status || err.statusCode;

      if (statusCode === 401 || errorMessage.includes('401') || errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('key')) {
        return {
          success: false,
          error: 'Anthropic API Authentication failed (Invalid or revoked ANTHROPIC_API_KEY).',
          code: 'AUTH_FAILURE'
        };
      }
      if (statusCode === 429 || errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          error: 'Anthropic API rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        };
      }
      if (statusCode === 400) {
        return {
          success: false,
          error: `Anthropic API Bad Request: ${errorMessage}`,
          code: 'INVALID_REQUEST'
        };
      }
      if (statusCode === 404 || errorMessage.toLowerCase().includes('model')) {
        return {
          success: false,
          error: `Configured Anthropic model '${modelName}' is unavailable or invalid.`,
          code: 'MODEL_UNAVAILABLE'
        };
      }
      if (errorMessage.includes('timed out') || errorMessage.includes('TIMEOUT')) {
        return {
          success: false,
          error: 'Anthropic API classification timed out after 30 seconds.',
          code: 'REQUEST_TIMEOUT'
        };
      }
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        return {
          success: false,
          error: `Anthropic network connection failure: ${errorMessage}`,
          code: 'NETWORK_ERROR'
        };
      }
      if (statusCode >= 500) {
        return {
          success: false,
          error: `Anthropic server error (${statusCode}): ${errorMessage}`,
          code: 'GROQ_API_ERROR'
        };
      }

      console.error('❌ ClaudeService Classification Error:', errorMessage);

      return {
        success: false,
        error: `Claude service error: ${errorMessage}`,
        code: 'GROQ_API_ERROR'
      };
    }
  }
}

module.exports = new ClaudeService();
