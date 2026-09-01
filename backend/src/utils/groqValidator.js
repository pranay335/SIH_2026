/**
 * CivicMind — Groq Classification Output Validator
 * Strict Schema Validation and Authoritative Backend Taxonomy Enforcement Module.
 */

const taxonomy = require('../config/taxonomy');

const VALID_SEVERITIES = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

/**
 * Categorizes model-reported confidence score into safeguard tiers:
 * - >= 0.80: HIGH_CONFIDENCE
 * - 0.60 - 0.79: MEDIUM_CONFIDENCE
 * - < 0.60: LOW_CONFIDENCE
 * @param {number} confidence 
 * @returns {'HIGH_CONFIDENCE' | 'MEDIUM_CONFIDENCE' | 'LOW_CONFIDENCE'}
 */
const getConfidenceTier = (confidence) => {
  const score = Number(confidence);
  if (isNaN(score) || score < 0.60) {
    return 'LOW_CONFIDENCE';
  }
  if (score < 0.80) {
    return 'MEDIUM_CONFIDENCE';
  }
  return 'HIGH_CONFIDENCE';
};

/**
 * Converts uppercase Groq severity enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
 * to title-case backward-compatible representation ('Low', 'Medium', 'High', 'Critical').
 * @param {string} upperSeverity 
 * @returns {string}
 */
const toBackwardCompatibleSeverity = (upperSeverity) => {
  if (!upperSeverity || typeof upperSeverity !== 'string') return 'Medium';
  const norm = upperSeverity.trim().toUpperCase();
  const map = {
    'LOW': 'Low',
    'MEDIUM': 'Medium',
    'HIGH': 'High',
    'CRITICAL': 'Critical'
  };
  return map[norm] || 'Medium';
};

/**
 * Validates raw Groq AI response and enforces authoritative backend taxonomy mappings.
 * 
 * Target Schema:
 * {
 *   defectClass: string (one of 13 canonical classes),
 *   severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
 *   confidence: number (0.0 to 1.0),
 *   evidence: string (non-empty),
 *   detectedIssue: string (non-empty),
 *   department: string (AUTHORITATIVE from taxonomy),
 *   operationalAction: string (AUTHORITATIVE from taxonomy)
 * }
 * 
 * @param {Object} rawParsed 
 * @returns {{ valid: boolean, error?: string, code?: string, data?: Object }}
 */
const validateAndEnforceTaxonomy = (rawParsed) => {
  if (!rawParsed || typeof rawParsed !== 'object') {
    return {
      valid: false,
      error: 'Model output is missing or not a valid object.',
      code: 'INVALID_PAYLOAD'
    };
  }

  // 1. Extract defectClass (accepts 'defectClass' or 'classId')
  const rawClass = rawParsed.defectClass || rawParsed.classId;
  if (!rawClass || typeof rawClass !== 'string' || !rawClass.trim()) {
    return {
      valid: false,
      error: 'Missing required field: defectClass.',
      code: 'MISSING_DEFECT_CLASS'
    };
  }

  const normalizedClassId = rawClass.trim().toLowerCase();

  // Validate defectClass against canonical 13-class taxonomy
  if (!taxonomy.isValidClassId(normalizedClassId)) {
    return {
      valid: false,
      error: `Invalid defect class '${rawClass}'. Must be one of the 13 canonical classes.`,
      code: 'INVALID_TAXONOMY_CLASS'
    };
  }

  const canonicalDefect = taxonomy.getDefectClass(normalizedClassId);

  // 2. Validate severity enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  if (!rawParsed.severity || typeof rawParsed.severity !== 'string') {
    return {
      valid: false,
      error: 'Missing required field: severity.',
      code: 'MISSING_SEVERITY'
    };
  }

  const upperSeverity = rawParsed.severity.trim().toUpperCase();
  if (!VALID_SEVERITIES.includes(upperSeverity)) {
    return {
      valid: false,
      error: `Invalid severity '${rawParsed.severity}'. Must be one of: ${VALID_SEVERITIES.join(', ')}.`,
      code: 'INVALID_SEVERITY'
    };
  }

  // 3. Validate confidence number range (0 to 1)
  if (typeof rawParsed.confidence !== 'number' || isNaN(rawParsed.confidence)) {
    return {
      valid: false,
      error: 'Confidence score must be a number.',
      code: 'INVALID_CONFIDENCE'
    };
  }

  if (rawParsed.confidence < 0 || rawParsed.confidence > 1) {
    return {
      valid: false,
      error: `Confidence score (${rawParsed.confidence}) must be between 0.0 and 1.0.`,
      code: 'CONFIDENCE_OUT_OF_BOUNDS'
    };
  }

  // 4. Validate non-empty evidence string
  const rawEvidence = rawParsed.evidence || rawParsed.reasoning;
  if (!rawEvidence || typeof rawEvidence !== 'string' || !rawEvidence.trim()) {
    return {
      valid: false,
      error: 'Missing or empty evidence field.',
      code: 'MISSING_EVIDENCE'
    };
  }

  // 5. Validate non-empty detectedIssue string
  const rawIssue = rawParsed.detectedIssue || canonicalDefect.displayName;
  if (!rawIssue || typeof rawIssue !== 'string' || !rawIssue.trim()) {
    return {
      valid: false,
      error: 'Missing or empty detectedIssue field.',
      code: 'MISSING_DETECTED_ISSUE'
    };
  }

  // 6. AUTHORITATIVE TAXONOMY OVERWRITE:
  // Do not trust model-generated department or operationalAction.
  // Overwrite strictly using backend canonical taxonomy.
  const authoritativeDepartment = canonicalDefect.department;
  const authoritativeOperationalAction = canonicalDefect.operationalAction;
  const titleCaseSeverity = toBackwardCompatibleSeverity(upperSeverity);
  const confidenceTier = getConfidenceTier(rawParsed.confidence);

  return {
    valid: true,
    data: {
      defectClass: canonicalDefect.classId,
      severity: upperSeverity,
      titleCaseSeverity: titleCaseSeverity,
      confidence: Number(rawParsed.confidence.toFixed(4)),
      confidenceTier: confidenceTier,
      evidence: rawEvidence.trim(),
      detectedIssue: rawIssue.trim(),
      department: authoritativeDepartment,
      operationalAction: authoritativeOperationalAction,
      displayName: canonicalDefect.displayName
    }
  };
};

module.exports = {
  VALID_SEVERITIES,
  getConfidenceTier,
  toBackwardCompatibleSeverity,
  validateAndEnforceTaxonomy
};
