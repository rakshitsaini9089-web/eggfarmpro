// AI Routes
const express = require('express');
const router = express.Router();

// Import middleware
const { aiAuthMiddleware } = require('../middleware/aiAuth');

// Import controllers
const { upiReader, upiReaderUpload } = require('../controllers/upiReaderController');
const { createExpenseFromCommand, getExpenseCategories } = require('../controllers/expenseController');
const { getDailySummary } = require('../controllers/dailyInsightController');
const { getProfit } = require('../controllers/profitCalculatorController');
const { compareFarms } = require('../controllers/farmCompareController');
const { generateReport } = require('../controllers/reportGeneratorController');
const { optimizeFeedFormula } = require('../controllers/feedOptimizationController');
const { getSuggestions } = require('../controllers/diseaseSuggestionController');
const { handleChat } = require('../controllers/chatController');

// Apply authentication middleware to all AI routes
router.use(aiAuthMiddleware);

// UPI Reader Routes
router.post('/upi-reader', upiReaderUpload, upiReader);

// Expense Routes
router.post('/expenses', createExpenseFromCommand);
router.get('/expense-categories', getExpenseCategories);

// Daily Insight Routes
router.get('/daily-summary', getDailySummary);

// Profit Calculator Routes
router.get('/profit-calculator', getProfit);

// Farm Comparison Routes
router.get('/farm-compare', compareFarms);

// Report Generator Routes
router.get('/report/:type', generateReport);

// Feed Optimization Routes
router.post('/feed-optimizer', optimizeFeedFormula);

// Disease/Issue Suggestion Routes
router.post('/disease-suggestions', getSuggestions);

// Chat Route
router.post('/chat', handleChat);

module.exports = router;