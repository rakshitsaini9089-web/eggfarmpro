const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const Client = require('../models/Client');

// Get all payments
router.get('/', async (req, res) => {
  try {
    // Get farmId from query parameters
    const farmId = req.query.farmId;
    
    // Build query filter
    const filter = farmId ? { farmId } : {};
    
    const payments = await Payment.find(filter)
      .populate('saleId', 'trays totalAmount')
      .populate('clientId', 'name phone')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('saleId', 'trays totalAmount')
      .populate('clientId', 'name phone');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    // Validate sale exists
    const sale = await Sale.findById(req.body.saleId);
    if (!sale) {
      return res.status(400).json({ message: 'Sale not found' });
    }

    // Validate client exists
    const client = await Client.findById(req.body.clientId);
    if (!client) {
      return res.status(400).json({ message: 'Client not found' });
    }

    const payment = new Payment({
      saleId: req.body.saleId,
      clientId: req.body.clientId,
      clientName: client.name, // Add required clientName from client
      saleDate: sale.date, // Add required saleDate from sale
      amount: req.body.amount,
      paymentMethod: req.body.paymentMethod,
      utr: req.body.utr,
      date: req.body.date || Date.now(),
      screenshot: req.body.screenshot,
      confirmed: req.body.confirmed || false,
      farmId: req.body.farmId // Add farmId from request body
    });

    const newPayment = await payment.save();
    
    // Populate related data for response
    await newPayment.populate([
      { path: 'saleId', select: 'trays totalAmount' },
      { path: 'clientId', select: 'name phone' }
    ]);
    
    res.status(201).json(newPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update fields
    if (req.body.amount !== undefined) payment.amount = req.body.amount;
    if (req.body.paymentMethod) payment.paymentMethod = req.body.paymentMethod;
    if (req.body.utr) payment.utr = req.body.utr;
    if (req.body.date) payment.date = req.body.date;
    if (req.body.screenshot) payment.screenshot = req.body.screenshot;
    if (req.body.confirmed !== undefined) payment.confirmed = req.body.confirmed;

    const updatedPayment = await payment.save();
    
    // Populate related data for response
    await updatedPayment.populate([
      { path: 'saleId', select: 'trays totalAmount' },
      { path: 'clientId', select: 'name phone' }
    ]);
    
    res.json(updatedPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;