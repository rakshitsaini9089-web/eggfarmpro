const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['feed', 'medicine', 'vaccine', 'tray', 'packaging', 'other'],
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  // Low stock alert threshold
  lowStockThreshold: {
    type: Number,
    min: 0
  },
  usedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  availableQuantity: {
    type: Number,
    min: 0
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Calculate totalPrice before saving
inventorySchema.pre('save', function(next) {
  if (this.quantity !== undefined && this.costPerUnit !== undefined) {
    this.totalPrice = this.quantity * this.costPerUnit;
  }
  this.updatedAt = Date.now();
  next();
});

// Calculate totalPrice before updating
inventorySchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.quantity !== undefined && update.$set.costPerUnit !== undefined) {
    update.$set.totalPrice = update.$set.quantity * update.$set.costPerUnit;
  } else if (update.quantity !== undefined && update.costPerUnit !== undefined) {
    update.totalPrice = update.quantity * update.costPerUnit;
  }
  update.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);