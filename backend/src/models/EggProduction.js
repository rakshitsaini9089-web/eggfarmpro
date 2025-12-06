// EggProduction Model
const mongoose = require('mongoose');

const eggProductionSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  eggsProduced: {
    type: Number,
    required: true
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EggProduction', eggProductionSchema);