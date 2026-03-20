const sharp = require('sharp');
const blockhash = require('blockhash-core');
const Complaint = require('../models/Complaint');
const deduplicationService = require('./deduplicationService');
const User = require('../models/User');

const SECTOR_CLASS_MAP = {
  water:       ['water', 'leak', 'pipe', 'flood'],
  road:        ['pothole', 'road', 'crack', 'footpath', 'street'],
  waste:       ['garbage', 'trash', 'sanitation', 'waste'],
  electricity: ['electric', 'pole', 'wire', 'light'],
  health:      ['health', 'medical'],
  drainage:    ['drain', 'sewer', 'block'],
  parks:       ['tree', 'park'],
  general:     [] 
};

// Helper to convert base64 image to raw pixel data for hashing
const getImageData = async (base64Str) => {
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  const processed = await sharp(buffer)
    .resize(256, 256)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    width: processed.info.width,
    height: processed.info.height,
    data: processed.data
  };
};

const getHash = async (base64Str) => {
  try {
    const imageData = await getImageData(base64Str);
    return blockhash.bmvbhash(imageData, 8);
  } catch (error) {
    console.warn('Could not generate pHash for image:', error.message);
    return null;
  }
};

const calculateHammingDistance = (hash1, hash2) => {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
};

class FraudService {
  async evaluateFraud({ image, nlp_result, cnn_result, user_id, description, sector, location }) {
    let fraudScore = 0;
    const flags = [];
    let duplicateOf = null;
    let computedPHash = null;

    // 1. Image Perceptual Hashing (Near-duplicate check)
    computedPHash = await getHash(image);
    if (computedPHash) {
      try {
        const recentComplaints = await Complaint.find({ 
          sector 
        }).select('_id imageHash').limit(100);

        for (const comp of recentComplaints) {
          if (comp.imageHash && comp.imageHash.length === computedPHash.length) {
            const distance = calculateHammingDistance(computedPHash, comp.imageHash);
            if (distance <= 10) {
              fraudScore += 3;
              flags.push('Near-duplicate image submitted');
              duplicateOf = comp._id;
              break;
            }
          }
        }
      } catch (err) {
        console.error('Error during image duplication check:', err);
      }
    }

    // 2. Text Duplicate Check (Jaccard Similarity)
    try {
      if (location && location.coordinates) {
        const nearbyComplaints = await Complaint.find({
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: location.coordinates },
              $maxDistance: 500
            }
          },
          sector: sector
        }).limit(20);

        for (const comp of nearbyComplaints) {
          const sim = await deduplicationService.calculateSemanticSimilarity(description, comp.description);
          if (sim >= 0.75) {
            fraudScore += 2;
            flags.push('Near-duplicate description used');
            if (!duplicateOf) duplicateOf = comp._id;
            break;
          }
        }
      }
    } catch (err) {
      console.error('Error during text duplication check:', err);
    }

    // 3. User Trust Score Check
    try {
      const user = await User.findById(user_id);
      if (user && user.trustScore != null && user.trustScore < 0.5) {
        fraudScore += 2;
        flags.push('User trust score below 0.5');
      }
    } catch (err) {
      console.error('Error checking user trust score:', err);
    }

    // 4. CNN Confidence Score Check
    let cnnFail = false;
    if (cnn_result?.confidence < 0.3) {
      fraudScore += 2;
      flags.push('Low CNN confidence');
      cnnFail = true;
    }

    // 5. NLP-CNN Sector/Class Mismatch Check
    let mismatchFail = false;
    if (nlp_result && cnn_result) {
      const nlpSector = (nlp_result.predicted_sector || 'general').toLowerCase();
      const cnnClass = (cnn_result.predicted_class || '').toLowerCase();
      
      let matchedNormalizedSector = 'general';
      if (nlpSector.includes('water')) matchedNormalizedSector = 'water';
      else if (nlpSector.includes('road')) matchedNormalizedSector = 'road';
      else if (nlpSector.includes('waste') || nlpSector.includes('garbage')) matchedNormalizedSector = 'waste';
      else if (nlpSector.includes('electric') || nlpSector.includes('light')) matchedNormalizedSector = 'electricity';
      else if (nlpSector.includes('health')) matchedNormalizedSector = 'health';
      else if (nlpSector.includes('drain') || nlpSector.includes('sewer')) matchedNormalizedSector = 'drainage';
      else if (nlpSector.includes('park')) matchedNormalizedSector = 'parks';

      const validKeywords = SECTOR_CLASS_MAP[matchedNormalizedSector] || [];
      
      if (matchedNormalizedSector !== 'general' && validKeywords.length > 0) {
        const hasMatch = validKeywords.some(kw => cnnClass.includes(kw));
        if (!hasMatch) {
          fraudScore += 3;
          flags.push(`NLP/CNN mismatch: Text indicates ${matchedNormalizedSector}, Image classified as ${cnnClass}`);
          mismatchFail = true;
        }
      }
    }

    // Determine Action
    let finalAction = 'Approved';
    if (cnnFail && mismatchFail) {
      finalAction = 'Rejected';
      flags.push('CRITICAL: Both CNN confidence and NLP classification failed. Suspicious and discarded, likely fake.');
    } else if (cnnFail || mismatchFail || fraudScore >= 6) {
      finalAction = 'Flagged';
    }

    return {
      fraudScore,
      flagged: finalAction === 'Flagged',
      finalAction,
      flagReason: flags.join(' | '),
      imageHash: computedPHash,
      duplicateOf
    };
  }
}

module.exports = new FraudService();
