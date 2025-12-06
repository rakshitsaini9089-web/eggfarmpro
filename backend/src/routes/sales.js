const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Client = require('../models/Client');
const mongoose = require('mongoose');

// Get all sales
router.get('/', async (req, res) => {
  try {
    // Get farmId and clientId from query parameters
    const farmId = req.query.farmId;
    const clientId = req.query.clientId;
    
    // Build query filter
    const filter = {};
    if (farmId) {
      // Ensure farmId is a valid ObjectId before filtering
      if (mongoose.Types.ObjectId.isValid(farmId)) {
        filter.farmId = farmId;
      } else {
        // If farmId is not a valid ObjectId, return empty array
        return res.json([]);
      }
    }
    if (clientId) {
      // Ensure clientId is a valid ObjectId before filtering
      if (mongoose.Types.ObjectId.isValid(clientId)) {
        filter.clientId = clientId;
      } else {
        // If clientId is not a valid ObjectId, return empty array
        return res.json([]);
      }
    }
    
    const sales = await Sale.find(filter)
      .populate('clientId', 'name phone')
      .sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get sale by ID
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('clientId', 'name phone ratePerTray');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new sale
router.post('/', async (req, res) => {
  try {
    // Validate client exists
    const client = await Client.findById(req.body.clientId);
    if (!client) {
      return res.status(400).json({ message: 'Client not found' });
    }

    // Calculate total amount
    const totalAmount = req.body.trays * client.ratePerTray;
    
    const sale = new Sale({
      clientId: req.body.clientId,
      clientName: client.name, // Store client name for reference
      trays: req.body.trays,
      eggs: req.body.trays * 30, // 1 tray = 30 eggs
      totalAmount: totalAmount,
      date: req.body.date || Date.now(),
      farmId: req.body.farmId // Add farmId from request body
    });

    const newSale = await sale.save();
    
    // Populate client info for response
    await newSale.populate('clientId', 'name phone ratePerTray');
    
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update sale
router.put('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Validate client exists if being updated
    if (req.body.clientId) {
      const client = await Client.findById(req.body.clientId);
      if (!client) {
        return res.status(400).json({ message: 'Client not found' });
      }
      sale.clientId = req.body.clientId;
      sale.clientName = client.name; // Update client name
    }

    // Update fields
    if (req.body.trays !== undefined) {
      sale.trays = req.body.trays;
      sale.eggs = req.body.trays * 30; // Recalculate eggs
      
      // Recalculate total amount if client exists
      if (sale.clientId) {
        const client = await Client.findById(sale.clientId);
        if (client) {
          sale.totalAmount = req.body.trays * client.ratePerTray;
        }
      }
    }

    if (req.body.date !== undefined) {
      sale.date = req.body.date;
    }

    const updatedSale = await sale.save();
    
    // Populate client info for response
    await updatedSale.populate('clientId', 'name phone ratePerTray');
    
    res.json(updatedSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete sale
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;