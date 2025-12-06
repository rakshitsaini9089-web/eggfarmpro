const mongoose = require('mongoose');

const weightTrackingSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  averageWeight: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['grams', 'kg', 'lbs'],
    default: 'grams'
  },
  sampleSize: {
    type: Number,
    required: true,
    min: 1
  },
  notes: {
    type: String,
    trim: true
  },
  // Growth rate calculation
  growthRate: {
    type: Number
  },
  // Deviation from expected curve
  deviation: {
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
weightTrackingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WeightTracking', weightTrackingSchema);