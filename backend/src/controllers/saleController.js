const Sale = require('../models/Sale');
const Client = require('../models/Client');

/**
 * Get all sales
 */
async function getAllSales(req, res) {
  try {
    const sales = await Sale.find()
      .populate('clientId', 'name phone')
      .sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get sale by ID
 */
async function getSaleById(req, res) {
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
}

/**
 * Create new sale
 */
async function createSale(req, res) {
  try {
    // Validate client exists
    const client = await Client.findById(req.body.clientId);
    if (!client) {
      return res.status(400).json({ message: 'Client not found' });
    }

    // Calculate total amount based on client rate
    const totalAmount = req.body.trays * client.ratePerTray;
    
    const sale = new Sale({
      clientId: req.body.clientId,
      clientName: client.name, // Store client name for reference
      trays: req.body.trays,
      eggs: req.body.trays * 30, // 1 tray = 30 eggs
      totalAmount: totalAmount,
      date: req.body.date || new Date(),
      farmId: req.body.farmId || null, // Add farmId if provided
      createdBy: req.user ? req.user.userId : null,
      updatedBy: req.user ? req.user.userId : null
    });

    const newSale = await sale.save();
    
    // Populate client info for response
    await newSale.populate('clientId', 'name phone ratePerTray');
    
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update sale
 */
async function updateSale(req, res) {
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

    if (req.body.farmId !== undefined) {
      sale.farmId = req.body.farmId;
    }

    // Update user tracking
    sale.updatedBy = req.user ? req.user.userId : sale.updatedBy;

    const updatedSale = await sale.save();
    
    // Populate client info for response
    await updatedSale.populate('clientId', 'name phone ratePerTray');
    
    res.json(updatedSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete sale
 */
async function deleteSale(req, res) {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale
};