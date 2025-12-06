const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');

// Get all batches
router.get('/', async (req, res) => {
  try {
    // Get farmId from query parameters
    const farmId = req.query.farmId;
    
    // Build query filter
    const filter = farmId ? { farmId } : {};
    
    const batches = await Batch.find(filter).sort({ hatchDate: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get batch by ID
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new batch
router.post('/', async (req, res) => {
  try {
    const batch = new Batch({
      name: req.body.name,
      quantity: req.body.quantity,
      hatchDate: req.body.hatchDate,
      breed: req.body.breed,
      farmId: req.body.farmId // Add farmId from request body
    });

    const newBatch = await batch.save();
    res.status(201).json(newBatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update batch
router.put('/:id', async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        quantity: req.body.quantity,
        hatchDate: req.body.hatchDate,
        breed: req.body.breed
      },
      { new: true }
    );

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete batch
router.delete('/:id', async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ message: 'Batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;