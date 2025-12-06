// Expense Controller with AI Features
const Expense = require('../models/Expense');
const { AIEngine } = require('../utils/aiEngine');

// Define expense categories and their dropdown options
const EXPENSE_CATEGORIES = {
  'FEED EXPENSE': [
    'Feed bag', 'LC', 'Maki', 'Bajara', 'Stone', 
    'Stone dust', 'DORB', 'DOC', 'Protein (soya)', 'Medicine'
  ],
  'CONSTRUCTION MATERIAL': [
    'Cement', 'Sand', 'Bricks', 'Steel', 'Wood', 
    'Paint', 'Tiles', 'Pipes', 'Electrical', 'Other'
  ],
  'CONSTRUCTION LABOUR': [],
  // Add other categories as needed
};

/**
 * Parse voice/text command for expense entry
 */
async function parseExpenseCommand(command) {
  const aiEngine = new AIEngine();
  
  const prompt = `
  Parse the following voice/text command for expense entry in an egg farm management system:
  Command: "${command}"
  
  Extract:
  1. Quantity
  2. Item name
  3. Price per unit
  4. Farm name
  5. Category (must be one of: ${Object.keys(EXPENSE_CATEGORIES).join(', ')})
  
  Respond in JSON format:
  {
    "quantity": number,
    "itemName": "string",
    "pricePerUnit": number,
    "farmName": "string",
    "category": "string"
  }
  `;
  
  try {
    const result = await aiEngine.generateJSON(prompt);
    return result;
  } catch (error) {
    console.error('Error parsing expense command:', error);
    throw new Error('Failed to parse expense command');
  }
}

/**
 * POST /ai/expenses
 * Create expense entry from voice/text command
 */
async function createExpenseFromCommand(req, res) {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    // Parse the command using AI
    const parsedData = await parseExpenseCommand(command);
    
    // Validate parsed data
    if (!parsedData.quantity || !parsedData.itemName || 
        !parsedData.pricePerUnit || !parsedData.farmName || 
        !parsedData.category) {
      return res.status(400).json({ 
        error: 'Could not parse complete expense information from command' 
      });
    }
    
    // Validate category
    if (!EXPENSE_CATEGORIES[parsedData.category]) {
      return res.status(400).json({ 
        error: `Invalid category. Must be one of: ${Object.keys(EXPENSE_CATEGORIES).join(', ')}` 
      });
    }
    
    // Validate item for categories that have dropdowns
    if (EXPENSE_CATEGORIES[parsedData.category].length > 0 && 
        !EXPENSE_CATEGORIES[parsedData.category].includes(parsedData.itemName)) {
      return res.status(400).json({ 
        error: `Invalid item for category ${parsedData.category}. Must be one of: ${EXPENSE_CATEGORIES[parsedData.category].join(', ')}` 
      });
    }
    
    // Create expense record
    const expense = new Expense({
      farmId: parsedData.farmName, // In real implementation, map to actual farm ID
      category: parsedData.category,
      itemName: parsedData.itemName,
      quantity: parsedData.quantity,
      pricePerUnit: parsedData.pricePerUnit,
      totalAmount: parsedData.quantity * parsedData.pricePerUnit,
      date: new Date()
    });
    
    await expense.save();
    
    res.json({
      success: true,
      message: 'Expense entry created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Create Expense Error:', error);
    res.status(500).json({ 
      error: 'Failed to create expense entry',
      details: error.message
    });
  }
}

/**
 * GET /ai/expense-categories
 * Get expense categories and their dropdown options
 */
async function getExpenseCategories(req, res) {
  try {
    res.json({
      success: true,
      data: EXPENSE_CATEGORIES
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch expense categories',
      details: error.message
    });
  }
}

module.exports = {
  createExpenseFromCommand,
  getExpenseCategories,
  EXPENSE_CATEGORIES
};