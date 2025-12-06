const Client = require('../models/Client');

/**
 * Get all clients
 */
async function getClients(req, res) {
  try {
    const { farmId } = req.query;
    const query = farmId ? { farmId } : {};
    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get client by ID
 */
async function getClientById(req, res) {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new client
 */
async function createClient(req, res) {
  try {
    const client = new Client({
      name: req.body.name,
      phone: req.body.phone,
      ratePerTray: req.body.ratePerTray,
      farmId: req.body.farmId, // Add farmId from request body
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    const newClient = await client.save();
    res.status(201).json(newClient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update client
 */
async function updateClient(req, res) {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: req.body.phone,
        ratePerTray: req.body.ratePerTray,
        farmId: req.body.farmId, // Add farmId from request body
        updatedBy: req.user.userId
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
}

/**
 * Delete client
 */
async function deleteClient(req, res) {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};