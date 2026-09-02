const {
  getLocations
} = require('./locationController');

const getAlerts = async (req, res) => {
  try {
    const mockResponse = {
      json: data => data
    };

    /*
      In production, call the same risk-location
      service/database used by locations.
    */

    res.json([]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Unable to load alerts'
    });
  }
};

module.exports = {
  getAlerts
};