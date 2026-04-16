const Complaint = require('../models/Complaint');
const ComplaintGroup = require('../models/ComplaintGroup');
const crypto = require('crypto');

class DeduplicationService {
  constructor() {
    this.locationThreshold = 200; // 200 meters radius for location similarity
    this.semanticThreshold = 0.7; // 70% semantic similarity
    this.sectorWeight = 0.3; // Weight for sector matching
    this.locationWeight = 0.4; // Weight for location proximity
    this.semanticWeight = 0.3; // Weight for semantic similarity
  }

  /**
   * Main deduplication method - finds or creates a complaint group
   */
  async processComplaint(complaintData) {
    try {
      // Step 1: Find similar existing complaints
      const similarGroups = await this.findSimilarGroups(complaintData);

      if (similarGroups.length > 0) {
        // Step 2: Add to existing group
        return await this.addToExistingGroup(similarGroups[0], complaintData);
      } else {
        // Step 3: Create new group
        return await this.createNewGroup(complaintData);
      }
    } catch (error) {
      console.error('Error in deduplication service:', error);
      throw error;
    }
  }

  /**
   * Find similar complaint groups based on location, sector, and semantic similarity
   */
  async findSimilarGroups(complaintData) {
    const { location, sector, description, municipalityCode } = complaintData;

    // Step 1: Find groups within location threshold
    const nearbyGroups = await ComplaintGroup.find({
      centroid_location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: this.locationThreshold
        }
      },
      sector: sector,
      municipalityCode: municipalityCode,
      status: { $in: ['Pending', 'Assigned', 'In Progress'] }
    }).populate('complaints');

    // Step 2: Filter by semantic similarity
    const similarGroups = [];
    for (const group of nearbyGroups) {
      const similarity = await this.calculateSemanticSimilarity(
        description,
        group.issue_description
      );

      const overallSimilarity = this.calculateOverallSimilarity(
        similarity,
        this.calculateLocationProximity(location, group.centroid_location),
        sector === group.sector ? 1 : 0
      );

      if (overallSimilarity >= this.semanticThreshold) {
        similarGroups.push({
          group,
          similarity: overallSimilarity
        });
      }
    }

    // Step 3: Sort by similarity and return
    return similarGroups.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate semantic similarity between two descriptions
   */
  async calculateSemanticSimilarity(text1, text2) {
    // Simple text similarity for now - can be enhanced with NLP
    const words1 = this.extractKeywords(text1.toLowerCase());
    const words2 = this.extractKeywords(text2.toLowerCase());

    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    if (union.length === 0) return 0;
    return intersection.length / union.length;
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  extractKeywords(text) {
    // Remove common stop words and extract meaningful words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];

    return text
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word && word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Calculate location proximity score
   */
  calculateLocationProximity(location1, location2) {
    const distance = this.calculateDistance(
      location1.coordinates[1], // lat
      location1.coordinates[0], // lng
      location2.coordinates[1], // lat
      location2.coordinates[0]  // lng
    );

    // Convert distance to similarity score (closer = higher similarity)
    return Math.max(0, 1 - (distance / this.locationThreshold));
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate overall similarity score
   */
  calculateOverallSimilarity(semanticScore, locationScore, sectorScore) {
    return (
      semanticScore * this.semanticWeight +
      locationScore * this.locationWeight +
      sectorScore * this.sectorWeight
    );
  }

  /**
   * Add complaint to existing group
   */
  async addToExistingGroup(groupData, complaintData) {
    const { group } = groupData;

    // Update group centroid location
    const newCentroid = this.calculateNewCentroid(
      group.centroid_location,
      complaintData.location,
      group.complaint_count
    );

    // Update severity distribution
    const severity = complaintData.nlp_result?.predicted_severity?.toLowerCase() || 'low';
    group.severity_distribution[severity] = (group.severity_distribution[severity] || 0) + 1;

    // Update group
    group.complaint_count += 1;
    group.centroid_location = newCentroid;
    group.complaints.push(complaintData._id);
    group.affected_users.addToSet(complaintData.user_id);
    group.last_updated = new Date();

    // Update priority based on aggregated severity
    group.priority = this.calculateAggregatedPriority(group.severity_distribution);

    // Add representative image if needed
    if (group.representative_images.length < 3) {
      group.representative_images.push(complaintData.image);
    }

    // PERSIST ASSIGNMENT FROM COMPLAINT IF GROUP IS PENDING
    if (group.status === 'Pending' && complaintData.assigned_to) {
      group.assigned_to = complaintData.assigned_to;
      group.status = complaintData.status || 'Assigned';
    }

    await group.save();

    // Update individual complaint to reference the group
    await Complaint.findByIdAndUpdate(
      complaintData._id,
      {
        group_id: group._id,
        assigned_to: group.assigned_to,
        status: group.status
      }
    );

    return {
      isNewGroup: false,
      group,
      message: `Complaint added to existing group: ${group.issue_title}`
    };
  }

  /**
   * Create new complaint group
   */
  async createNewGroup(complaintData) {
    const groupId = this.generateGroupId();
    const severity = complaintData.nlp_result?.predicted_severity?.toLowerCase() || 'low';

    const group = new ComplaintGroup({
      group_id: groupId,
      issue_title: this.generateIssueTitle(complaintData.description),
      issue_description: complaintData.description,
      centroid_location: complaintData.location,
      address: complaintData.address,
      sector: complaintData.sector,
      municipalityCode: complaintData.municipalityCode,
      complaint_count: 1,
      complaints: [complaintData._id],
      affected_users: [complaintData.user_id],
      priority: this.mapSeverityToPriority(severity),
      severity_distribution: {
        low: severity === 'low' ? 1 : 0,
        medium: severity === 'medium' ? 1 : 0,
        high: severity === 'high' ? 1 : 0
      },
      representative_images: [complaintData.image],
      avg_confidence: complaintData.nlp_result?.confidence || 0,

      // PERSIST ASSIGNMENT FROM COMPLAINT
      assigned_to: complaintData.assigned_to || null,
      status: complaintData.status || 'Pending'
    });

    await group.save();

    // Update individual complaint to reference the group
    await Complaint.findByIdAndUpdate(
      complaintData._id,
      { group_id: group._id }
    );

    return {
      isNewGroup: true,
      group,
      message: `New complaint group created: ${group.issue_title}`
    };
  }

  /**
   * Calculate new centroid location for group
   */
  calculateNewCentroid(currentCentroid, newLocation, currentCount) {
    const newCount = currentCount + 1;
    const weight = 1 / newCount;

    return {
      type: 'Point',
      coordinates: [
        currentCentroid.coordinates[0] * (1 - weight) + newLocation.coordinates[0] * weight,
        currentCentroid.coordinates[1] * (1 - weight) + newLocation.coordinates[1] * weight
      ]
    };
  }

  /**
   * Calculate aggregated priority based on severity distribution
   */
  calculateAggregatedPriority(severityDist) {
    const total = severityDist.low + severityDist.medium + severityDist.high;

    if (severityDist.high / total > 0.3) return 'Critical';
    if (severityDist.high / total > 0.1 || severityDist.medium / total > 0.5) return 'High';
    if (severityDist.medium / total > 0.2) return 'Medium';
    return 'Low';
  }

  /**
   * Generate unique group ID
   */
  generateGroupId() {
    return `GRP_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Generate issue title from description
   */
  generateIssueTitle(description) {
    const words = this.extractKeywords(description);
    return words.slice(0, 5).join(' ').charAt(0).toUpperCase() + words.slice(0, 5).join(' ').slice(1);
  }

  /**
   * Map severity to priority
   */
  mapSeverityToPriority(severity) {
    const mapping = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High'
    };
    return mapping[severity] || 'Low';
  }

  /**
   * Get statistics about deduplication
   */
  async getDeduplicationStats() {
    const totalGroups = await ComplaintGroup.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const avgComplaintsPerGroup = totalGroups > 0 ? totalComplaints / totalGroups : 0;

    const groupsByStatus = await ComplaintGroup.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return {
      totalGroups,
      totalComplaints,
      avgComplaintsPerGroup: Math.round(avgComplaintsPerGroup * 100) / 100,
      groupsByStatus,
      deduplicationRate: totalGroups > 0 ? ((totalComplaints - totalGroups) / totalComplaints * 100).toFixed(2) : 0
    };
  }
}

module.exports = new DeduplicationService();
