const express = require('express');
const router = express.Router();
const Vaccine = require('../models/Vaccine');
const Batch = require('../models/Batch');

// Get all vaccines
router.get('/', async (req, res) => {
  try {
    // Get farmId from query parameters
    const farmId = req.query.farmId;
    
    // Build query filter
    const filter = farmId ? { farmId } : {};
    
    const vaccines = await Vaccine.find(filter)
      .populate('batchId', 'name breed')
      .sort({ scheduledDate: -1 });
    res.json(vaccines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get vaccines by batch ID
router.get('/batch/:batchId', async (req, res) => {
  try {
    const vaccines = await Vaccine.find({ batchId: req.params.batchId })
      .populate('batchId', 'name breed');
    res.json(vaccines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get vaccine by ID
router.get('/:id', async (req, res) => {
  try {
    const vaccine = await Vaccine.findById(req.params.id)
      .populate('batchId', 'name breed');
    
    if (!vaccine) {
      return res.status(404).json({ message: 'Vaccine not found' });
    }
    
    res.json(vaccine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new vaccine
router.post('/', async (req, res) => {
  try {
    // Validate batch exists
    const batch = await Batch.findById(req.body.batchId);
    if (!batch) {
      return res.status(400).json({ message: 'Batch not found' });
    }

    const vaccine = new Vaccine({
      batchId: req.body.batchId,
      batchName: req.body.batchName || batch.name, // Use provided batchName or get from batch
      name: req.body.name,
      scheduledDate: req.body.scheduledDate,
      administeredDate: req.body.administeredDate,
      status: req.body.status || 'pending',
      notes: req.body.notes,
      farmId: req.body.farmId // Add farmId from request body
    });

    const newVaccine = await vaccine.save();
    
    // Populate batch info for response
    await newVaccine.populate('batchId', 'name breed');
    
    res.status(201).json(newVaccine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update vaccine
router.put('/:id', async (req, res) => {
  try {
    const vaccine = await Vaccine.findById(req.params.id);
    if (!vaccine) {
      return res.status(404).json({ message: 'Vaccine not found' });
    }

    // Update fields
    if (req.body.name) vaccine.name = req.body.name;
    if (req.body.batchName) vaccine.batchName = req.body.batchName;
    if (req.body.scheduledDate) vaccine.scheduledDate = req.body.scheduledDate;
    if (req.body.administeredDate) vaccine.administeredDate = req.body.administeredDate;
    if (req.body.status) vaccine.status = req.body.status;
    if (req.body.notes) vaccine.notes = req.body.notes;

    const updatedVaccine = await vaccine.save();
    
    // Populate batch info for response
    await updatedVaccine.populate('batchId', 'name breed');
    
    res.json(updatedVaccine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete vaccine
router.delete('/:id', async (req, res) => {
  try {
    const vaccine = await Vaccine.findByIdAndDelete(req.params.id);
    
    if (!vaccine) {
      return res.status(404).json({ message: 'Vaccine not found' });
    }

    res.json({ message: 'Vaccine deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;