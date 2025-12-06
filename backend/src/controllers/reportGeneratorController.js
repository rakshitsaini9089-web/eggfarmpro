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
async function generateReportData(type, startDate, endDate) {
  try {
    // Set default date range if not provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Fetch data based on report type
    switch (type) {
      case 'daily': {
        const [batches, eggProductions, feedConsumptions, mortalities, expenses, sales, payments] = await Promise.all([
          Batch.find({}),
          EggProduction.find({ date: { $gte: start, $lte: end } }),
          FeedConsumption.find({ date: { $gte: start, $lte: end } }),
          Mortality.find({ date: { $gte: start, $lte: end } }),
          Expense.find({ date: { $gte: start, $lte: end } }),
          Sale.find({ date: { $gte: start, $lte: end } }),
          Payment.find({ date: { $gte: start, $lte: end } })
        ]);
        
        return {
          type: 'daily',
          period: { start, end },
          data: {
            batches: batches.length,
            eggsProduced: eggProductions.reduce((sum, record) => sum + (record.quantity || 0), 0),
            feedConsumed: feedConsumptions.reduce((sum, record) => sum + (record.quantity || 0), 0),
            mortality: mortalities.reduce((sum, record) => sum + (record.count || 0), 0),
            expenses: expenses.reduce((sum, record) => sum + (record.totalAmount || 0), 0),
            sales: sales.reduce((sum, record) => sum + (record.totalAmount || 0), 0),
            payments: payments.reduce((sum, record) => sum + (record.amount || 0), 0)
          }
        };
      }
      
      case 'weekly': {
        // Group data by week
        const weeklyData = [];
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          const weekStart = new Date(currentDate);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          const [eggProductions, feedConsumptions, mortalities, expenses, sales, payments] = await Promise.all([
            EggProduction.find({ date: { $gte: weekStart, $lte: weekEnd } }),
            FeedConsumption.find({ date: { $gte: weekStart, $lte: weekEnd } }),
            Mortality.find({ date: { $gte: weekStart, $lte: weekEnd } }),
            Expense.find({ date: { $gte: weekStart, $lte: weekEnd } }),
            Sale.find({ date: { $gte: weekStart, $lte: weekEnd } }),
            Payment.find({ date: { $gte: weekStart, $lte: weekEnd } })
          ]);
          
          weeklyData.push({
            week: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
            eggsProduced: eggProductions.reduce((sum, record) => sum + (record.quantity || 0), 0),
            feedConsumed: feedConsumptions.reduce((sum, record) => sum + (record.quantity || 0), 0),
            mortality: mortalities.reduce((sum, record) => sum + (record.count || 0), 0),
            expenses: expenses.reduce((sum, record) => sum + (record.totalAmount || 0), 0),
            sales: sales.reduce((sum, record) => sum + (record.totalAmount || 0), 0),
            payments: payments.reduce((sum, record) => sum + (record.amount || 0), 0)
          });
          
          currentDate.setDate(currentDate.getDate() + 7);
        }
        
        return {
          type: 'weekly',
          period: { start, end },
          data: weeklyData
        };
      }
      
      case 'monthly': {
        // Group data by month
        const monthlyData = [];
        const currentDate = new Date(start);
        currentDate.setDate(1); // Start from first day of month
        
        while (currentDate <= end) {
          const monthStart = new Date(currentDate);
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          
          const [eggProductions, feedConsumptions, mortalities, expenses, sales, payments] = await Promise.all([
            EggProduction.find({ date: { $gte: monthStart, $lte: monthEnd } }),
            FeedConsumption.find({ date: { $gte: monthStart, $lte: monthEnd } }),
            Mortality.find({ date: { $gte: monthStart, $lte: monthEnd } }),
            Expense.find({ date: { $gte: monthStart, $lte: monthEnd } }),
            Sale.find({ date: { $gte: monthStart, $lte: monthEnd } }),
            Payment.find({ date: { $gte: monthStart, $lte: monthEnd } })
          ]);
          
          monthlyData.push({
            month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
            eggsProduced: eggProductions.reduce((sum, record) => sum + (record.quantity || 0), 0),
            feedConsumed: feedConsumptions.reduce((sum, record) => sum + (record.quantity || 0), 0),
            mortality: mortalities.reduce((sum, record) => sum + (record.count || 0), 0),
            expenses: expenses.reduce((sum, record) => sum + (record.totalAmount || 0), 0),
            sales: sales.reduce((sum, record) => sum + (record.totalAmount || 0), 0),
            payments: payments.reduce((sum, record) => sum + (record.amount || 0), 0)
          });
          
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return {
          type: 'monthly',
          period: { start, end },
          data: monthlyData
        };
      }
      
      default:
        throw new Error('Invalid report type');
    }
  } catch (error) {
    console.error('Report Generation Error:', error);
    throw new Error('Failed to generate report data');
  }
}

/**
 * GET /ai/report/:type
 * Generate PDF report
 */
async function generateReport(req, res) {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid report type. Must be daily, weekly, or monthly' 
      });
    }
    
    // Generate report data
    const reportData = await generateReportData(type, startDate, endDate);
    
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
    1. Executive summary
    2. Key performance indicators
    3. Trends and patterns
    4. Recommendations
    
    Format your response as JSON:
    {
      "executiveSummary": "string",
      "kpis": {
        "production": number,
        "efficiency": number,
        "profitability": number
      },
      "trends": ["string"],
      "recommendations": ["string"]
    }
    `;
    
    let aiSummary = {
      executiveSummary: "Report summary not available",
      kpis: {
        production: 0,
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
    
    // For PDF generation, we would typically use a library like pdfkit or html-pdf
    // For now, we'll return the data that would be used to generate the PDF
    
    res.json({
      success: true,
      data: {
        ...reportData,
        aiSummary: aiSummary,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message
    });
  }
}

module.exports = {
  generateReport
};