const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Get all expenses
router.get('/', async (req, res) => {
  try {
    // Get farmId from query parameters
    const farmId = req.query.farmId;
    
    // Build query filter
    const filter = farmId ? { farmId } : {};
    
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const expense = new Expense({
      type: req.body.type,
      amount: req.body.amount,
      description: req.body.description,
      date: req.body.date || Date.now(),
      category: req.body.category,
      items: req.body.items || [],
      farmId: req.body.farmId // Add farmId from request body
    });

    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        type: req.body.type,
        amount: req.body.amount,
        description: req.body.description,
        date: req.body.date,
        category: req.body.category,
        items: req.body.items || []
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;