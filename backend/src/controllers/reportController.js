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
      // Get the report period from customParams if provided
      const customParams = req.body.customParams || {};
      const reportPeriod = customParams.reportPeriod || 'daily';
      
      // Sample report data - in a real implementation, you would fetch this from your database
      // Adjust data based on report period
      let reportData;
      
      switch (reportPeriod) {
        case 'weekly':
          reportData = {
            farmName: "Sunny Side Egg Farm",
            date: new Date().toLocaleDateString(),
            reportId: `EM-${Date.now()}`,
            eggsCollected: 87500, // Weekly total
            mortality: 21, // Weekly total
            efficiencyScore: 82.3,
            todaysRevenue: 68750,
            weeklyRevenue: 481250,
            monthlySales: 2050000,
            lastMonthSales: 1985000,
            productivityIndex: 85,
            fcr: 1.82,
            healthStabilityScore: 88,
            salesPerformanceRating: 82,
            dailySalesData: [
              { date: "2025-12-01", customer: "Local Market", quantity: 1150, unitPrice: 5.50, total: 6325 },
              { date: "2025-12-01", customer: "Restaurant A", quantity: 750, unitPrice: 6.00, total: 4500 },
              { date: "2025-12-01", customer: "Supermarket Chain", quantity: 2400, unitPrice: 5.25, total: 12600 },
              { date: "2025-12-02", customer: "Local Market", quantity: 1200, unitPrice: 5.50, total: 6600 },
              { date: "2025-12-02", customer: "Restaurant A", quantity: 800, unitPrice: 6.00, total: 4800 },
              { date: "2025-12-02", customer: "Supermarket Chain", quantity: 2500, unitPrice: 5.25, total: 13125 },
              { date: "2025-12-03", customer: "Local Market", quantity: 1180, unitPrice: 5.50, total: 6490 },
              { date: "2025-12-03", customer: "Restaurant A", quantity: 780, unitPrice: 6.00, total: 4680 },
              { date: "2025-12-03", customer: "Supermarket Chain", quantity: 2450, unitPrice: 5.25, total: 12862 },
              { date: "2025-12-04", customer: "Local Market", quantity: 1220, unitPrice: 5.50, total: 6710 },
              { date: "2025-12-04", customer: "Restaurant A", quantity: 820, unitPrice: 6.00, total: 4920 },
              { date: "2025-12-04", customer: "Supermarket Chain", quantity: 2550, unitPrice: 5.25, total: 13387 },
              { date: "2025-12-05", customer: "Local Market", quantity: 1250, unitPrice: 5.50, total: 6875 },
              { date: "2025-12-05", customer: "Restaurant A", quantity: 850, unitPrice: 6.00, total: 5100 },
              { date: "2025-12-05", customer: "Supermarket Chain", quantity: 2600, unitPrice: 5.25, total: 13650 },
              { date: "2025-12-06", customer: "Local Market", quantity: 1100, unitPrice: 5.50, total: 6050 },
              { date: "2025-12-06", customer: "Restaurant A", quantity: 700, unitPrice: 6.00, total: 4200 },
              { date: "2025-12-06", customer: "Supermarket Chain", quantity: 2300, unitPrice: 5.25, total: 12075 },
              { date: "2025-12-07", customer: "Local Market", quantity: 1200, unitPrice: 5.50, total: 6600 },
              { date: "2025-12-07", customer: "Restaurant A", quantity: 800, unitPrice: 6.00, total: 4800 },
              { date: "2025-12-07", customer: "Supermarket Chain", quantity: 2500, unitPrice: 5.25, total: 13125 }
            ],
            feedConsumptionData: [
              { date: "2025-12-01", batch: "Batch A", feedType: "Layer Mash", quantity: 145, cost: 4350 },
              { date: "2025-12-01", batch: "Batch B", feedType: "Layer Mash", quantity: 115, cost: 3450 },
              { date: "2025-12-01", batch: "Batch C", feedType: "Grower Feed", quantity: 75, cost: 1875 },
              { date: "2025-12-02", batch: "Batch A", feedType: "Layer Mash", quantity: 150, cost: 4500 },
              { date: "2025-12-02", batch: "Batch B", feedType: "Layer Mash", quantity: 120, cost: 3600 },
              { date: "2025-12-02", batch: "Batch C", feedType: "Grower Feed", quantity: 80, cost: 2000 },
              { date: "2025-12-03", batch: "Batch A", feedType: "Layer Mash", quantity: 148, cost: 4440 },
              { date: "2025-12-03", batch: "Batch B", feedType: "Layer Mash", quantity: 118, cost: 3540 },
              { date: "2025-12-03", batch: "Batch C", feedType: "Grower Feed", quantity: 78, cost: 1950 },
              { date: "2025-12-04", batch: "Batch A", feedType: "Layer Mash", quantity: 152, cost: 4560 },
              { date: "2025-12-04", batch: "Batch B", feedType: "Layer Mash", quantity: 122, cost: 3660 },
              { date: "2025-12-04", batch: "Batch C", feedType: "Grower Feed", quantity: 82, cost: 2050 },
              { date: "2025-12-05", batch: "Batch A", feedType: "Layer Mash", quantity: 155, cost: 4650 },
              { date: "2025-12-05", batch: "Batch B", feedType: "Layer Mash", quantity: 125, cost: 3750 },
              { date: "2025-12-05", batch: "Batch C", feedType: "Grower Feed", quantity: 85, cost: 2125 },
              { date: "2025-12-06", batch: "Batch A", feedType: "Layer Mash", quantity: 140, cost: 4200 },
              { date: "2025-12-06", batch: "Batch B", feedType: "Layer Mash", quantity: 110, cost: 3300 },
              { date: "2025-12-06", batch: "Batch C", feedType: "Grower Feed", quantity: 70, cost: 1750 },
              { date: "2025-12-07", batch: "Batch A", feedType: "Layer Mash", quantity: 150, cost: 4500 },
              { date: "2025-12-07", batch: "Batch B", feedType: "Layer Mash", quantity: 120, cost: 3600 },
              { date: "2025-12-07", batch: "Batch C", feedType: "Grower Feed", quantity: 80, cost: 2000 }
            ],
            aiInsights: "Your farm showed strong performance this week with consistent egg production. Weekly revenue reached ₹4,81,250 with a healthy 2.1% increase from last week. Mortality rates remained low at 0.24%. Consider optimizing feed allocation for Batch B to improve FCR.",
            farmId: "FS-2025-001"
          };
          break;
          
        case 'monthly':
          reportData = {
            farmName: "Sunny Side Egg Farm",
            date: new Date().toLocaleDateString(),
            reportId: `EM-${Date.now()}`,
            eggsCollected: 375000, // Monthly total
            mortality: 95, // Monthly total
            efficiencyScore: 84.7,
            todaysRevenue: 68750,
            weeklyRevenue: 481250,
            monthlySales: 2050000,
            lastMonthSales: 1985000,
            productivityIndex: 86,
            fcr: 1.78,
            healthStabilityScore: 90,
            salesPerformanceRating: 84,
            dailySalesData: [
              // Sample of daily data for the month
              { date: "2025-12-01", customer: "Local Market", quantity: 1150, unitPrice: 5.50, total: 6325 },
              { date: "2025-12-01", customer: "Restaurant A", quantity: 750, unitPrice: 6.00, total: 4500 },
              { date: "2025-12-01", customer: "Supermarket Chain", quantity: 2400, unitPrice: 5.25, total: 12600 },
              { date: "2025-12-07", customer: "Local Market", quantity: 1200, unitPrice: 5.50, total: 6600 },
              { date: "2025-12-07", customer: "Restaurant A", quantity: 800, unitPrice: 6.00, total: 4800 },
              { date: "2025-12-07", customer: "Supermarket Chain", quantity: 2500, unitPrice: 5.25, total: 13125 },
              { date: "2025-12-14", customer: "Local Market", quantity: 1180, unitPrice: 5.50, total: 6490 },
              { date: "2025-12-14", customer: "Restaurant A", quantity: 780, unitPrice: 6.00, total: 4680 },
              { date: "2025-12-14", customer: "Supermarket Chain", quantity: 2450, unitPrice: 5.25, total: 12862 },
              { date: "2025-12-21", customer: "Local Market", quantity: 1220, unitPrice: 5.50, total: 6710 },
              { date: "2025-12-21", customer: "Restaurant A", quantity: 820, unitPrice: 6.00, total: 4920 },
              { date: "2025-12-21", customer: "Supermarket Chain", quantity: 2550, unitPrice: 5.25, total: 13387 },
              { date: "2025-12-28", customer: "Local Market", quantity: 1250, unitPrice: 5.50, total: 6875 },
              { date: "2025-12-28", customer: "Restaurant A", quantity: 850, unitPrice: 6.00, total: 5100 },
              { date: "2025-12-28", customer: "Supermarket Chain", quantity: 2600, unitPrice: 5.25, total: 13650 }
            ],
            feedConsumptionData: [
              { date: "2025-12-01", batch: "Batch A", feedType: "Layer Mash", quantity: 145, cost: 4350 },
              { date: "2025-12-01", batch: "Batch B", feedType: "Layer Mash", quantity: 115, cost: 3450 },
              { date: "2025-12-01", batch: "Batch C", feedType: "Grower Feed", quantity: 75, cost: 1875 },
              { date: "2025-12-07", batch: "Batch A", feedType: "Layer Mash", quantity: 150, cost: 4500 },
              { date: "2025-12-07", batch: "Batch B", feedType: "Layer Mash", quantity: 120, cost: 3600 },
              { date: "2025-12-07", batch: "Batch C", feedType: "Grower Feed", quantity: 80, cost: 2000 },
              { date: "2025-12-14", batch: "Batch A", feedType: "Layer Mash", quantity: 148, cost: 4440 },
              { date: "2025-12-14", batch: "Batch B", feedType: "Layer Mash", quantity: 118, cost: 3540 },
              { date: "2025-12-14", batch: "Batch C", feedType: "Grower Feed", quantity: 78, cost: 1950 },
              { date: "2025-12-21", batch: "Batch A", feedType: "Layer Mash", quantity: 152, cost: 4560 },
              { date: "2025-12-21", batch: "Batch B", feedType: "Layer Mash", quantity: 122, cost: 3660 },
              { date: "2025-12-21", batch: "Batch C", feedType: "Grower Feed", quantity: 82, cost: 2050 },
              { date: "2025-12-28", batch: "Batch A", feedType: "Layer Mash", quantity: 155, cost: 4650 },
              { date: "2025-12-28", batch: "Batch B", feedType: "Layer Mash", quantity: 125, cost: 3750 },
              { date: "2025-12-28", batch: "Batch C", feedType: "Grower Feed", quantity: 85, cost: 2125 }
            ],
            aiInsights: "December has been a strong month with total sales of ₹20,50,000 showing a 3.3% increase from November. Egg production efficiency improved to 84.7% with an excellent FCR of 1.78. Health stability scores remained consistently high throughout the month. Recommend continuing current feeding protocols and preparing for increased demand in January.",
            farmId: "FS-2025-001"
          };
          break;
          
        case 'daily':
        default:
          reportData = {
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
            aiInsights: "Your farm is performing well above average today. Egg production is consistent and mortality rates are low. Consider increasing feed allocation to Batch A to maximize output potential.",
            farmId: "FS-2025-001"
          };
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