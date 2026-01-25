const mongoose = require('mongoose');

const sectorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    sector_id: {
      type: String,
      required: true,
      unique: true,
    },
    ward_number: {
      type: String,
      required: true,
    },
    zone: {
      type: String,
      required: true,
    },
    boundaries: {
      geoJsonType: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon'
      },
      coordinates: [[[Number]]], // Array of polygon rings (outer ring + holes)
    },
    center: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    complaint_categories: [{
      type: String,
      enum: ['Road', 'Water', 'Garbage', 'Electricity', 'Drainage', 'Street Light', 'Sanitation', 'Park', 'Building'],
    }],
    is_active: {
      type: Boolean,
      default: true,
    },
    population: {
      type: Number,
      default: 0,
    },
    area_sqkm: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
sectorSchema.index({ boundaries: '2dsphere' });

module.exports = mongoose.model('Sector', sectorSchema);
