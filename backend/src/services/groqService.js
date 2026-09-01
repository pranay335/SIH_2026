const { Groq } = require('groq-sdk');
const taxonomy = require('../config/taxonomy');
const groqPrompt = require('../config/groqPrompt');
const groqValidator = require('../utils/groqValidator');

// Default fallback model if process.env.GROQ_MODEL is unset
const DEFAULT_GROQ_MODEL = 'qwen/qwen3.6-27b';
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Base64 size limit
const REQUEST_TIMEOUT_MS = 30000; // 30s timeout limit

// Groq models confirmed to accept multimodal (image_url) content. Matching on the
// literal substring "vision" is unreliable — none of Groq's actual vision-capable
// models (qwen/qwen3.6-27b, qwen/qwen3.8-27b) contain that word, so that check
// silently dropped every image sent to the model while it kept fabricating
// "visual evidence" text anyway. Keep this list in sync with Groq's vision docs.
const VISION_CAPABLE_MODELS = new Set([
  'qwen/qwen3.6-27b',
  'qwen/qwen3.8-27b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct'
]);

class GroqService {
  constructor() {
    this.client = null;
  }

  /**
   * Helper to lazily obtain or re-initialize Groq SDK instance
   */
  getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return null;
    }
    if (!this.client) {
      this.client = new Groq({ apiKey: apiKey.trim() });
    }
    return this.client;
  }

  /**
   * Ensures base64 string is properly formatted as a data URL for vision models
   * @param {string} imageInput 
   * @returns {{ dataUrl: string, sizeBytes: number } | null}
   */
  formatImageDataUrl(imageInput) {
    if (!imageInput || typeof imageInput !== 'string') return null;

    let base64Data = imageInput.trim();
    let mimeType = 'image/jpeg';

    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',');
      if (parts.length < 2) return null;

      const header = parts[0];
      base64Data = parts[1];

      const match = header.match(/data:(image\/[a-zA-Z0-9+.-]+);base64/);
      if (match) {
        mimeType = match[1];
      } else {
        return null;
      }
    }

    if (!base64Data || base64Data.length < 8) {
      return null;
    }

    // Fast non-regex character validation to avoid stack overflow on massive image strings
    if (/[^A-Za-z0-9+/=.-]/.test(base64Data)) {
      return null;
    }

    // Estimate byte size from Base64 length
    const sizeBytes = Math.ceil((base64Data.length * 3) / 4);

    return {
      dataUrl: `data:${mimeType};base64,${base64Data}`,
      sizeBytes
    };
  }

  /**
   * Classify municipal issue using Groq Multimodal API
   * @param {Object} params
   * @param {string} params.description
   * @param {string} params.image Base64 string or data URL
   * @param {string} [params.address]
   * @param {string} [params.municipalityCode]
   * @returns {Promise<Object>}
   */
  async classifyDefect({ description, image, address, municipalityCode }) {
    // 1. Verify API Key presence
    const client = this.getGroqClient();
    if (!client) {
      return {
        success: false,
        error: 'GROQ_API_KEY environment variable is missing or empty.',
        code: 'MISSING_API_KEY'
      };
    }

    // 2. Validate input fields
    if (!description || typeof description !== 'string' || !description.trim()) {
      return {
        success: false,
        error: 'Missing or empty complaint description.',
        code: 'INVALID_DESCRIPTION'
      };
    }

    // 3. Format and validate image payload (optional if not provided)
    let imageMeta = null;
    if (image !== undefined && image !== null && typeof image === 'string' && image.trim() !== '') {
      imageMeta = this.formatImageDataUrl(image);
      if (!imageMeta) {
        return {
          success: false,
          error: 'Invalid or malformed base64 image data.',
          code: 'INVALID_IMAGE'
        };
      }

      if (imageMeta.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
        return {
          success: false,
          error: `Image size (${(imageMeta.sizeBytes / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of 10MB.`,
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

    const modelName = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
    const isVisionModel = VISION_CAPABLE_MODELS.has(modelName);

    // An image was uploaded but the configured model can't actually see it — the model
    // must be told this explicitly so it never fabricates visual confirmation language.
    const imageProvidedButUnviewable = !!imageMeta && !isVisionModel;
    if (imageProvidedButUnviewable) {
      console.warn(`⚠️ GROQ_MODEL "${modelName}" is not vision-capable — image will NOT be analyzed. Set GROQ_MODEL=qwen/qwen3.6-27b to enable real image classification.`);
    }

    // 4. Construct user message content via dedicated groqPrompt module
    const userContent = groqPrompt.buildUserContent({
      description,
      imageMeta,
      address,
      municipalityCode,
      isVisionModel,
      imageProvidedButUnviewable
    });

    const messages = [
      {
        role: 'system',
        content: groqPrompt.buildSystemPrompt()
      },
      {
        role: 'user',
        content: userContent
      }
    ];

    try {
      // 5. Execute Groq API request with timeout wrapper
      const completionParams = {
        model: modelName,
        messages,
        temperature: 0.1,
        max_completion_tokens: 4000,
        response_format: { type: 'json_object' }
      };

      const completionPromise = client.chat.completions.create(completionParams);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Groq API request timed out after 30 seconds')), REQUEST_TIMEOUT_MS)
      );

      const response = await Promise.race([completionPromise, timeoutPromise]);

      // 6. Extract and parse response content
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        return {
          success: false,
          error: 'Received empty response payload from Groq model.',
          code: 'EMPTY_RESPONSE'
        };
      }

      let parsed;
      try {
        let cleanContent = content;

        // If reasoning model generated <think>...</think>, extract content after thinking completes
        if (cleanContent.includes('</think>')) {
          cleanContent = cleanContent.split('</think>').pop();
        } else if (cleanContent.includes('<think>')) {
          cleanContent = cleanContent.replace(/<think>[\s\S]*/gi, '');
        }

        cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
          cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
        }

        parsed = JSON.parse(cleanContent);
      } catch (jsonErr) {
        return {
          success: false,
          error: `Failed to parse model output as JSON: ${jsonErr.message}`,
          code: 'MALFORMED_RESPONSE',
          rawContent: content
        };
      }

      // 7. Strict output schema validation and backend authoritative taxonomy overwrite
      const validation = groqValidator.validateAndEnforceTaxonomy(parsed);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          code: validation.code,
          rawParsed: parsed
        };
      }

      const { data } = validation;

      return {
        success: true,
        modelUsed: modelName,
        imageAnalyzed: !!imageMeta && isVisionModel,
        defectClass: data.defectClass,
        classId: data.defectClass,
        displayName: data.displayName,
        department: data.department,           // Authoritative backend taxonomy overwrite
        operationalAction: data.operationalAction, // Authoritative backend taxonomy overwrite
        severity: data.severity,
        confidence: data.confidence,
        evidence: data.evidence,
        detectedIssue: data.detectedIssue,
        taxonomyMetadata: taxonomy.getDefectClass(data.defectClass)
      };

    } catch (err) {
      // Safe error extraction (Never expose API key)
      const errorMessage = err.message || 'Unknown Groq API error';
      const statusCode = err.status || err.statusCode;

      if (statusCode === 401 || errorMessage.includes('401') || errorMessage.includes('Invalid API Key')) {
        return {
          success: false,
          error: 'Groq API Authentication failed (Invalid or revoked GROQ_API_KEY).',
          code: 'AUTH_FAILURE'
        };
      }

      if (statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return {
          success: false,
          error: 'Groq API rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        };
      }

      if (statusCode === 400) {
        return {
          success: false,
          error: `Groq API Bad Request: ${errorMessage}`,
          code: 'INVALID_REQUEST'
        };
      }

      if (statusCode === 404 || errorMessage.includes('model')) {
        return {
          success: false,
          error: `Configured Groq model '${modelName}' is unavailable or invalid.`,
          code: 'MODEL_UNAVAILABLE'
        };
      }

      if (errorMessage.includes('timed out') || errorMessage.includes('TIMEOUT')) {
        return {
          success: false,
          error: 'Groq API classification timed out after 30 seconds.',
          code: 'REQUEST_TIMEOUT'
        };
      }

      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        return {
          success: false,
          error: `Groq network connection failure: ${errorMessage}`,
          code: 'NETWORK_ERROR'
        };
      }

      if (statusCode >= 500) {
        return {
          success: false,
          error: `Groq server error (${statusCode}): ${errorMessage}`,
          code: 'GROQ_API_ERROR'
        };
      }

      console.error('❌ GroqService Classification Error:', errorMessage);

      return {
        success: false,
        error: `Groq service error: ${errorMessage}`,
        code: 'GROQ_API_ERROR'
      };
    }
  }
}

module.exports = new GroqService();
