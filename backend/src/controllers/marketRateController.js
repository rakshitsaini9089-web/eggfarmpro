const MarketRate = require('../models/MarketRate');
const Client = require('../models/Client');

/**
 * Get all market rates
 */
async function getMarketRates(req, res) {
  try {
    const { startDate, endDate, farmId } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (farmId) {
      query.farmId = farmId;
    }
    
    const marketRates = await MarketRate.find(query)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(marketRates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get market rate by date
 */
async function getMarketRateByDate(req, res) {
  try {
    const { date } = req.params;
    const { farmId } = req.query;
    
    const query = { date: new Date(date) };
    if (farmId) {
      query.farmId = farmId;
    }
    
    const marketRate = await MarketRate.findOne(query)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');
    
    if (!marketRate) {
      return res.status(404).json({ message: 'Market rate not found for this date' });
    }
    
    res.json(marketRate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get current market rate
 */
async function getCurrentMarketRate(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {};
    if (farmId) {
      query.farmId = farmId;
    }
    
    const marketRate = await MarketRate.findOne(query)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    
    res.json(marketRate || { ratePerTray: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get market rate trend
 */
async function getMarketRateTrend(req, res) {
  try {
    const { days, farmId } = req.query;
    const daysCount = days ? parseInt(days) : 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    
    const query = { date: { $gte: startDate } };
    if (farmId) {
      query.farmId = farmId;
    }
    
    const marketRates = await MarketRate.find(query)
      .sort({ date: 1 });
    
    // Calculate trend data
    const trendData = marketRates.map(rate => ({
      date: rate.date,
      ratePerTray: rate.ratePerTray,
      rateChange: rate.rateChange,
      rateChangePercentage: rate.rateChangePercentage
    }));
    
    // Calculate average rate
    const avgRate = marketRates.length > 0 
      ? marketRates.reduce((sum, rate) => sum + rate.ratePerTray, 0) / marketRates.length
      : 0;
    
    // Get latest rate
    const latestRate = marketRates.length > 0 
      ? marketRates[marketRates.length - 1].ratePerTray 
      : 0;
    
    res.json({
      trendData,
      avgRate,
      latestRate,
      rateCount: marketRates.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new market rate
 */
async function createMarketRate(req, res) {
  try {
    const { date, ratePerTray, notes, farmId } = req.body; // Add farmId
    
    // Check if a rate already exists for this date
    const existingQuery = { date: new Date(date) };
    if (farmId) {
      existingQuery.farmId = farmId;
    }
    
    const existingRate = await MarketRate.findOne(existingQuery);
    if (existingRate) {
      return res.status(400).json({ 
        message: 'A market rate already exists for this date. Use update instead.' 
      });
    }
    
    const marketRate = new MarketRate({
      date: new Date(date),
      ratePerTray: parseFloat(ratePerTray),
      notes,
      farmId, // Add farmId
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    const newMarketRate = await marketRate.save();
    
    // Populate related data for response
    await newMarketRate.populate([
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    // Update all clients with the new rate if this is the most recent rate
    const latestRateQuery = {};
    if (farmId) {
      latestRateQuery.farmId = farmId;
    }
    
    const latestRate = await MarketRate.findOne(latestRateQuery).sort({ date: -1 });
    if (latestRate && latestRate._id.toString() === newMarketRate._id.toString()) {
      // Update clients for this farm only
      const clientQuery = {};
      if (farmId) {
        clientQuery.farmId = farmId;
      }
      await Client.updateMany(clientQuery, { ratePerTray: newMarketRate.ratePerTray });
    }
    
    res.status(201).json(newMarketRate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update market rate
 */
async function updateMarketRate(req, res) {
  try {
    const { id } = req.params;
    const { ratePerTray, notes } = req.body;
    
    const marketRate = await MarketRate.findByIdAndUpdate(
      id,
      {
        ratePerTray: parseFloat(ratePerTray),
        notes,
        updatedBy: req.user.userId
      },
      { new: true }
    );

    if (!marketRate) {
      return res.status(404).json({ message: 'Market rate not found' });
    }
    
    // Populate related data for response
    await marketRate.populate([
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    // Update all clients with the new rate if this is the most recent rate
    const latestRateQuery = {};
    if (marketRate.farmId) {
      latestRateQuery.farmId = marketRate.farmId;
    }
    
    const latestRate = await MarketRate.findOne(latestRateQuery).sort({ date: -1 });
    if (latestRate && latestRate._id.toString() === marketRate._id.toString()) {
      // Update clients for this farm only
      const clientQuery = {};
      if (marketRate.farmId) {
        clientQuery.farmId = marketRate.farmId;
      }
      await Client.updateMany(clientQuery, { ratePerTray: marketRate.ratePerTray });
    }
    
    res.json(marketRate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete market rate
 */
async function deleteMarketRate(req, res) {
  try {
    const { id } = req.params;
    const marketRate = await MarketRate.findByIdAndDelete(id);
    
    if (!marketRate) {
      return res.status(404).json({ message: 'Market rate not found' });
    }

    res.json({ message: 'Market rate deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Check for rate change alerts
 */
async function checkRateChangeAlerts(req, res) {
  try {
    const { threshold, farmId } = req.query;
    const thresholdPercentage = threshold ? parseFloat(threshold) : 5.0;
    
    const query = {
      rateChangePercentage: { $gte: thresholdPercentage },
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    };
    
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Find recent market rates with significant changes
    const recentAlerts = await MarketRate.find(query)
    .sort({ date: -1 });
    
    res.json(recentAlerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getMarketRates,
  getMarketRateByDate,
  getCurrentMarketRate,
  getMarketRateTrend,
  createMarketRate,
  updateMarketRate,
  deleteMarketRate,
  checkRateChangeAlerts
};