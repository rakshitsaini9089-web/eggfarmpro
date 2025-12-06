const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'matched', 'confirmed'],
    default: 'uploaded'
  },
  extractedData: {
    amount: Number,
    utr: String,
    date: String,
    payerName: String
  },
  matchedPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
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
screenshotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ScreenshotUpload', screenshotSchema);