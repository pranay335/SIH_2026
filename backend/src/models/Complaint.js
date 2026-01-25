const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaint_id: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String, // Store as base64 or URL
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      required: true,
    },
    municipalityCode: {
      type: String,
      required: true,
      default: 'BMC'
    },
    nlp_result: {
      predicted_sector: String,
      predicted_severity: String,
      sector_confidence: Number,
      severity_confidence: Number,
    },
    cnn_result: {
      predicted_class: String,
      confidence: Number,
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    notes: {
      type: String,
      default: '',
    },
    estimatedResolution: {
      type: Date,
      default: null,
    },
    resolvedDate: {
      type: Date,
      default: null,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
    },
    imageHash: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);
