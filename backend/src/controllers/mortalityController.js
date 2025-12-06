const Mortality = require('../models/Mortality');
const Batch = require('../models/Batch');

/**
 * Get all mortality records
 */
async function getMortalities(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {};
    if (farmId) {
      query.farmId = farmId;
    }
    
    const mortalities = await Mortality.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(mortalities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get mortality records by batch ID
 */
async function getMortalitiesByBatch(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = { batchId: req.params.batchId };
    if (farmId) {
      query.farmId = farmId;
    }
    
    const mortalities = await Mortality.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(mortalities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get mortality statistics for a batch
 */
async function getMortalityStats(req, res) {
  try {
    const { batchId } = req.params;
    const { farmId } = req.query;
    
    const query = { batchId };
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Get all mortality records for the batch
    const mortalities = await Mortality.find(query)
      .sort({ date: 1 });
    
    // Calculate trends
    const trendData = mortalities.map(record => ({
      date: record.date,
      count: record.count,
      percentage: record.mortalityPercentage
    }));
    
    // Calculate average mortality percentage
    const avgMortality = mortalities.length > 0 
      ? mortalities.reduce((sum, record) => sum + record.mortalityPercentage, 0) / mortalities.length
      : 0;
    
    res.json({
      trendData,
      avgMortality,
      totalDeaths: mortalities.reduce((sum, record) => sum + record.count, 0)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new mortality record
 */
async function createMortality(req, res) {
  try {
    // Get batch to calculate mortality percentage
    const batch = await Batch.findById(req.body.batchId);
    if (!batch) {
      return res.status(400).json({ message: 'Batch not found' });
    }
    
    // Calculate mortality percentage
    const mortalityPercentage = (req.body.count / batch.quantity) * 100;
    
    const mortality = new Mortality({
      batchId: req.body.batchId,
      count: req.body.count,
      reason: req.body.reason,
      age: req.body.age,
      notes: req.body.notes,
      mortalityPercentage: mortalityPercentage,
      date: req.body.date,
      farmId: req.body.farmId, // Add farmId
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    const newMortality = await mortality.save();
    
    // Populate related data for response
    await newMortality.populate([
      { path: 'batchId', select: 'name quantity' },
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.status(201).json(newMortality);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update mortality record
 */
async function updateMortality(req, res) {
  try {
    // Get the existing mortality record to access batchId if not provided
    const existingMortality = await Mortality.findById(req.params.id);
    if (!existingMortality) {
      return res.status(404).json({ message: 'Mortality record not found' });
    }
    
    // Use provided batchId or existing one
    const batchId = req.body.batchId || existingMortality.batchId;
    
    // Get batch to calculate mortality percentage
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(400).json({ message: 'Batch not found' });
    }
    
    // Calculate mortality percentage
    const count = req.body.count !== undefined ? req.body.count : existingMortality.count;
    const mortalityPercentage = (count / batch.quantity) * 100;
    
    const mortality = await Mortality.findByIdAndUpdate(
      req.params.id,
      {
        batchId: batchId,
        count: count,
        reason: req.body.reason,
        age: req.body.age,
        notes: req.body.notes,
        mortalityPercentage: mortalityPercentage,
        date: req.body.date,
        updatedBy: req.user.userId
      },
      { new: true }
    );

    if (!mortality) {
      return res.status(404).json({ message: 'Mortality record not found' });
    }
    
    // Populate related data for response
    await mortality.populate([
      { path: 'batchId', select: 'name quantity' },
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.json(mortality);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete mortality record
 */
async function deleteMortality(req, res) {
  try {
    const mortality = await Mortality.findByIdAndDelete(req.params.id);
    
    if (!mortality) {
      return res.status(404).json({ message: 'Mortality record not found' });
    }

    res.json({ message: 'Mortality record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Check for high mortality alerts
 */
async function checkMortalityAlerts(req, res) {
  try {
    const { threshold, farmId } = req.query;
    const parsedThreshold = threshold ? parseFloat(threshold) : 5.0;
    
    const query = {
      mortalityPercentage: { $gte: parsedThreshold },
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    };
    
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Find recent mortality records that exceed threshold
    const recentAlerts = await Mortality.find(query)
    .populate('batchId', 'name')
    .sort({ date: -1 });
    
    res.json(recentAlerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getMortalities,
  getMortalitiesByBatch,
  getMortalityStats,
  createMortality,
  updateMortality,
  deleteMortality,
  checkMortalityAlerts
};