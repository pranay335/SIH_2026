const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaint_id: {
      type: String,
      required: true,
      unique: true
    },

    description: {
      type: String,
      required: true
    },

    image: {
      type: String,
      required: true
    },

    // ✅ GEOJSON LOCATION (FIXED)
    location: {
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

    // 📍 Human-readable address from reverse geocoding
    address: {
      fullAddress: { type: String, required: true },
      area: { type: String },
      locality: { type: String },
      city: { type: String, required: true },
      state: { type: String, default: 'Maharashtra' },
      pincode: { type: String },
      landmark: { type: String }
    },

    sector: {
      type: String,
      required: true,
      default: 'General'
    },

    municipalityCode: {
      type: String,
      default: 'BMC'
    },

    nlp_result: {
      type: Object
    },

    cnn_result: {
      type: Object
    },

    status: {
      type: String,
      default: 'Pending'
    },

    priority: {
      type: String,
      default: 'Low'
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplaintGroup',
      default: null
    },

    notes: {
      type: String,
      default: ''
    },

    estimatedResolution: {
      type: Date,
      default: null
    },

    resolvedDate: {
      type: Date,
      default: null
    },

    flagged: {
      type: Boolean,
      default: false
    },

    flagReason: {
      type: String,
      default: ''
    },

    imageHash: {
      type: String
    },

    fraudScore: {
      type: Number,
      default: 0
    },

    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    }
  },
  { timestamps: true }
);

// ✅ REQUIRED GEO INDEX
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ imageHash: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
