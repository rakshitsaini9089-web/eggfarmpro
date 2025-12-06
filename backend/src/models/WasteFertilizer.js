const mongoose = require('mongoose');

const wasteFertilizerSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['waste', 'fertilizer'],
    trim: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
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
  date: {
    type: Date,
    required: true
  },
  // For fertilizer production
  productionDate: {
    type: Date
  },
  // For fertilizer sales
  saleDate: {
    type: Date
  },
  saleAmount: {
    type: Number,
    min: 0
  },
  buyer: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  // Auto-add revenue to farm profit
  addToProfit: {
    type: Boolean,
    default: true
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

// Update the updatedAt field before saving
wasteFertilizerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WasteFertilizer', wasteFertilizerSchema);