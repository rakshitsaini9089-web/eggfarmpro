const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['sole_proprietorship', 'partnership', 'corporation', 'llc'],
    default: 'sole_proprietorship'
  },
  numberOfPartners: {
    type: Number,
    min: 2,
    default: null
  },
  partnerDetails: [{
    name: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  contact: {
    phone: {
      type: String,
      required: true, // Make phone number mandatory
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  },
  size: {
    type: Number, // in acres
    min: 0
  },
  capacity: {
    type: Number, // number of birds
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
farmSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Farm', farmSchema);