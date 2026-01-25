const Sector = require('../models/Sector');

// @desc    Get all sectors
// @route   GET /api/sectors
// @access  Public
const getAllSectors = async (req, res) => {
  try {
    const sectors = await Sector.find({ is_active: true });
    res.json(sectors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sector by ID
// @route   GET /api/sectors/:id
// @access  Public
const getSectorById = async (req, res) => {
  try {
    const sector = await Sector.findById(req.params.id);
    if (!sector) {
      return res.status(404).json({ message: 'Sector not found' });
    }
    res.json(sector);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if point is within any sector
// @route   POST /api/sectors/validate-location
// @access  Public
const validateLocation = async (req, res) => {
  try {
    const { latitude, longitude, complaint_category } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required' 
      });
    }

    // Find sectors that contain the point using geospatial query
    const sectors = await Sector.find({
      is_active: true,
      boundaries: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        }
      }
    });

    if (sectors.length === 0) {
      return res.json({
        isValid: false,
        message: 'Location is outside any civic sector boundary',
        sectors: []
      });
    }

    // Filter sectors by complaint category if provided
    let validSectors = sectors;
    if (complaint_category) {
      validSectors = sectors.filter(sector => 
        sector.complaint_categories.includes(complaint_category)
      );
    }

    if (validSectors.length === 0) {
      return res.json({
        isValid: false,
        message: `Complaint category '${complaint_category}' is not allowed in this sector`,
        sectors: sectors.map(sector => ({
          id: sector._id,
          name: sector.name,
          sector_id: sector.sector_id,
          allowed_categories: sector.complaint_categories
        }))
      });
    }

    res.json({
      isValid: true,
      message: 'Location is valid for complaint submission',
      sectors: validSectors.map(sector => ({
        id: sector._id,
        name: sector.name,
        sector_id: sector.sector_id,
        ward_number: sector.ward_number,
        zone: sector.zone,
        allowed_categories: sector.complaint_categories
      }))
    });

  } catch (error) {
    console.error('Location validation error:', error);
    res.status(500).json({ message: 'Location validation failed' });
  }
};

// @desc    Get sectors by complaint category
// @route   GET /api/sectors/category/:category
// @access  Public
const getSectorsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const sectors = await Sector.find({
      is_active: true,
      complaint_categories: category
    });

    res.json(sectors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Initialize sample sectors (for development)
// @route   POST /api/sectors/initialize
// @access  Public (development only)
const initializeSampleSectors = async (req, res) => {
  try {
    // Clear existing sectors
    await Sector.deleteMany({});

    const sampleSectors = [
      {
        name: 'Sector 1 - Central',
        sector_id: 'SEC-001',
        ward_number: 'W-01',
        zone: 'Central Zone',
        boundaries: {
          type: 'Polygon',
          coordinates: [[
            [77.2090, 28.6139], // Delhi coordinates approx
            [77.2190, 28.6139],
            [77.2190, 28.6239],
            [77.2090, 28.6239],
            [77.2090, 28.6139]
          ]]
        },
        center: [77.2140, 28.6189],
        complaint_categories: ['Road', 'Water', 'Garbage', 'Electricity'],
        population: 50000,
        area_sqkm: 12.5
      },
      {
        name: 'Sector 2 - North',
        sector_id: 'SEC-002',
        ward_number: 'W-02',
        zone: 'North Zone',
        boundaries: {
          type: 'Polygon',
          coordinates: [[
            [77.2090, 28.6239],
            [77.2190, 28.6239],
            [77.2190, 28.6339],
            [77.2090, 28.6339],
            [77.2090, 28.6239]
          ]]
        },
        center: [77.2140, 28.6289],
        complaint_categories: ['Drainage', 'Street Light', 'Sanitation'],
        population: 35000,
        area_sqkm: 8.2
      },
      {
        name: 'Sector 3 - East',
        sector_id: 'SEC-003',
        ward_number: 'W-03',
        zone: 'East Zone',
        boundaries: {
          type: 'Polygon',
          coordinates: [[
            [77.2190, 28.6139],
            [77.2290, 28.6139],
            [77.2290, 28.6239],
            [77.2190, 28.6239],
            [77.2190, 28.6139]
          ]]
        },
        center: [77.2240, 28.6189],
        complaint_categories: ['Park', 'Building', 'Road'],
        population: 42000,
        area_sqkm: 10.1
      }
    ];

    await Sector.insertMany(sampleSectors);

    res.json({
      message: 'Sample sectors initialized successfully',
      count: sampleSectors.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSectors,
  getSectorById,
  validateLocation,
  getSectorsByCategory,
  initializeSampleSectors
};
