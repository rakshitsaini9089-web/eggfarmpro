const express = require('express');
const router = express.Router();
const { 
  getWasteFertilizerRecords,
  getWasteFertilizerByBatch,
  getWasteFertilizerStats,
  createWasteFertilizer,
  updateWasteFertilizer,
  deleteWasteFertilizer
} = require('../controllers/wasteFertilizerController');

// Get all waste/fertilizer records
router.get('/', getWasteFertilizerRecords);

// Get waste/fertilizer records by batch ID
router.get('/batch/:batchId', getWasteFertilizerByBatch);

// Get waste/fertilizer statistics
router.get('/stats', getWasteFertilizerStats);

// Create new waste/fertilizer record
router.post('/', createWasteFertilizer);

// Update waste/fertilizer record
router.put('/:id', updateWasteFertilizer);

// Delete waste/fertilizer record
router.delete('/:id', deleteWasteFertilizer);

module.exports = router;