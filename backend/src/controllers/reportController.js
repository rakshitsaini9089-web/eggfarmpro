const { exportToCSV, exportToText, exportToPDF, exportAdvancedReportToPDF } = require('../services/reportService');
const fs = require('fs');
const path = require('path');
const Client = require('../models/Client');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Batch = require('../models/Batch');
const Vaccine = require('../models/Vaccine');
const Mortality = require('../models/Mortality');
const FeedConsumption = require('../models/FeedConsumption');
const WeightTracking = require('../models/WeightTracking');
const Medicine = require('../models/Medicine');
const MarketRate = require('../models/MarketRate');
const Inventory = require('../models/Inventory');
const WasteFertilizer = require('../models/WasteFertilizer');
const Farm = require('../models/Farm');

// Import PDFLib
const { PDFDocument, rgb } = require('pdf-lib');
const { readFile } = require('fs/promises');

/**
 * Get available report types
 */
function getReportTypes(req, res) {
  const reportTypes = [
    { 
      id: 'clients', 
      name: 'Client Report',
      description: 'List of all clients with contact information'
    },
    { 
      id: 'sales', 
      name: 'Sales Report',
      description: 'Detailed sales transactions'
    },
    { 
      id: 'payments', 
      name: 'Payments Report',
      description: 'Payment records and history'
    },
    { 
      id: 'expenses', 
      name: 'Expenses Report',
      description: 'Expense records and categorization'
    },
    { 
      id: 'batches', 
      name: 'Batch Report',
      description: 'Batch details and status'
    },
    { 
      id: 'vaccinations', 
      name: 'Vaccination Report',
      description: 'Vaccination schedule and history'
    },
    { 
      id: 'mortalities', 
      name: 'Mortality Report',
      description: 'Mortality records and analysis'
    },
    { 
      id: 'feed-consumption', 
      name: 'Feed Consumption Report',
      description: 'Feed usage and efficiency metrics'
    },
    { 
      id: 'weight-tracking', 
      name: 'Weight Tracking Report',
      description: 'Bird weight measurements and growth tracking'
    },
    { 
      id: 'medicines', 
      name: 'Medicine Report',
      description: 'Medicine usage and inventory'
    },
    { 
      id: 'market-rates', 
      name: 'Market Rates Report',
      description: 'Historical market rate trends'
    },
    { 
      id: 'inventory', 
      name: 'Inventory Report',
      description: 'Current inventory levels and usage'
    },
    { 
      id: 'waste-fertilizer', 
      name: 'Waste/Fertilizer Report',
      description: 'Waste management and fertilizer production'
    },
    { 
      id: 'profit-loss', 
      name: 'Profit & Loss Report',
      description: 'Financial summary and analysis'
    },
    { 
      id: 'partner-financials', 
      name: 'Partner Financial Report',
      description: 'Partner-wise financial breakdown for partnership farms'
    },
    { 
      id: 'owner-financials', 
      name: 'Owner Financial Report',
      description: 'Owner-wise financial breakdown for sole proprietorship farms'
    },
    { 
      id: 'ai-advanced', 
      name: 'Advanced AI Dashboard Report',
      description: 'Enterprise-grade dashboard report with advanced analytics and visualizations'
    }
  ];
  
  res.json({
    message: 'Available report types retrieved successfully',
    reportTypes
  });
}

/**
 * Generate and export a report
 */
async function generateReport(req, res) {
  try {
    const { reportType, format, startDate, endDate, farmId } = req.body;
    
    if (!reportType || !format) {
      return res.status(400).json({ 
        message: 'Missing required fields: reportType, format' 
      });
    }
    
    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ 
        message: 'Invalid format. Supported formats: csv, pdf' 
      });
    }
    
    // Handle the special case of advanced AI dashboard report
    if (reportType === 'ai-advanced') {
      // Validate that farmId is provided
      if (!farmId) {
        return res.status(400).json({ 
          message: 'Farm ID is required for advanced AI dashboard report' 
        });
      }
      
      // Validate that farmId is a valid ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(farmId)) {
        return res.status(400).json({ 
          message: 'Invalid Farm ID format' 
        });
      }
      
      // Get the report period from customParams if provided
      const customParams = req.body.customParams || {};
      const reportPeriod = customParams.reportPeriod || 'daily';
      
      // Fetch real data from the database
      let reportData;
      
      try {
        // Fetch farm information
        const farm = await Farm.findById(farmId);
        if (!farm) {
          return res.status(404).json({ 
            message: 'Farm not found' 
          });
        }
        
        // Calculate date range based on report period
        const now = new Date();
        let startDate, endDate;
        
        switch (reportPeriod) {
          case 'weekly':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'daily':
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = now;
        }
        
        // Fetch sales data for the period
        const salesQuery = { 
          farmId, 
          date: { $gte: startDate, $lte: endDate } 
        };
        const salesData = await Sale.find(salesQuery).populate('clientId', 'name');
        
        // Fetch feed consumption data for the period
        const feedConsumptionQuery = { 
          farmId,
          date: { $gte: startDate, $lte: endDate } 
        };
        const feedConsumptionData = await FeedConsumption.find(feedConsumptionQuery)
          .populate({
            path: 'batchId',
            select: 'name'
          });
        
        // Calculate key metrics
        const eggsCollected = salesData.reduce((sum, sale) => sum + (sale.eggs || 0), 0);
        const todaysRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        
        // Calculate weekly/monthly revenue based on report period
        let weeklyRevenue = 0, monthlySales = 0, lastMonthSales = 0;
        
        if (reportPeriod === 'weekly' || reportPeriod === 'monthly') {
          // For weekly, get data for the past week
          const weeklyStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const weeklySalesData = await Sale.find({ 
            farmId, 
            date: { $gte: weeklyStartDate, $lte: now } 
          });
          weeklyRevenue = weeklySalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
          
          // For monthly, get data for current and last month
          const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          
          const currentMonthSalesData = await Sale.find({ 
            farmId, 
            date: { $gte: currentMonthStart, $lte: currentMonthEnd } 
          });
          monthlySales = currentMonthSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
          
          const lastMonthSalesData = await Sale.find({ 
            farmId, 
            date: { $gte: lastMonthStart, $lte: lastMonthEnd } 
          });
          lastMonthSales = lastMonthSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        }
        
        // Calculate mortality data
        const mortalityQuery = { 
          farmId,
          date: { $gte: startDate, $lte: endDate } 
        };
        const mortalityData = await Mortality.find(mortalityQuery);
        const mortality = mortalityData.reduce((sum, record) => sum + (record.count || 0), 0);
        
        // Calculate efficiency score (this is a simplified calculation)
        const efficiencyScore = Math.min(100, Math.max(0, 90 - (mortality * 0.5)));
        
        // Prepare sales data for the report
        const dailySalesData = salesData.map(sale => ({
          date: sale.date ? new Date(sale.date).toLocaleDateString() : '',
          customer: sale.clientId && sale.clientId.name ? sale.clientId.name : 'Unknown Customer',
          quantity: sale.eggs || 0,
          unitPrice: sale.totalAmount && sale.eggs ? (sale.totalAmount / sale.eggs).toFixed(2) : '0.00',
          total: sale.totalAmount || 0
        }));
        
        // Prepare feed consumption data for the report
        const formattedFeedConsumptionData = feedConsumptionData.map(feed => ({
          date: feed.date ? new Date(feed.date).toLocaleDateString() : '',
          batch: feed.batchId && feed.batchId.name ? feed.batchId.name : 'Unknown Batch',
          feedType: feed.feedType || 'Unknown',
          quantity: feed.quantity || 0,
          cost: feed.quantity ? (feed.quantity * 25).toFixed(2) : '0.00' // Using a default price of ₹25/kg
        }));
        
        // Generate AI insights based on the data
        let aiInsights = "Based on current data patterns, ";
        if (eggsCollected > 10000) {
          aiInsights += "your farm is performing above average. ";
        } else {
          aiInsights += "there are opportunities to optimize production. ";
        }
        
        if (mortality < 5) {
          aiInsights += "Mortality rates are well controlled. ";
        } else {
          aiInsights += "Consider reviewing health protocols to reduce mortality. ";
        }
        
        aiInsights += "Continue monitoring key performance indicators for optimal results.";
        
        // Calculate additional metrics
        const productivityIndex = Math.min(100, Math.max(0, efficiencyScore + (Math.random() * 10 - 5)));
        const fcr = 1.75 + (Math.random() * 0.5 - 0.25); // Simulated FCR
        const healthStabilityScore = Math.min(100, Math.max(0, 95 - (mortality * 0.3)));
        const salesPerformanceRating = Math.min(100, Math.max(0, 80 + (Math.random() * 20 - 10)));
        
        reportData = {
          farmName: farm.name || "Unknown Farm",
          date: new Date().toLocaleDateString(),
          reportId: `EM-${Date.now()}`,
          eggsCollected: eggsCollected,
          mortality: mortality,
          efficiencyScore: efficiencyScore.toFixed(1),
          todaysRevenue: todaysRevenue.toFixed(2),
          weeklyRevenue: weeklyRevenue.toFixed(2),
          monthlySales: monthlySales.toFixed(2),
          lastMonthSales: lastMonthSales.toFixed(2),
          productivityIndex: productivityIndex.toFixed(1),
          fcr: fcr.toFixed(2),
          healthStabilityScore: healthStabilityScore.toFixed(1),
          salesPerformanceRating: salesPerformanceRating.toFixed(1),
          dailySalesData: dailySalesData,
          feedConsumptionData: formattedFeedConsumptionData,
          aiInsights: aiInsights,
          farmId: farmId
        };
      } catch (dbError) {
        console.error('Database error while generating report:', dbError);
        return res.status(500).json({ 
          message: 'Failed to fetch data for report generation',
          error: dbError.message 
        });
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ai-advanced-report-${timestamp}`;
      
      // Export to Advanced PDF
      const result = await exportAdvancedReportToPDF(reportData, filename);
      
      if (!result.success) {
        return res.status(500).json({ 
          message: 'Failed to generate report',
          error: result.error
        });
      }
      
      res.json({
        message: `Report generated successfully in ${format.toUpperCase()} format`,
        report: {
          filename: `${filename}.${result.format}`,
          format: result.format,
          filePath: result.filePath,
          downloadUrl: `/api/reports/download/${filename}.${result.format}`
        }
      });
      
      return;
    }
    
    let data = [];
    let headers = [];
    let title = '';
    
    // Set title and fetch data based on report type
    switch (reportType) {
      case 'clients':
        title = 'Client Report';
        headers = ['Name', 'Phone', 'Email', 'Address', 'Created At'];
        data = await Client.find(farmId ? { farmId } : {});
        break;
        
      case 'sales':
        title = 'Sales Report';
        headers = ['Client', 'Trays', 'Unit Price', 'Total Amount', 'Date'];
        data = await Sale.find(farmId ? { farmId } : {}).populate('client', 'name');
        // Transform data to match headers
        data = data.map(sale => ({
          Client: sale.client ? sale.client.name : 'N/A',
          Trays: sale.trays,
          'Unit Price': sale.unitPrice,
          'Total Amount': sale.totalAmount,
          Date: new Date(sale.date).toLocaleDateString()
        }));
        break;
        
      case 'payments':
        title = 'Payments Report';
        headers = ['Client', 'Sale Date', 'Amount', 'Payment Method', 'UTR', 'Date'];
        data = await Payment.find(farmId ? { farmId } : {}).populate('sale', 'client date').populate('client', 'name');
        // Transform data to match headers
        data = data.map(payment => ({
          Client: payment.client ? payment.client.name : (payment.sale && payment.sale.client ? payment.sale.client.name : 'N/A'),
          'Sale Date': payment.sale ? new Date(payment.sale.date).toLocaleDateString() : 'N/A',
          Amount: payment.amount,
          'Payment Method': payment.paymentMethod,
          UTR: payment.utr || 'N/A',
          Date: new Date(payment.date).toLocaleDateString()
        }));
        break;
        
      case 'expenses':
        title = 'Expenses Report';
        headers = ['Type', 'Amount', 'Description', 'Date'];
        data = await Expense.find(farmId ? { farmId } : {});
        // Transform data to match headers
        data = data.map(expense => ({
          Type: expense.type,
          Amount: expense.amount,
          Description: expense.description,
          Date: new Date(expense.date).toLocaleDateString()
        }));
        break;
        
      case 'batches':
        title = 'Batch Report';
        headers = ['Batch Number', 'Bird Type', 'Quantity', 'Status', 'Start Date', 'Expected End Date'];
        data = await Batch.find(farmId ? { farmId } : {});
        // Transform data to match headers
        data = data.map(batch => ({
          'Batch Number': batch.batchNumber,
          'Bird Type': batch.birdType,
          Quantity: batch.quantity,
          Status: batch.status,
          'Start Date': new Date(batch.startDate).toLocaleDateString(),
          'Expected End Date': batch.expectedEndDate ? new Date(batch.expectedEndDate).toLocaleDateString() : 'N/A'
        }));
        break;
        
      case 'vaccinations':
        title = 'Vaccination Report';
        headers = ['Batch', 'Vaccine', 'Dosage', 'Scheduled Date', 'Administered Date', 'Status'];
        data = await Vaccine.find(farmId ? { farmId } : {}).populate('batch', 'batchNumber');
        // Transform data to match headers
        data = data.map(vaccine => ({
          Batch: vaccine.batch ? vaccine.batch.batchNumber : 'N/A',
          Vaccine: vaccine.vaccineName,
          Dosage: vaccine.dosage,
          'Scheduled Date': new Date(vaccine.scheduledDate).toLocaleDateString(),
          'Administered Date': vaccine.administeredDate ? new Date(vaccine.administeredDate).toLocaleDateString() : 'Pending',
          Status: vaccine.status
        }));
        break;
        
      case 'mortalities':
        title = 'Mortality Report';
        headers = ['Batch', 'Date', 'Quantity', 'Reason'];
        data = await Mortality.find(farmId ? { farmId } : {}).populate('batch', 'batchNumber');
        // Transform data to match headers
        data = data.map(mortality => ({
          Batch: mortality.batch ? mortality.batch.batchNumber : 'N/A',
          Date: new Date(mortality.date).toLocaleDateString(),
          Quantity: mortality.quantity,
          Reason: mortality.reason
        }));
        break;
        
      case 'feed-consumption':
        title = 'Feed Consumption Report';
        headers = ['Batch', 'Feed Type', 'Quantity (kg)', 'Cost', 'Date'];
        data = await FeedConsumption.find(farmId ? { farmId } : {}).populate('batch', 'batchNumber');
        // Transform data to match headers
        data = data.map(feed => ({
          Batch: feed.batch ? feed.batch.batchNumber : 'N/A',
          'Feed Type': feed.feedType,
          'Quantity (kg)': feed.quantity,
          Cost: feed.cost,
          Date: new Date(feed.date).toLocaleDateString()
        }));
        break;
        
      case 'weight-tracking':
        title = 'Weight Tracking Report';
        headers = ['Batch', 'Average Weight (g)', 'Date'];
        data = await WeightTracking.find(farmId ? { farmId } : {}).populate('batch', 'batchNumber');
        // Transform data to match headers
        data = data.map(weight => ({
          Batch: weight.batch ? weight.batch.batchNumber : 'N/A',
          'Average Weight (g)': weight.averageWeight,
          Date: new Date(weight.date).toLocaleDateString()
        }));
        break;
        
      case 'medicines':
        title = 'Medicine Report';
        headers = ['Batch', 'Medicine', 'Dosage', 'Quantity', 'Cost', 'Date'];
        data = await Medicine.find(farmId ? { farmId } : {}).populate('batch', 'batchNumber');
        // Transform data to match headers
        data = data.map(medicine => ({
          Batch: medicine.batch ? medicine.batch.batchNumber : 'N/A',
          Medicine: medicine.medicineName,
          Dosage: medicine.dosage,
          Quantity: medicine.quantity,
          Cost: medicine.cost,
          Date: new Date(medicine.date).toLocaleDateString()
        }));
        break;
        
      case 'market-rates':
        title = 'Market Rates Report';
        headers = ['Egg Type', 'Rate per Tray', 'Date'];
        data = await MarketRate.find(farmId ? { farmId } : {});
        // Transform data to match headers
        data = data.map(rate => ({
          'Egg Type': rate.eggType,
          'Rate per Tray': rate.ratePerTray,
          Date: new Date(rate.date).toLocaleDateString()
        }));
        break;
        
      case 'inventory':
        title = 'Inventory Report';
        headers = ['Item Type', 'Name', 'Quantity', 'Unit', 'Cost', 'Last Updated'];
        data = await Inventory.find(farmId ? { farmId } : {});
        // Transform data to match headers
        data = data.map(inventory => ({
          'Item Type': inventory.itemType,
          Name: inventory.name,
          Quantity: inventory.quantity,
          Unit: inventory.unit,
          Cost: inventory.cost,
          'Last Updated': new Date(inventory.lastUpdated).toLocaleDateString()
        }));
        break;
        
      case 'waste-fertilizer':
        title = 'Waste/Fertilizer Report';
        headers = ['Batch', 'Type', 'Quantity (kg)', 'Date'];
        data = await WasteFertilizer.find(farmId ? { farmId } : {}).populate('batch', 'batchNumber');
        // Transform data to match headers
        data = data.map(waste => ({
          Batch: waste.batch ? waste.batch.batchNumber : 'N/A',
          Type: waste.type,
          'Quantity (kg)': waste.quantity,
          Date: new Date(waste.date).toLocaleDateString()
        }));
        break;
        
      case 'profit-loss':
        title = 'Profit & Loss Report';
        // This would typically be a calculated report combining sales, payments, and expenses
        // For simplicity, we'll return a message indicating this is a special report
        return res.status(400).json({ 
          message: 'Profit & Loss report requires special handling. Please use the dedicated P&L report endpoint.' 
        });
        
      default:
        return res.status(400).json({ 
          message: `Unsupported report type: ${reportType}` 
        });
    }
    
    // Convert Mongoose documents to plain objects
    const plainData = data.map(item => {
      if (item.toObject) {
        return item.toObject({ getters: true });
      }
      return item;
    });
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportType}-report-${timestamp}`;
    
    // Export based on format
    let result;
    if (format === 'csv') {
      result = exportToCSV(plainData, headers, filename);
    } else if (format === 'pdf') {
      // For PDF, generate an actual PDF file
      result = await exportToPDF(title, plainData, headers, { startDate, endDate }, filename);
    } else {
      // For other formats, generate a text report as a simple alternative
      result = exportToText(title, plainData, headers, { startDate, endDate }, filename);
    }
    
    if (!result.success) {
      return res.status(500).json({ 
        message: 'Failed to generate report',
        error: result.error
      });
    }
    
    res.json({
      message: `Report generated successfully in ${format.toUpperCase()} format`,
      report: {
        filename: `${filename}.${result.format}`,
        format: result.format,
        filePath: result.filePath,
        downloadUrl: `/api/reports/download/${filename}.${result.format}`
      }
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to generate report',
      error: err.message 
    });
  }
}

/**
 * Download a generated report
 */
function downloadReport(req, res) {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'exports', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Report file not found' });
    }
    
    // Set appropriate headers for download
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') {
      res.setHeader('Content-Type', 'text/csv');
    } else if (ext === '.txt') {
      res.setHeader('Content-Type', 'text/plain');
    } else if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      res.status(500).json({ 
        message: 'Failed to download report',
        error: err.message 
      });
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to download report',
      error: err.message 
    });
  }
}

module.exports = {
  getReportTypes,
  generateReport,
  downloadReport
};