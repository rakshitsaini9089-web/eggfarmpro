const express = require('express');
const router = express.Router();
const { 
  getMedicines,
  getMedicinesByBatch,
  getMedicinesByDateRange,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  checkExpiryAlerts,
  checkWithdrawalReminders
} = require('../controllers/medicineController');

// Get all medicine records
router.get('/', getMedicines);

// Get medicine records by batch ID
router.get('/batch/:batchId', getMedicinesByBatch);

// Get medicine records by date range
router.get('/date-range', getMedicinesByDateRange);

// Check for medicine expiry alerts
router.get('/alerts/expiry', checkExpiryAlerts);

// Check for withdrawal period reminders
router.get('/alerts/withdrawal', checkWithdrawalReminders);

// Create new medicine record
router.post('/', createMedicine);

// Update medicine record
router.put('/:id', updateMedicine);

// Delete medicine record
router.delete('/:id', deleteMedicine);

module.exports = router;