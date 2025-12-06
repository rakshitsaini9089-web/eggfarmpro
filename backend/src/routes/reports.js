const express = require('express');
const router = express.Router();
const { getReportTypes, generateReport, downloadReport } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get available report types
router.get('/types', getReportTypes);

// Generate a report
router.post('/generate', generateReport);

// Download a generated report
router.get('/download/:filename', downloadReport);

module.exports = router;