const express = require('express');
const router = express.Router();
const { 
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm,
  getActiveFarms
} = require('../controllers/farmController');

// Get all farms
router.get('/', getFarms);

// Get active farms
router.get('/active', getActiveFarms);

// Get farm by ID
router.get('/:id', getFarmById);

// Create new farm
router.post('/', createFarm);

// Update farm
router.put('/:id', updateFarm);

// Delete farm
router.delete('/:id', deleteFarm);

module.exports = router;