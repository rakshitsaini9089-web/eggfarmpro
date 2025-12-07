const { exportToCSV, exportToText, exportToPDF } = require('../services/reportService');
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
      name: 'Batches Report',
      description: 'Chick batch information and details'
    },
    { 
      id: 'vaccinations', 
      name: 'Vaccination Report',
      description: 'Vaccination schedule and records'
    },
    { 
      id: 'mortality', 
      name: 'Mortality Report',
      description: 'Mortality tracking and analysis'
    },
    { 
      id: 'feed-consumption', 
      name: 'Feed Consumption Report',
      description: 'Feed usage and FCR analysis'
    },
    { 
      id: 'weight-tracking', 
      name: 'Weight Tracking Report',
      description: 'Bird weight measurements and growth curves'
    },
    { 
      id: 'medicines', 
      name: 'Medicine Report',
      description: 'Medicine usage and inventory'
    },
    { 
      id: 'market-rates', 
      name: 'Market Rates Report',
      description: 'Egg market rate trends'
    },
    { 
      id: 'inventory', 
      name: 'Inventory Report',
      description: 'Current inventory levels and status'
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
    
    let data = [];
    let headers = [];
    let title = '';
    
    // Fetch data based on report type
    switch (reportType) {
      case 'clients':
        title = 'Client Report';
        headers = ['name', 'phone', 'ratePerTray', 'createdAt'];
        data = await Client.find({
          ...(startDate && endDate ? {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('name phone ratePerTray createdAt');
        break;
        
      case 'sales':
        title = 'Sales Report';
        headers = ['clientName', 'trays', 'eggs', 'totalAmount', 'date'];
        data = await Sale.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('clientName trays eggs totalAmount date');
        break;
        
      case 'payments':
        title = 'Payments Report';
        headers = ['clientName', 'saleDate', 'amount', 'paymentMethod', 'utr', 'date'];
        data = await Payment.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('clientName saleDate amount paymentMethod utr date');
        break;
        
      case 'expenses':
        title = 'Expenses Report';
        headers = ['type', 'amount', 'description', 'date'];
        data = await Expense.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('type amount description date');
        break;
        
      case 'batches':
        title = 'Batches Report';
        headers = ['name', 'quantity', 'hatchDate', 'breed'];
        data = await Batch.find({
          ...(startDate && endDate ? {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('name quantity hatchDate breed');
        break;
        
      case 'vaccinations':
        title = 'Vaccination Report';
        headers = ['batchName', 'name', 'scheduledDate', 'administeredDate', 'status'];
        data = await Vaccine.find({
          ...(startDate && endDate ? {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('batchName name scheduledDate administeredDate status');
        break;
        
      case 'mortality':
        title = 'Mortality Report';
        headers = ['batchId', 'count', 'reason', 'age', 'mortalityPercentage', 'date'];
        data = await Mortality.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('batchId count reason age mortalityPercentage date');
        break;
        
      case 'feed-consumption':
        title = 'Feed Consumption Report';
        headers = ['batchId', 'feedType', 'quantity', 'unit', 'date', 'fcr'];
        data = await FeedConsumption.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('batchId feedType quantity unit date fcr');
        break;
        
      case 'weight-tracking':
        title = 'Weight Tracking Report';
        headers = ['batchId', 'averageWeight', 'unit', 'sampleSize', 'date', 'growthRate', 'deviation'];
        data = await WeightTracking.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('batchId averageWeight unit sampleSize date growthRate deviation');
        break;
        
      case 'medicines':
        title = 'Medicine Report';
        headers = ['name', 'batchId', 'dose', 'purpose', 'administeredDate', 'cost'];
        data = await Medicine.find({
          ...(startDate && endDate ? {
            administeredDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('name batchId dose purpose administeredDate cost');
        break;
        
      case 'market-rates':
        title = 'Market Rates Report';
        headers = ['date', 'ratePerTray', 'rateChange', 'rateChangePercentage'];
        data = await MarketRate.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('date ratePerTray rateChange rateChangePercentage');
        break;
        
      case 'inventory':
        title = 'Inventory Report';
        headers = ['itemName', 'itemType', 'quantity', 'unit', 'costPerUnit', 'totalPrice', 'supplier', 'purchaseDate', 'expiryDate'];
        data = await Inventory.find({
          ...(startDate && endDate ? {
            purchaseDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('itemName itemType quantity unit costPerUnit totalPrice supplier purchaseDate expiryDate');
        break;
        
      case 'waste-fertilizer':
        title = 'Waste/Fertilizer Report';
        headers = ['type', 'quantity', 'unit', 'date', 'saleAmount', 'buyer'];
        data = await WasteFertilizer.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('type quantity unit date saleAmount buyer');
        break;
        
      case 'profit-loss':
        title = 'Profit & Loss Report';
        // This would be a more complex report combining sales, payments, and expenses
        headers = ['date', 'description', 'income', 'expense', 'balance'];
        // For simplicity, we'll create a basic profit/loss report
        const salesData = await Sale.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('totalAmount date');
        
        const expenseData = await Expense.find({
          ...(startDate && endDate ? {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }).select('amount date description');
        
        // Combine data for profit/loss report
        const salesEntries = salesData.map(sale => ({
          date: sale.date,
          description: 'Sale',
          income: sale.totalAmount,
          expense: 0,
          balance: sale.totalAmount
        }));
        
        const expenseEntries = expenseData.map(expense => ({
          date: expense.date,
          description: expense.description,
          income: 0,
          expense: expense.amount,
          balance: -expense.amount
        }));
        
        data = [...salesEntries, ...expenseEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
        
      case 'partner-financials':
        title = 'Partner Financial Report';
        if (!farmId) {
          return res.status(400).json({ 
            message: 'Farm ID is required for partner financial reports' 
          });
        }
        
        // Get the farm details
        const farm = await Farm.findById(farmId);
        if (!farm) {
          return res.status(404).json({ 
            message: 'Farm not found' 
          });
        }
        
        if (farm.businessType !== 'partnership' || !farm.partnerDetails) {
          return res.status(400).json({ 
            message: 'Selected farm is not a partnership' 
          });
        }
        
        // Get sales, payments, and expenses for this farm
        const farmSales = await Sale.find({ farmId: farmId });
        const farmPayments = await Payment.find({ farmId: farmId });
        const farmExpenses = await Expense.find({ farmId: farmId }); // Add expenses
        
        // Calculate totals
        const totalSales = farmSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalPayments = farmPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalExpenses = farmExpenses.reduce((sum, expense) => sum + expense.amount, 0); // Add expenses
        const totalProfit = totalSales - totalPayments - totalExpenses; // Calculate profit
        
        // Calculate partner shares
        data = farm.partnerDetails.map(partner => ({
          partnerName: partner.name,
          percentage: partner.percentage,
          salesShare: (totalSales * partner.percentage) / 100,
          paymentShare: (totalPayments * partner.percentage) / 100,
          expenseShare: (totalExpenses * partner.percentage) / 100, // Add expense share
          profitShare: (totalProfit * partner.percentage) / 100 // Add profit share
        }));
        
        headers = ['partnerName', 'percentage', 'salesShare', 'paymentShare', 'expenseShare', 'profitShare']; // Update headers
        break;
        
      case 'owner-financials':
        title = 'Owner Financial Report';
        if (!farmId) {
          return res.status(400).json({ 
            message: 'Farm ID is required for owner financial reports' 
          });
        }
        
        // Get the farm details
        const ownerFarm = await Farm.findById(farmId);
        if (!ownerFarm) {
          return res.status(404).json({ 
            message: 'Farm not found' 
          });
        }
        
        if (ownerFarm.businessType !== 'sole_proprietorship') {
          return res.status(400).json({ 
            message: 'Selected farm is not a sole proprietorship' 
          });
        }
        
        // Get sales, payments, and expenses for this farm
        const ownerFarmSales = await Sale.find({ farmId: farmId });
        const ownerFarmPayments = await Payment.find({ farmId: farmId });
        const ownerFarmExpenses = await Expense.find({ farmId: farmId });
        
        // Calculate totals
        const ownerTotalSales = ownerFarmSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const ownerTotalPayments = ownerFarmPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const ownerTotalExpenses = ownerFarmExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const ownerTotalProfit = ownerTotalSales - ownerTotalPayments - ownerTotalExpenses;
        
        // For sole proprietorship, owner gets 100%
        data = [{
          ownerName: ownerFarm.owner,
          salesShare: ownerTotalSales,
          paymentShare: ownerTotalPayments,
          expenseShare: ownerTotalExpenses,
          profitShare: ownerTotalProfit
        }];
        
        headers = ['ownerName', 'salesShare', 'paymentShare', 'expenseShare', 'profitShare'];
        break;
        
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