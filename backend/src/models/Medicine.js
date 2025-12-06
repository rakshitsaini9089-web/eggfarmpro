const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  dose: {
    type: String,
    required: true,
    trim: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  withdrawalPeriod: {
    type: Number,
    required: true,
    min: 0
  },
  withdrawalPeriodUnit: {
    type: String,
    enum: ['hours', 'days', 'weeks'],
    default: 'days'
  },
  administeredDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  cost: {
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

// Update the updatedAt field before saving
medicineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);