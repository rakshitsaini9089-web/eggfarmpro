const express = require('express');
const router = express.Router();
const { 
  getInventoryItems,
  getInventoryItemById,
  getLowStockAlerts,
  getExpiryAlerts,
  getInventorySummary,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  useInventoryItem
} = require('../controllers/inventoryController');

// Get all inventory items
router.get('/', getInventoryItems);

// Get inventory item by ID
router.get('/:id', getInventoryItemById);

// Get low stock alerts
router.get('/alerts/low-stock', getLowStockAlerts);

// Get expiry alerts
router.get('/alerts/expiry', getExpiryAlerts);

// Get inventory summary by type
router.get('/summary', getInventorySummary);

// Create new inventory item
router.post('/', createInventoryItem);

// Update inventory item
router.put('/:id', updateInventoryItem);

// Delete inventory item
router.delete('/:id', deleteInventoryItem);

// Use inventory item (reduce available quantity)
router.post('/:id/use', useInventoryItem);

module.exports = router;