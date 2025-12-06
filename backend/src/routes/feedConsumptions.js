const express = require('express');
const router = express.Router();
const { 
  getFeedConsumptions,
  getFeedConsumptionsByBatch,
  getFeedConsumptionStats,
  createFeedConsumption,
  updateFeedConsumption,
  deleteFeedConsumption,
  checkHighConsumptionAlerts
} = require('../controllers/feedConsumptionController');

// Get all feed consumption records
router.get('/', getFeedConsumptions);

// Get feed consumption records by batch ID
router.get('/batch/:batchId', getFeedConsumptionsByBatch);

// Get feed consumption statistics for a batch
router.get('/stats/:batchId', getFeedConsumptionStats);

// Check for high consumption alerts
router.get('/alerts', checkHighConsumptionAlerts);

// Create new feed consumption record
router.post('/', createFeedConsumption);

// Update feed consumption record
router.put('/:id', updateFeedConsumption);

// Delete feed consumption record
router.delete('/:id', deleteFeedConsumption);

module.exports = router;