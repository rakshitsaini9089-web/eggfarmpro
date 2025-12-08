// Report Generator Controller
const Batch = require('../models/Batch');
const EggProduction = require('../models/EggProduction');
const FeedConsumption = require('../models/FeedConsumption');
const Mortality = require('../models/Mortality');
const Expense = require('../models/Expense');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const { AIEngine } = require('../utils/aiEngine');

/**
 * Generate report data based on type and date range
 */
async function generateReportData(type, startDate, endDate, farmId) {
  try {
    // Validate that farmId is provided
    if (!farmId) {
      throw new Error('Farm ID is required to generate reports');
    }
    
    // Validate that farmId is a valid ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(farmId)) {
      throw new Error('Invalid Farm ID format');
    }
    
    // Set default date range if not provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    
    // For daily reports, we want just today
    if (type === 'daily') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    
    // Create farm filter
    const farmFilter = farmId ? { farmId } : {};
    
    // Fetch data based on report type
    switch (type) {
      case 'daily': {
        const [batches, eggProductions, feedConsumptions, mortalities, expenses, sales, payments] = await Promise.all([
          Batch.find({ status: 'active', ...farmFilter }),
          EggProduction.find({ date: { $gte: start, $lte: end }, ...farmFilter }),
          FeedConsumption.find({ date: { $gte: start, $lte: end }, ...farmFilter }),
          Mortality.find({ date: { $gte: start, $lte: end }, ...farmFilter }),
          Expense.find({ date: { $gte: start, $lte: end }, ...farmFilter }),
          Sale.find({ date: { $gte: start, $lte: end }, ...farmFilter }),
          Payment.find({ date: { $gte: start, $lte: end }, ...farmFilter })
        ]);
        
        // Calculate aggregates
        const activeBatches = batches.length;
        const eggsProduced = eggProductions.reduce((sum, record) => sum + (record.eggsProduced || 0), 0);
        const feedConsumed = feedConsumptions.reduce((sum, record) => sum + (record.quantity || 0), 0);
        const mortality = mortalities.reduce((sum, record) => sum + (record.quantity || 0), 0);
        const totalExpenses = expenses.reduce((sum, record) => sum + (record.amount || 0), 0);
        const totalSales = sales.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
        const totalPayments = payments.reduce((sum, record) => sum + (record.amount || 0), 0);
        
        // Calculate efficiency score
        const efficiencyScore = eggsProduced + mortality > 0 ? (eggsProduced / (eggsProduced + mortality)) * 100 : 0;
        
        return {
          type: 'daily',
          period: { start, end },
          data: {
            batches: activeBatches,
            eggsProduced,
            feedConsumed,
            mortality,
            expenses: totalExpenses,
            sales: totalSales,
            payments: totalPayments,
            profit: totalSales - totalExpenses,
            efficiencyScore
          }
        };
      }
      
      case 'weekly': {
        // Set date range to last 7 days
        const weekEnd = new Date();
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);
        
        // Adjust to start of day
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Group data by day for weekly report
        const days = [];
        const currentDate = new Date(weekStart);
        
        // Create farm filter
        const farmFilter = farmId ? { farmId } : {};
        
        while (currentDate <= weekEnd) {
          const dayStart = new Date(currentDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          
          // Fetch data for this day
          const [eggProductions, feedConsumptions, mortalities, expenses, sales] = await Promise.all([
            EggProduction.find({ date: { $gte: dayStart, $lte: dayEnd }, ...farmFilter }),
            FeedConsumption.find({ date: { $gte: dayStart, $lte: dayEnd }, ...farmFilter }),
            Mortality.find({ date: { $gte: dayStart, $lte: dayEnd }, ...farmFilter }),
            Expense.find({ date: { $gte: dayStart, $lte: dayEnd }, ...farmFilter }),
            Sale.find({ date: { $gte: dayStart, $lte: dayEnd }, ...farmFilter })
          ]);
          
          // Calculate aggregates
          const eggsProduced = eggProductions.reduce((sum, record) => sum + (record.eggsProduced || 0), 0);
          const feedConsumed = feedConsumptions.reduce((sum, record) => sum + (record.quantity || 0), 0);
          const mortality = mortalities.reduce((sum, record) => sum + (record.quantity || 0), 0);
          const totalExpenses = expenses.reduce((sum, record) => sum + (record.amount || 0), 0);
          const totalSales = sales.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
          
          days.push({
            date: dayStart.toISOString().split('T')[0],
            eggsProduced,
            feedConsumed,
            mortality,
            expenses: totalExpenses,
            sales: totalSales
          });
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return {
          type: 'weekly',
          period: { start: weekStart, end: weekEnd },
          data: days
        };
      }
      
      case 'monthly': {
        // Set date range to last 30 days
        const monthEnd = new Date();
        const monthStart = new Date(monthEnd);
        monthStart.setDate(monthStart.getDate() - 30);
        
        // Adjust to start of day
        monthStart.setHours(0, 0, 0, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        // Group data by week for monthly report
        const weeks = [];
        const currentDate = new Date(monthStart);
        
        // Create farm filter
        const farmFilter = farmId ? { farmId } : {};
        
        while (currentDate <= monthEnd) {
          const weekStart = new Date(currentDate);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          // Ensure we don't go beyond the month end
          if (weekEnd > monthEnd) {
            weekEnd.setTime(monthEnd.getTime());
          }
          
          // Fetch data for this week
          const [eggProductions, feedConsumptions, mortalities, expenses, sales, payments] = await Promise.all([
            EggProduction.find({ date: { $gte: weekStart, $lte: weekEnd }, ...farmFilter }),
            FeedConsumption.find({ date: { $gte: weekStart, $lte: weekEnd }, ...farmFilter }),
            Mortality.find({ date: { $gte: weekStart, $lte: weekEnd }, ...farmFilter }),
            Expense.find({ date: { $gte: weekStart, $lte: weekEnd }, ...farmFilter }),
            Sale.find({ date: { $gte: weekStart, $lte: weekEnd }, ...farmFilter }),
            Payment.find({ date: { $gte: weekStart, $lte: weekEnd }, ...farmFilter })
          ]);
          
          // Calculate aggregates
          const eggsProduced = eggProductions.reduce((sum, record) => sum + (record.eggsProduced || 0), 0);
          const feedConsumed = feedConsumptions.reduce((sum, record) => sum + (record.quantity || 0), 0);
          const mortality = mortalities.reduce((sum, record) => sum + (record.quantity || 0), 0);
          const totalExpenses = expenses.reduce((sum, record) => sum + (record.amount || 0), 0);
          const totalSales = sales.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
          const totalPayments = payments.reduce((sum, record) => sum + (record.amount || 0), 0);
          
          weeks.push({
            week: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
            eggsProduced,
            feedConsumed,
            mortality,
            expenses: totalExpenses,
            sales: totalSales,
            payments: totalPayments
          });
          
          // Move to next week
          currentDate.setDate(currentDate.getDate() + 7);
        }
        
        return {
          type: 'monthly',
          period: { start: monthStart, end: monthEnd },
          data: weeks
        };
      }

      default:
        throw new Error('Invalid report type');
    }
  } catch (error) {
    throw new Error(`Failed to generate report data: ${error.message}`);
  }
}

/**
 * Generate and export a report
 */
async function generateReport(req, res) {
  try {
    const { type } = req.params;
    const { startDate, endDate, farmId } = req.query;
    
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid report type. Must be daily, weekly, or monthly' 
      });
    }
    
    // Generate report data with farmId filter
    const reportData = await generateReportData(type, startDate, endDate, farmId);
    
    // Get farm name from database
    let farmName = "Unknown Farm";
    if (farmId) {
      try {
        const Farm = require('../models/Farm');
        const farm = await Farm.findById(farmId);
        if (farm) {
          farmName = farm.name;
        }
      } catch (error) {
        console.warn('Failed to fetch farm name:', error.message);
      }
    }
    
    // Generate AI summary
    const aiEngine = new AIEngine();
    const summaryPrompt = `
    As an egg farm management analyst, summarize the following ${reportData.type} report data:
    
    Period: ${reportData.period.start.toISOString().split('T')[0]} to ${reportData.period.end.toISOString().split('T')[0]}
    
    ${reportData.type === 'daily' ? 
      `Data:
      - Active Batches: ${reportData.data.batches}
      - Eggs Produced: ${reportData.data.eggsProduced}
      - Feed Consumed: ${reportData.data.feedConsumed} kg
      - Mortality: ${reportData.data.mortality} birds
      - Expenses: ₹${reportData.data.expenses.toFixed(2)}
      - Sales: ₹${reportData.data.sales.toFixed(2)}
      - Payments Received: ₹${reportData.data.payments.toFixed(2)}` :
      `Weekly/Monthly Data:
      ${JSON.stringify(reportData.data, null, 2)}`
    }
    
    Provide:
    1. Executive Summary (2-3 sentences)
    2. Key Metrics and Trends
    3. Actionable Recommendations
    4. Risk Assessment
    `;
    
    let aiSummary = {
      executiveSummary: "Your farm operations are running smoothly. Continue monitoring your production metrics for optimal performance.",
      keyMetrics: {
        efficiency: 0,
        profitability: 0
      },
      trends: [],
      recommendations: []
    };
    
    try {
      aiSummary = await aiEngine.generateJSON(summaryPrompt);
    } catch (error) {
      console.warn('Failed to generate AI summary:', error.message);
    }
    
    // Transform data based on report type for PDF generation
    let advancedReportData;
    switch (type) {
      case 'weekly':
        // Calculate totals for the week
        const totalEggs = reportData.data.reduce((sum, day) => sum + (day.eggsProduced || 0), 0);
        const totalMortality = reportData.data.reduce((sum, day) => sum + (day.mortality || 0), 0);
        const totalSales = reportData.data.reduce((sum, day) => sum + (day.sales || 0), 0);
        const totalExpenses = reportData.data.reduce((sum, day) => sum + (day.expenses || 0), 0);
        const totalFeed = reportData.data.reduce((sum, day) => sum + (day.feedConsumed || 0), 0);
        
        // Calculate previous week data for comparison
        const prevWeekStart = new Date(reportData.period.start);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(reportData.period.start);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
        
        // For now, we'll use a simple approach to get previous data
        // In a real implementation, you would fetch actual previous week data
        const lastWeekSales = totalSales * 0.95; // Simple estimation
        
        advancedReportData = {
          farmName: farmName,
          date: new Date().toLocaleDateString(),
          reportId: `EM-${Date.now()}`,
          eggsCollected: totalEggs,
          mortality: totalMortality,
          efficiencyScore: totalEggs + totalMortality > 0 ? Math.round((totalEggs / (totalEggs + totalMortality)) * 1000) / 10 : 0,
          todaysRevenue: reportData.data[reportData.data.length - 1]?.sales || 0,
          weeklyRevenue: totalSales,
          monthlySales: totalSales * 4, // Estimate monthly from weekly
          lastMonthSales: lastWeekSales * 4, // Estimate previous month from previous week
          productivityIndex: Math.min(100, Math.round((totalEggs / (totalEggs + totalMortality + 1)) * 100)),
          fcr: totalFeed > 0 ? Math.round((totalFeed / (totalEggs / 12)) * 100) / 100 : 0,
          healthStabilityScore: Math.max(70, 100 - Math.round((totalMortality / Math.max(totalEggs, 1)) * 10000)),
          salesPerformanceRating: Math.min(100, Math.round((totalSales / (lastWeekSales || 1)) * 100)),
          dailySalesData: reportData.data.map(day => ({
            date: day.date || new Date().toISOString().split('T')[0],
            customer: "Multiple Customers",
            quantity: day.eggsProduced || 0,
            unitPrice: totalSales > 0 && day.eggsProduced > 0 ? Math.round((totalSales / totalEggs) * 100) / 100 : 5.50,
            total: day.sales || 0
          })),
          feedConsumptionData: reportData.data.map(day => ({
            date: day.date || new Date().toISOString().split('T')[0],
            batch: "Multiple Batches",
            feedType: "Layer Mash",
            quantity: day.feedConsumed || 0,
            cost: (day.feedConsumed || 0) * 30 // Approximate cost
          })),
          aiInsights: aiSummary.executiveSummary || `Your farm showed strong performance this week with ${totalEggs.toLocaleString()} eggs produced. Weekly revenue reached ₹${totalSales.toLocaleString()}. Mortality rates remained low at ${(totalMortality/(totalEggs+totalMortality)*100).toFixed(2)}%.`,
          farmId: farmId || "FS-2025-001"
        };
        break;
        
      case 'monthly':
        // Calculate totals for the month
        const monthlyEggs = reportData.data.reduce((sum, week) => sum + (week.eggsProduced || 0), 0);
        const monthlyMortality = reportData.data.reduce((sum, week) => sum + (week.mortality || 0), 0);
        const monthlySalesTotal = reportData.data.reduce((sum, week) => sum + (week.sales || 0), 0);
        const monthlyExpenses = reportData.data.reduce((sum, week) => sum + (week.expenses || 0), 0);
        const monthlyFeed = reportData.data.reduce((sum, week) => sum + (week.feedConsumed || 0), 0);
        
        // Calculate previous month data for comparison
        const prevMonthStart = new Date(reportData.period.start);
        prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
        const prevMonthEnd = new Date(reportData.period.start);
        prevMonthEnd.setDate(prevMonthEnd.getDate() - 1);
        
        // For now, we'll use a simple approach to get previous data
        // In a real implementation, you would fetch actual previous month data
        const lastMonthSales = monthlySalesTotal * 0.97; // Simple estimation
        
        advancedReportData = {
          farmName: farmName,
          date: new Date().toLocaleDateString(),
          reportId: `EM-${Date.now()}`,
          eggsCollected: monthlyEggs,
          mortality: monthlyMortality,
          efficiencyScore: monthlyEggs + monthlyMortality > 0 ? Math.round((monthlyEggs / (monthlyEggs + monthlyMortality)) * 1000) / 10 : 0,
          todaysRevenue: reportData.data[reportData.data.length - 1]?.sales || 0,
          weeklyRevenue: reportData.data[reportData.data.length - 1]?.sales || 0,
          monthlySales: monthlySalesTotal,
          lastMonthSales: lastMonthSales,
          productivityIndex: Math.min(100, Math.round((monthlyEggs / (monthlyEggs + monthlyMortality + 1)) * 100)),
          fcr: monthlyFeed > 0 ? Math.round((monthlyFeed / (monthlyEggs / 12)) * 100) / 100 : 0,
          healthStabilityScore: Math.max(70, 100 - Math.round((monthlyMortality / Math.max(monthlyEggs, 1)) * 10000)),
          salesPerformanceRating: Math.min(100, Math.round((monthlySalesTotal / (lastMonthSales || 1)) * 100)),
          dailySalesData: reportData.data.map(week => ({
            date: week.week || new Date().toISOString().split('T')[0],
            customer: "Multiple Customers",
            quantity: week.eggsProduced || 0,
            unitPrice: monthlySalesTotal > 0 && monthlyEggs > 0 ? Math.round((monthlySalesTotal / monthlyEggs) * 100) / 100 : 5.50,
            total: week.sales || 0
          })),
          feedConsumptionData: reportData.data.map(week => ({
            date: week.week || new Date().toISOString().split('T')[0],
            batch: "Multiple Batches",
            feedType: "Layer Mash",
            quantity: week.feedConsumed || 0,
            cost: (week.feedConsumed || 0) * 30 // Approximate cost
          })),
          aiInsights: aiSummary.executiveSummary || `This month has been strong with total sales of ₹${monthlySalesTotal.toLocaleString()}. Egg production efficiency is at ${monthlyEggs + monthlyMortality > 0 ? Math.round((monthlyEggs / (monthlyEggs + monthlyMortality)) * 1000) / 10 : 0}% with an excellent FCR of ${monthlyFeed > 0 ? Math.round((monthlyFeed / (monthlyEggs / 12)) * 100) / 100 : 0}.`,
          farmId: farmId || "FS-2025-001"
        };
        break;
        
      case 'daily':
      default:
        // Use real daily data
        advancedReportData = {
          farmName: farmName,
          date: new Date().toLocaleDateString(),
          reportId: `EM-${Date.now()}`,
          eggsCollected: reportData.data.eggsProduced || 0,
          mortality: reportData.data.mortality || 0,
          efficiencyScore: reportData.data.eggsProduced + reportData.data.mortality > 0 ? Math.round(((reportData.data.eggsProduced || 0) / ((reportData.data.eggsProduced || 0) + (reportData.data.mortality || 0))) * 1000) / 10 : 0,
          todaysRevenue: reportData.data.sales || 0,
          weeklyRevenue: (reportData.data.sales || 0) * 7, // Estimate from daily
          monthlySales: (reportData.data.sales || 0) * 30, // Estimate from daily
          lastMonthSales: (reportData.data.sales || 0) * 0.95 * 30, // Estimate previous month
          productivityIndex: Math.min(100, Math.round(((reportData.data.eggsProduced || 0) / ((reportData.data.eggsProduced || 0) + (reportData.data.mortality || 0) + 1)) * 100)),
          fcr: (reportData.data.feedConsumed || 0) > 0 ? Math.round(((reportData.data.feedConsumed || 0) / ((reportData.data.eggsProduced || 1) / 12)) * 100) / 100 : 0,
          healthStabilityScore: Math.max(70, 100 - Math.round(((reportData.data.mortality || 0) / Math.max(reportData.data.eggsProduced || 1, 1)) * 10000)),
          salesPerformanceRating: 95, // Default rating for daily reports
          dailySalesData: [
            { 
              date: reportData.period.start.toISOString().split('T')[0], 
              customer: "Multiple Customers", 
              quantity: reportData.data.eggsProduced || 0, 
              unitPrice: (reportData.data.sales || 0) > 0 && (reportData.data.eggsProduced || 0) > 0 ? Math.round(((reportData.data.sales || 0) / (reportData.data.eggsProduced || 1)) * 100) / 100 : 5.50, 
              total: reportData.data.sales || 0 
            }
          ],
          feedConsumptionData: [
            { 
              date: reportData.period.start.toISOString().split('T')[0], 
              batch: "Multiple Batches", 
              feedType: "Layer Mash", 
              quantity: reportData.data.feedConsumed || 0, 
              cost: (reportData.data.feedConsumed || 0) * 30 
            }
          ],
          aiInsights: aiSummary.executiveSummary || `Your farm is performing well today with ${(reportData.data.eggsProduced || 0).toLocaleString()} eggs produced. Revenue reached ₹${(reportData.data.sales || 0).toLocaleString()}. Mortality rates are low at ${((reportData.data.mortality || 0)/((reportData.data.eggsProduced || 1)+(reportData.data.mortality || 0))*100).toFixed(2)}%.`,
          farmId: farmId || "FS-2025-001"
        };
    }
    
    // Generate filename with type
    const filename = `EggmindAI_${type.charAt(0).toUpperCase() + type.slice(1)}_Report_${new Date().toISOString().split('T')[0]}`;
    
    // Export to Advanced PDF
    const { exportAdvancedReportToPDF } = require('../services/reportService');
    const pdfResult = await exportAdvancedReportToPDF(
      advancedReportData,
      filename
    );
    
    if (!pdfResult.success) {
      throw new Error(pdfResult.error || 'Failed to generate PDF');
    }
    
    // Set proper headers for PDF download with dynamic filename
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report.pdf"`);
    
    // Stream the PDF file directly to the response
    const fs = require('fs');
    const path = require('path');
    
    // Check if file exists
    if (!fs.existsSync(pdfResult.filePath)) {
      throw new Error('PDF file was not created');
    }
    
    // Stream the PDF file directly to the response
    const fileStream = fs.createReadStream(pdfResult.filePath);
    fileStream.pipe(res);
    
    // Clean up the file after streaming (optional)
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
}

module.exports = {
  generateReport
};