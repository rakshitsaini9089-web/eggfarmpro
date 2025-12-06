const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Expense = require('../models/Expense');

/**
 * Get all medicine records
 */
async function getMedicines(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {};
    if (farmId) {
      query.farmId = farmId;
    }
    
    const medicines = await Medicine.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ administeredDate: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get medicine records by batch ID
 */
async function getMedicinesByBatch(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = { batchId: req.params.batchId };
    if (farmId) {
      query.farmId = farmId;
    }
    
    const medicines = await Medicine.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ administeredDate: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get medicine records by date range
 */
async function getMedicinesByDateRange(req, res) {
  try {
    const { startDate, endDate, farmId } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.administeredDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (farmId) {
      query.farmId = farmId;
    }
    
    const medicines = await Medicine.find(query)
      .populate('batchId', 'name quantity')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ administeredDate: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new medicine record
 */
async function createMedicine(req, res) {
  try {
    const medicine = new Medicine({
      name: req.body.name,
      batchId: req.body.batchId,
      dose: req.body.dose,
      purpose: req.body.purpose,
      withdrawalPeriod: req.body.withdrawalPeriod,
      withdrawalPeriodUnit: req.body.withdrawalPeriodUnit,
      administeredDate: req.body.administeredDate,
      expiryDate: req.body.expiryDate,
      notes: req.body.notes,
      cost: req.body.cost,
      farmId: req.body.farmId, // Add farmId
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    const newMedicine = await medicine.save();
    
    // If cost is provided, auto-add to expenses
    if (req.body.cost && req.body.cost > 0) {
      const expense = new Expense({
        type: 'medicine',
        amount: req.body.cost,
        description: `Medicine: ${req.body.name} for batch ${req.body.batchId}`,
        date: req.body.administeredDate,
        farmId: req.body.farmId, // Add farmId to expense
        createdBy: req.user.userId,
        updatedBy: req.user.userId
      });
      await expense.save();
    }
    
    // Populate related data for response
    await newMedicine.populate([
      { path: 'batchId', select: 'name quantity' },
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.status(201).json(newMedicine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update medicine record
 */
async function updateMedicine(req, res) {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        batchId: req.body.batchId,
        dose: req.body.dose,
        purpose: req.body.purpose,
        withdrawalPeriod: req.body.withdrawalPeriod,
        withdrawalPeriodUnit: req.body.withdrawalPeriodUnit,
        administeredDate: req.body.administeredDate,
        expiryDate: req.body.expiryDate,
        notes: req.body.notes,
        cost: req.body.cost,
        updatedBy: req.user.userId
      },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine record not found' });
    }
    
    // Populate related data for response
    await medicine.populate([
      { path: 'batchId', select: 'name quantity' },
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.json(medicine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete medicine record
 */
async function deleteMedicine(req, res) {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine record not found' });
    }

    res.json({ message: 'Medicine record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Check for medicine expiry alerts
 */
async function checkExpiryAlerts(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {
      expiryDate: { 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        $gte: new Date()
      }
    };
    
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Find medicines expiring within 30 days
    const expiringMedicines = await Medicine.find(query)
    .populate('batchId', 'name')
    .sort({ expiryDate: 1 });
    
    res.json(expiringMedicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Check for withdrawal period reminders
 */
async function checkWithdrawalReminders(req, res) {
  try {
    const { farmId } = req.query;
    
    // Find medicines with withdrawal periods ending within 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const query = {
      administeredDate: { $lte: new Date() }
    };
    
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Calculate the date when withdrawal periods would end
    const medicines = await Medicine.find(query).populate('batchId', 'name');
    
    const reminders = medicines.filter(medicine => {
      // Calculate withdrawal period end date
      const withdrawalEndDate = new Date(medicine.administeredDate);
      
      if (medicine.withdrawalPeriodUnit === 'hours') {
        withdrawalEndDate.setHours(withdrawalEndDate.getHours() + medicine.withdrawalPeriod);
      } else if (medicine.withdrawalPeriodUnit === 'days') {
        withdrawalEndDate.setDate(withdrawalEndDate.getDate() + medicine.withdrawalPeriod);
      } else if (medicine.withdrawalPeriodUnit === 'weeks') {
        withdrawalEndDate.setDate(withdrawalEndDate.getDate() + (medicine.withdrawalPeriod * 7));
      }
      
      // Check if withdrawal period ends within 2 days
      return withdrawalEndDate <= twoDaysFromNow && withdrawalEndDate >= new Date();
    });
    
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getMedicines,
  getMedicinesByBatch,
  getMedicinesByDateRange,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  checkExpiryAlerts,
  checkWithdrawalReminders
};