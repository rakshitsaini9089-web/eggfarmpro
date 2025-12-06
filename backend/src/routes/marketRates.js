const express = require('express');
const router = express.Router();
const { 
  getMarketRates,
  getMarketRateByDate,
  getCurrentMarketRate,
  getMarketRateTrend,
  createMarketRate,
  updateMarketRate,
  deleteMarketRate,
  checkRateChangeAlerts
} = require('../controllers/marketRateController');

// Get all market rates
router.get('/', getMarketRates);

// Get market rate by date
router.get('/date/:date', getMarketRateByDate);

// Get current market rate
router.get('/current', getCurrentMarketRate);

// Get market rate trend
router.get('/trend', getMarketRateTrend);

// Check for rate change alerts
router.get('/alerts', checkRateChangeAlerts);

// Create new market rate
router.post('/', createMarketRate);

// Update market rate
router.put('/:id', updateMarketRate);

// Delete market rate
router.delete('/:id', deleteMarketRate);

module.exports = router;