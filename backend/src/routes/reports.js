const express = require('express');
const router = express.Router();
const { getReportTypes, generateReport, downloadReport } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Get available report types
router.get('/types', authenticateToken, getReportTypes);

// Generate a report
router.post('/generate', authenticateToken, generateReport);

// Download a generated report
router.get('/download/:filename', authenticateToken, downloadReport);

module.exports = router;