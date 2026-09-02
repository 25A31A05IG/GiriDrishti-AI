const express = require('express');

const {
  getLocations,
  getLocationReport
} = require('../controllers/locationController');

const router = express.Router();

// GET /api/locations
router.get(
  '/',
  getLocations
);

// GET /api/locations/location-report?lat=25&lng=85
router.get(
  '/location-report',
  getLocationReport
);

module.exports = router;