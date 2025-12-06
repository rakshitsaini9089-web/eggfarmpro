const express = require('express');
const router = express.Router();
const { 
  getWeightTrackings,
  getWeightTrackingsByBatch,
  getWeightTrackingStats,
  createWeightTracking,
  updateWeightTracking,
  deleteWeightTracking,
  checkGrowthDeviationAlerts
} = require('../controllers/weightTrackingController');

// Get all weight tracking records
router.get('/', getWeightTrackings);

// Get weight tracking records by batch ID
router.get('/batch/:batchId', getWeightTrackingsByBatch);

// Get weight tracking statistics for a batch
router.get('/stats/:batchId', getWeightTrackingStats);

// Check for growth deviation alerts
router.get('/alerts', checkGrowthDeviationAlerts);

// Create new weight tracking record
router.post('/', createWeightTracking);

// Update weight tracking record
router.put('/:id', updateWeightTracking);

// Delete weight tracking record
router.delete('/:id', deleteWeightTracking);

module.exports = router;