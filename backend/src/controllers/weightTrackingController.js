const WeightTracking = require('../models/WeightTracking');
const Batch = require('../models/Batch');

/**
 * Get all weight tracking records
 */
async function getWeightTrackings(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {};
    if (farmId) {
      query.farmId = farmId;
    }
    
    const weightTrackings = await WeightTracking.find(query)
      .populate('batchId', 'name quantity breed hatchDate')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(weightTrackings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get weight tracking records by batch ID
 */
async function getWeightTrackingsByBatch(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = { batchId: req.params.batchId };
    if (farmId) {
      query.farmId = farmId;
    }
    
    const weightTrackings = await WeightTracking.find(query)
      .populate('batchId', 'name quantity breed hatchDate')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(weightTrackings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get weight tracking statistics and growth curve
 */
async function getWeightTrackingStats(req, res) {
  try {
    const { batchId } = req.params;
    const { farmId } = req.query;
    
    const query = { batchId };
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Get all weight tracking records for the batch
    const weightTrackings = await WeightTracking.find(query)
      .sort({ date: 1 });
    
    // Calculate growth curve data
    const growthCurveData = weightTrackings.map(record => ({
      date: record.date,
      averageWeight: record.averageWeight,
      sampleSize: record.sampleSize,
      growthRate: record.growthRate,
      deviation: record.deviation
    }));
    
    // Calculate average weight
    const avgWeight = weightTrackings.length > 0 
      ? weightTrackings.reduce((sum, record) => sum + record.averageWeight, 0) / weightTrackings.length
      : 0;
    
    // Calculate growth rate trends
    const growthRates = weightTrackings
      .filter(record => record.growthRate !== undefined)
      .map(record => record.growthRate);
    
    const avgGrowthRate = growthRates.length > 0 
      ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
      : 0;
    
    res.json({
      growthCurveData,
      avgWeight,
      avgGrowthRate,
      recordCount: weightTrackings.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new weight tracking record
 */
async function createWeightTracking(req, res) {
  try {
    // Calculate age in days from hatch date
    const batch = await Batch.findById(req.body.batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    const hatchDate = new Date(batch.hatchDate);
    const recordDate = new Date(req.body.date);
    const ageInDays = Math.floor((recordDate - hatchDate) / (1000 * 60 * 60 * 24));
    
    // Calculate expected weight based on breed (simplified model)
    let expectedWeight = 0;
    if (batch.breed.toLowerCase().includes('broiler')) {
      // Broiler growth curve approximation
      expectedWeight = 25 + (ageInDays * 2.5);
    } else if (batch.breed.toLowerCase().includes('layer')) {
      // Layer growth curve approximation
      expectedWeight = 20 + (ageInDays * 1.8);
    } else {
      // Generic growth curve
      expectedWeight = 20 + (ageInDays * 2.0);
    }
    
    // Calculate deviation from expected weight
    const deviation = req.body.averageWeight - expectedWeight;
    
    const weightTracking = new WeightTracking({
      batchId: req.body.batchId,
      date: req.body.date,
      averageWeight: req.body.averageWeight,
      unit: req.body.unit,
      sampleSize: req.body.sampleSize,
      notes: req.body.notes,
      deviation: deviation,
      farmId: req.body.farmId, // Add farmId
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    const newWeightTracking = await weightTracking.save();
    
    // Populate related data for response
    await newWeightTracking.populate([
      { path: 'batchId', select: 'name quantity breed hatchDate' },
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.status(201).json(newWeightTracking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update weight tracking record
 */
async function updateWeightTracking(req, res) {
  try {
    const weightTracking = await WeightTracking.findByIdAndUpdate(
      req.params.id,
      {
        batchId: req.body.batchId,
        date: req.body.date,
        averageWeight: req.body.averageWeight,
        unit: req.body.unit,
        sampleSize: req.body.sampleSize,
        notes: req.body.notes,
        updatedBy: req.user.userId
      },
      { new: true }
    );

    if (!weightTracking) {
      return res.status(404).json({ message: 'Weight tracking record not found' });
    }
    
    // Populate related data for response
    await weightTracking.populate([
      { path: 'batchId', select: 'name quantity breed hatchDate' },
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.json(weightTracking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete weight tracking record
 */
async function deleteWeightTracking(req, res) {
  try {
    const weightTracking = await WeightTracking.findByIdAndDelete(req.params.id);
    
    if (!weightTracking) {
      return res.status(404).json({ message: 'Weight tracking record not found' });
    }

    res.json({ message: 'Weight tracking record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Check for growth deviation alerts
 */
async function checkGrowthDeviationAlerts(req, res) {
  try {
    const { threshold, farmId } = req.query;
    const parsedThreshold = threshold ? parseFloat(threshold) : 10.0;
    
    const query = {
      deviation: { $lte: -parsedThreshold },
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    };
    
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Find recent weight tracking records with significant deviations
    const recentAlerts = await WeightTracking.find(query)
    .populate('batchId', 'name')
    .sort({ date: -1 });
    
    res.json(recentAlerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getWeightTrackings,
  getWeightTrackingsByBatch,
  getWeightTrackingStats,
  createWeightTracking,
  updateWeightTracking,
  deleteWeightTracking,
  checkGrowthDeviationAlerts
};