const mongoose = require('mongoose');

const marketRateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  ratePerTray: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  // Store previous rates for trend analysis
  previousRate: {
    type: Number
  },
  rateChange: {
    type: Number
  },
  rateChangePercentage: {
    type: Number
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
marketRateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MarketRate', marketRateSchema);