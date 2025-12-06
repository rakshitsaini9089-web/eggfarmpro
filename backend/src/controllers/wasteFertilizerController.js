const WasteFertilizer = require('../models/WasteFertilizer');
const Batch = require('../models/Batch');

/**
 * Get all waste/fertilizer records
 */
async function getWasteFertilizerRecords(req, res) {
  try {
    const { type, startDate, endDate, farmId } = req.query;
    
    const query = {};
    if (type) {
      query.type = type;
    }
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (farmId) {
      query.farmId = farmId;
    }
    
    const records = await WasteFertilizer.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get waste/fertilizer records by batch ID
 */
async function getWasteFertilizerByBatch(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = { batchId: req.params.batchId };
    if (farmId) {
      query.farmId = farmId;
    }
    
    const records = await WasteFertilizer.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get waste/fertilizer statistics
 */
async function getWasteFertilizerStats(req, res) {
  try {
    const { startDate, endDate, farmId } = req.query;
    
    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (farmId) {
      matchQuery.farmId = farmId;
    }
    
    // Get waste stats
    const wasteStats = await WasteFertilizer.aggregate([
      { $match: { ...matchQuery, type: 'waste' } },
      {
        $group: {
          _id: null,
          totalWaste: { $sum: '$quantity' },
          recordCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get fertilizer stats
    const fertilizerStats = await WasteFertilizer.aggregate([
      { $match: { ...matchQuery, type: 'fertilizer' } },
      {
        $group: {
          _id: null,
          totalProduced: { $sum: '$quantity' },
          totalRevenue: { $sum: '$saleAmount' },
          recordCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get trend data
    const trendData = await WasteFertilizer.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: "$type"
          },
          quantity: { $sum: "$quantity" },
          revenue: { $sum: "$saleAmount" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);
    
    res.json({
      waste: wasteStats[0] || { totalWaste: 0, recordCount: 0 },
      fertilizer: fertilizerStats[0] || { totalProduced: 0, totalRevenue: 0, recordCount: 0 },
      trendData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new waste/fertilizer record
 */
async function createWasteFertilizer(req, res) {
  try {
    const record = new WasteFertilizer(req.body);
    record.createdBy = req.user.userId;
    record.updatedBy = req.user.userId;
    
    const newRecord = await record.save();
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update waste/fertilizer record
 */
async function updateWasteFertilizer(req, res) {
  try {
    const record = await WasteFertilizer.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    Object.keys(req.body).forEach(key => {
      record[key] = req.body[key];
    });
    
    record.updatedBy = req.user.userId;
    const updatedRecord = await record.save();
    res.json(updatedRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete waste/fertilizer record
 */
async function deleteWasteFertilizer(req, res) {
  try {
    const record = await WasteFertilizer.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    await record.remove();
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getWasteFertilizerRecords,
  getWasteFertilizerByBatch,
  getWasteFertilizerStats,
  createWasteFertilizer,
  updateWasteFertilizer,
  deleteWasteFertilizer
};