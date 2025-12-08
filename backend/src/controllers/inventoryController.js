const Inventory = require('../models/Inventory');
const Expense = require('../models/Expense');

/**
 * Get all inventory items
 */
async function getInventoryItems(req, res) {
  try {
    const { itemType, farmId } = req.query;
    
    const query = {};
    if (itemType) {
      query.itemType = itemType;
    }
    // Add farmId filter if provided and valid
    if (farmId && /^[0-9a-fA-F]{24}$/.test(farmId)) {
      query.farmId = farmId;
    }
    
    const inventoryItems = await Inventory.find(query)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ itemName: 1 });
    res.json(inventoryItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get inventory item by ID
 */
async function getInventoryItemById(req, res) {
  try {
    const { id } = req.params;
    const inventoryItem = await Inventory.findById(id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');
    
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json(inventoryItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get low stock alerts
 */
async function getLowStockAlerts(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {
      $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] },
      lowStockThreshold: { $exists: true, $ne: null }
    };
    
    // Add farmId filter if provided and valid
    if (farmId && /^[0-9a-fA-F]{24}$/.test(farmId)) {
      query.farmId = farmId;
    }
    
    // Find items where available quantity is below the low stock threshold
    const lowStockItems = await Inventory.find(query)
    .sort({ availableQuantity: 1 });
    
    res.json(lowStockItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get expiry alerts
 */
async function getExpiryAlerts(req, res) {
  try {
    const { farmId } = req.query;
    
    const query = {
      expiryDate: { 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        $gte: new Date()
      }
    };
    
    // Add farmId filter if provided and valid
    if (farmId && /^[0-9a-fA-F]{24}$/.test(farmId)) {
      query.farmId = farmId;
    }
    
    // Find items expiring within 30 days
    const expiringItems = await Inventory.find(query)
    .sort({ expiryDate: 1 });
    
    res.json(expiringItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get inventory summary by type
 */
async function getInventorySummary(req, res) {
  try {
    const { farmId } = req.query;
    
    const pipeline = [
      {
        $group: {
          _id: '$itemType',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalPrice' },
          lowStockItems: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $lte: ['$availableQuantity', '$lowStockThreshold'] },
                    { $exists: '$lowStockThreshold' }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
    
    // Add match stage for farmId if provided and valid
    if (farmId && /^[0-9a-fA-F]{24}$/.test(farmId)) {
      pipeline.unshift({ $match: { farmId } });
    }
    
    const summary = await Inventory.aggregate(pipeline);
    
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new inventory item
 */
async function createInventoryItem(req, res) {
  try {
    const {
      itemName,
      itemType,
      quantity,
      unit,
      costPerUnit,
      supplier,
      purchaseDate,
      expiryDate,
      batchNumber,
      location,
      notes,
      lowStockThreshold,
      farmId // Add farmId
    } = req.body;
    
    const inventoryItem = new Inventory({
      itemName,
      itemType,
      quantity: parseFloat(quantity),
      unit,
      costPerUnit: parseFloat(costPerUnit),
      supplier,
      purchaseDate: new Date(purchaseDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      batchNumber,
      location,
      notes,
      lowStockThreshold: lowStockThreshold ? parseFloat(lowStockThreshold) : undefined,
      farmId, // Add farmId
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    const newInventoryItem = await inventoryItem.save();
    
    // Auto-add to expenses
    const expense = new Expense({
      type: itemType,
      amount: newInventoryItem.totalPrice,
      description: `Inventory purchase: ${itemName} (${quantity} ${unit})`,
      date: newInventoryItem.purchaseDate,
      farmId, // Add farmId to expense
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });
    await expense.save();
    
    // Populate related data for response
    await newInventoryItem.populate([
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.status(201).json(newInventoryItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update inventory item
 */
async function updateInventoryItem(req, res) {
  try {
    const { id } = req.params;
    const {
      itemName,
      itemType,
      quantity,
      unit,
      costPerUnit,
      supplier,
      purchaseDate,
      expiryDate,
      batchNumber,
      location,
      notes,
      lowStockThreshold,
      usedQuantity
    } = req.body;
    
    const inventoryItem = await Inventory.findByIdAndUpdate(
      id,
      {
        itemName,
        itemType,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        unit,
        costPerUnit: costPerUnit !== undefined ? parseFloat(costPerUnit) : undefined,
        supplier,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        batchNumber,
        location,
        notes,
        lowStockThreshold: lowStockThreshold !== undefined ? parseFloat(lowStockThreshold) : undefined,
        usedQuantity: usedQuantity !== undefined ? parseFloat(usedQuantity) : undefined,
        updatedBy: req.user.userId
      },
      { new: true }
    );

    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Populate related data for response
    await inventoryItem.populate([
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.json(inventoryItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete inventory item
 */
async function deleteInventoryItem(req, res) {
  try {
    const { id } = req.params;
    const inventoryItem = await Inventory.findByIdAndDelete(id);
    
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Use inventory item (reduce available quantity)
 */
async function useInventoryItem(req, res) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    const inventoryItem = await Inventory.findById(id);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Check if enough quantity is available
    if (inventoryItem.availableQuantity < quantity) {
      return res.status(400).json({ 
        message: `Insufficient quantity. Available: ${inventoryItem.availableQuantity}, Requested: ${quantity}` 
      });
    }
    
    // Update used quantity
    inventoryItem.usedQuantity += parseFloat(quantity);
    inventoryItem.availableQuantity = inventoryItem.quantity - inventoryItem.usedQuantity;
    
    const updatedItem = await inventoryItem.save();
    
    // Populate related data for response
    await updatedItem.populate([
      { path: 'createdBy', select: 'username' },
      { path: 'updatedBy', select: 'username' }
    ]);
    
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  getInventoryItems,
  getInventoryItemById,
  getLowStockAlerts,
  getExpiryAlerts,
  getInventorySummary,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  useInventoryItem
};