const mongoose = require('mongoose');

const feedConsumptionSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  feedType: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'grams', 'lbs'],
    default: 'kg'
  },
  notes: {
    type: String,
    trim: true
  },
  // FCR = Feed Conversion Ratio (feed consumed / weight gain)
  fcr: {
    type: Number,
    min: 0
  },
  weightGain: {
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
feedConsumptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FeedConsumption', feedConsumptionSchema);