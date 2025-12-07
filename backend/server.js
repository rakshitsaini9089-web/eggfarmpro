const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware with more permissive CORS
app.use(cors({
  origin: true, // Allow any origin
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eggfarm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Import routes
const apiRoutes = require('./src/routes');

// Public routes (no authentication required for auth endpoints)
app.use('/api', apiRoutes);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Egg Farm Management API' });
});

// Test route for advanced PDF generation
app.get('/api/test-advanced-report', async (req, res) => {
  try {
    const { exportAdvancedReportToPDF } = require('./src/services/reportService');
    
    // Sample report data
    const reportData = {
      farmName: "Sunny Side Egg Farm",
      date: new Date().toLocaleDateString(),
      reportId: `EM-${Date.now()}`,
      eggsCollected: 12500,
      mortality: 3,
      efficiencyScore: 85.5,
      todaysRevenue: 68750,
      weeklyRevenue: 481250,
      monthlySales: 2050000,
      lastMonthSales: 1985000,
      productivityIndex: 88,
      fcr: 1.75,
      healthStabilityScore: 92,
      salesPerformanceRating: 85,
      dailySalesData: [
        { date: "2025-12-07", customer: "Local Market", quantity: 1200, unitPrice: 5.50, total: 6600 },
        { date: "2025-12-07", customer: "Restaurant A", quantity: 800, unitPrice: 6.00, total: 4800 },
        { date: "2025-12-07", customer: "Supermarket Chain", quantity: 2500, unitPrice: 5.25, total: 13125 }
      ],
      feedConsumptionData: [
        { date: "2025-12-07", batch: "Batch A", feedType: "Layer Mash", quantity: 150, cost: 4500 },
        { date: "2025-12-07", batch: "Batch B", feedType: "Layer Mash", quantity: 120, cost: 3600 },
        { date: "2025-12-07", batch: "Batch C", feedType: "Grower Feed", quantity: 80, cost: 2000 }
      ],
      aiInsights: "Your farm is performing well above average this week. Egg production is consistent and mortality rates are low. Consider increasing feed allocation to Batch A to maximize output potential.",
      farmId: "FS-2025-001"
    };
    
    // Generate filename
    const filename = `EggmindAI_Advanced_Report_${new Date().toISOString().split('T')[0]}`;
    
    // Export to Advanced PDF
    const pdfResult = await exportAdvancedReportToPDF(reportData, filename);
    
    if (!pdfResult.success) {
      throw new Error(pdfResult.error || 'Failed to generate PDF');
    }
    
    // Set proper headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EggmindAI_Advanced_Report.pdf"`);
    
    // Stream the PDF file directly to the response
    const fs = require('fs');
    const fileStream = fs.createReadStream(pdfResult.filePath);
    fileStream.pipe(res);
    
    // Clean up the file after streaming
    fileStream.on('close', () => {
      // Optionally delete the file after sending
      // fs.unlinkSync(pdfResult.filePath);
    });
    
    fileStream.on('error', (err) => {
      console.error('Error streaming PDF:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to stream PDF',
          details: err.message
        });
      }
    });
  } catch (error) {
    console.error('Report Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate report',
        details: error.message
      });
    }
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;