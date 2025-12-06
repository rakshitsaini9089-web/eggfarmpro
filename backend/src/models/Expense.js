const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['feed', 'labor', 'electricity', 'medicine', 'transport', 'vaccine', 'other', 'feed_expense', 'construction_material', 'construction_labor'],
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // New fields for detailed expense tracking
  category: {
    type: String,
    trim: true
  },
  items: [{
    name: String,
    quantity: Number,
    rate: Number,
    total: Number
  }],
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
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);