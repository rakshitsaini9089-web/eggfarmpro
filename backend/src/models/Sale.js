const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  trays: {
    type: Number,
    required: true,
    min: 0
  },
  eggs: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
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
saleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add virtual populate for payments
saleSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'saleId'
});

module.exports = mongoose.model('Sale', saleSchema);