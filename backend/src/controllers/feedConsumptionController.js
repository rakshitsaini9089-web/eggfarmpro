const FeedConsumption = require('../models/FeedConsumption');
const Batch = require('../models/Batch');

/**
 * Get all feed consumption records
 */
async function getFeedConsumptions(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {};
    if (farmId) {
      query.farmId = farmId;
    }
    
    const feedConsumptions = await FeedConsumption.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(feedConsumptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get feed consumption records by batch ID
 */
async function getFeedConsumptionsByBatch(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = { batchId: req.params.batchId };
    if (farmId) {
      query.farmId = farmId;
    }
    
    const feedConsumptions = await FeedConsumption.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(feedConsumptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get feed consumption statistics
 */
async function getFeedConsumptionStats(req, res) {
  try {
    const { batchId } = req.params;
    const { farmId } = req.query;
    
    const query = { batchId };
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Get all feed consumption records for the batch
    const feedConsumptions = await FeedConsumption.find(query)
      .sort({ date: 1 });
    
    // Calculate trends
    const trendData = feedConsumptions.map(record => ({
      date: record.date,
      quantity: record.quantity,
      fcr: record.fcr
    }));
    
    // Calculate average FCR
    const validFCRRecords = feedConsumptions.filter(record => record.fcr !== undefined && record.fcr > 0);
    const avgFCR = validFCRRecords.length > 0 
      ? validFCRRecords.reduce((sum, record) => sum + record.fcr, 0) / validFCRRecords.length
      : 0;
    
    // Calculate total feed consumed
    const totalFeedConsumed = feedConsumptions.reduce((sum, record) => sum + record.quantity, 0);
    
    res.json({
      trendData,
      avgFCR,
      totalFeedConsumed,
      recordCount: feedConsumptions.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new feed consumption record
 */
async function createFeedConsumption(req, res) {
  try {
    const feedConsumption = new FeedConsumption({
      batchId: req.body.batchId,
      date: req.body.date,
      feedType: req.body.feedType,
      quantity: req.body.quantity,
      unit: req.body.unit,
      notes: req.body.notes,
      weightGain: req.body.weightGain,
      farmId: req.body.farmId, // Add farmId
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    const newFeedConsumption = await feedConsumption.save();
    
    // Populate related data for response
    await newFeedConsumption.populate([
      { path: 'batchId', select: 'name quantity' },
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.status(201).json(newFeedConsumption);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update feed consumption record
 */
async function updateFeedConsumption(req, res) {
  try {
    const feedConsumption = await FeedConsumption.findByIdAndUpdate(
      req.params.id,
      {
        batchId: req.body.batchId,
        date: req.body.date,
        feedType: req.body.feedType,
        quantity: req.body.quantity,
        unit: req.body.unit,
        notes: req.body.notes,
        weightGain: req.body.weightGain,
        updatedBy: req.user.userId
      },
      { new: true }
    );

    if (!feedConsumption) {
      return res.status(404).json({ message: 'Feed consumption record not found' });
    }
    
    // Populate related data for response
    await feedConsumption.populate([
      { path: 'batchId', select: 'name quantity' },
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.json(feedConsumption);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete feed consumption record
 */
async function deleteFeedConsumption(req, res) {
  try {
    const feedConsumption = await FeedConsumption.findByIdAndDelete(req.params.id);
    
    if (!feedConsumption) {
      return res.status(404).json({ message: 'Feed consumption record not found' });
    }

    res.json({ message: 'Feed consumption record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Check for high consumption alerts
 */
async function checkHighConsumptionAlerts(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    };
    
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Find recent feed consumption records with high consumption
    // This is a placeholder - actual implementation would depend on specific thresholds
    const recentConsumptions = await FeedConsumption.find(query)
    .populate('batchId', 'name')
    .sort({ date: -1 })
    .limit(10);
    
    res.json(recentConsumptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getFeedConsumptions,
  getFeedConsumptionsByBatch,
  getFeedConsumptionStats,
  createFeedConsumption,
  updateFeedConsumption,
  deleteFeedConsumption,
  checkHighConsumptionAlerts
};