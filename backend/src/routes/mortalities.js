const express = require('express');
const router = express.Router();
const { 
  getMortalities,
  getMortalitiesByBatch,
  getMortalityStats,
  createMortality,
  updateMortality,
  deleteMortality,
  checkMortalityAlerts
} = require('../controllers/mortalityController');

// Get all mortality records
router.get('/', getMortalities);

// Get mortality records by batch ID
router.get('/batch/:batchId', getMortalitiesByBatch);

// Get mortality statistics for a batch
router.get('/stats/:batchId', getMortalityStats);

// Check for high mortality alerts
router.get('/alerts', checkMortalityAlerts);

// Create new mortality record
router.post('/', createMortality);

// Update mortality record
router.put('/:id', updateMortality);

// Delete mortality record
router.delete('/:id', deleteMortality);

module.exports = router;