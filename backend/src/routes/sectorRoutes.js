const express = require('express');
const router = express.Router();
const {
  getAllSectors,
  getSectorById,
  validateLocation,
  getSectorsByCategory,
  initializeSampleSectors
} = require('../controllers/sectorController');

// Public routes
router.get('/', getAllSectors);
router.get('/:id', getSectorById);
router.get('/category/:category', getSectorsByCategory);
router.post('/validate-location', validateLocation);

// Development route to initialize sample data
router.post('/initialize', initializeSampleSectors);

module.exports = router;
