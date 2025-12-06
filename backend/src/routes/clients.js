const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Get all clients
router.get('/', async (req, res) => {
  try {
    // Get farmId from query parameters
    const farmId = req.query.farmId;
    
    // Build query filter
    const filter = farmId ? { farmId } : {};
    
    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new client
router.post('/', async (req, res) => {
  try {
    const client = new Client({
      name: req.body.name,
      phone: req.body.phone,
      ratePerTray: req.body.ratePerTray,
      farmId: req.body.farmId // Add farmId from request body
    });

    const newClient = await client.save();
    res.status(201).json(newClient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: req.body.phone,
        ratePerTray: req.body.ratePerTray
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;