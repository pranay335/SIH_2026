const mongoose = require('mongoose');

const complaintGroupSchema = new mongoose.Schema({
  group_id: {
    type: String,
    required: true,
    unique: true
  },

  // Core issue identification
  issue_title: {
    type: String,
    required: true
  },

  issue_description: {
    type: String,
    required: true
  },

  // Location-based grouping
  centroid_location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  address: {
    fullAddress: { type: String, required: true },
    area: { type: String },
    locality: { type: String },
    city: { type: String, required: true },
    state: { type: String, default: 'Maharashtra' },
    pincode: { type: String }
  },

  // Classification
  sector: {
    type: String,
    required: true
  },

  municipalityCode: {
    type: String,
    required: true
  },

  // Assignment tracking
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Flagged', 'Rejected'],
    default: 'Pending'
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },

  // Aggregated data
  complaint_count: {
    type: Number,
    default: 1
  },

  affected_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Individual complaints in this group
  complaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  }],

  // Resolution tracking
  estimatedResolution: {
    type: Date,
    default: null
  },

  resolvedDate: {
    type: Date,
    default: null
  },

  // Metadata
  first_reported: {
    type: Date,
    default: Date.now
  },

  last_updated: {
    type: Date,
    default: Date.now
  },

  // AI confidence scores
  avg_confidence: {
    type: Number,
    default: 0
  },

  // Severity aggregation
  severity_distribution: {
    low: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    high: { type: Number, default: 0 }
  },

  // Notes for municipal employees
  notes: {
    type: String,
    default: ''
  },

  // Image evidence (representative images)
  representative_images: [{
    type: String
  }],

  // Duplicate detection metadata
  similarity_threshold: {
    type: Number,
    default: 0.7
  },

  clustering_method: {
    type: String,
    enum: ['location', 'semantic', 'hybrid'],
    default: 'hybrid'
  },

  // Proof of resolution images
  resolution_images: [{
    type: String
  }],

  // Resolution Feedback
  feedbackStatus: {
    type: String,
    enum: ['PENDING', 'SATISFIED', 'NOT_SATISFIED'],
    default: null
  },
  feedbackMessage: {
    type: String,
    default: ''
  },
  feedbackGivenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  feedbackGivenAt: {
    type: Date,
    default: null
  },
  reopened: {
    type: Boolean,
    default: false
  },
  reopenCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for geospatial queries
complaintGroupSchema.index({ centroid_location: '2dsphere' });

// Index for status queries
complaintGroupSchema.index({ status: 1 });

// Index for assignment queries
complaintGroupSchema.index({ assigned_to: 1 });

// Index for sector queries
complaintGroupSchema.index({ sector: 1 });

module.exports = mongoose.model('ComplaintGroup', complaintGroupSchema);
