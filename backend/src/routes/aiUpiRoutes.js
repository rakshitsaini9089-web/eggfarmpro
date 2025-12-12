// AI-Powered UPI Reader Routes
const express = require('express');
const router = express.Router();

// Import controllers
const {
  processUPIText,
  processUPISMSFile,
  processUPIScreenshotEndpoint,
  saveUPITransaction,
  upiTextUpload,
  upiFileUpload,
  upiScreenshotUpload
} = require('../controllers/aiUpiReaderController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/ai-upi/process-text
 * @desc Process manually pasted UPI text
 * @access Private
 */
router.post('/process-text', upiTextUpload, processUPIText);

/**
 * @route POST /api/ai-upi/process-file
 * @desc Process uploaded SMS text file
 * @access Private
 */
router.post('/process-file', upiFileUpload, processUPISMSFile);

/**
 * @route POST /api/ai-upi/process-screenshot
 * @desc Process uploaded UPI screenshot
 * @access Private
 */
router.post('/process-screenshot', upiScreenshotUpload, processUPIScreenshotEndpoint);

/**
 * @route POST /api/ai-upi/save-transaction
 * @desc Save parsed UPI transaction to database
 * @access Private
 */
router.post('/save-transaction', saveUPITransaction);

module.exports = router;