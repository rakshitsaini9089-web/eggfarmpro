// Daily Insight Generator Controller
const Batch = require('../models/Batch');
const EggProduction = require('../models/EggProduction');
const FeedConsumption = require('../models/FeedConsumption');
const Mortality = require('../models/Mortality');
const Expense = require('../models/Expense');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const { AIEngine } = require('../utils/aiEngine');

/**
 * GET /ai/daily-summary
 * Generate daily summary with AI insights
 */
async function getDailySummary(req, res) {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    // Fetch today's data
    const [batches, eggProductions, feedConsumptions, mortalities, expenses, sales, payments] = await Promise.all([
      Batch.find({}),
      EggProduction.find({ date: { $gte: startOfDay, $lte: endOfDay } }),
      FeedConsumption.find({ date: { $gte: startOfDay, $lte: endOfDay } }),
      Mortality.find({ date: { $gte: startOfDay, $lte: endOfDay } }),
      Expense.find({ date: { $gte: startOfDay, $lte: endOfDay } }),
      Sale.find({ date: { $gte: startOfDay, $lte: endOfDay } }),
      Payment.find({ date: { $gte: startOfDay, $lte: endOfDay } })
    ]);
    
    // Calculate metrics
    const totalEggs = eggProductions.reduce((sum, record) => sum + (record.quantity || 0), 0);
    const totalFeed = feedConsumptions.reduce((sum, record) => sum + (record.quantity || 0), 0);
    const totalMortality = mortalities.reduce((sum, record) => sum + (record.count || 0), 0);
    const totalExpenses = expenses.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
    const totalSales = sales.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
    const totalPayments = payments.reduce((sum, record) => sum + (record.amount || 0), 0);
    
    // Calculate profit
    const profit = totalSales + totalPayments - totalExpenses;
    
    // Prepare data for AI analysis
    const dailyData = {
      date: startOfDay.toISOString().split('T')[0],
      eggsProduced: totalEggs,
      feedConsumed: totalFeed,
      mortality: totalMortality,
      expenses: totalExpenses,
      sales: totalSales,
      payments: totalPayments,
      profit: profit,
      activeBatches: batches.length
    };
    
    // Generate AI insights
    const aiEngine = new AIEngine();
    const insightsPrompt = `
    As an egg farm management expert, analyze the following daily data and provide insights:
    
    Date: ${dailyData.date}
    Eggs Produced: ${dailyData.eggsProduced}
    Feed Consumed: ${dailyData.feedConsumed} kg
    Mortality: ${dailyData.mortality} birds
    Expenses: ₹${dailyData.expenses.toFixed(2)}
    Sales: ₹${dailyData.sales.toFixed(2)}
    Payments Received: ₹${dailyData.payments.toFixed(2)}
    Profit: ₹${dailyData.profit.toFixed(2)}
    Active Batches: ${dailyData.activeBatches}
    
    Provide:
    1. A brief summary of the day's performance
    2. Key observations
    3. Recommendations for improvement
    4. Any alerts or concerns
    
    Format your response as JSON:
    {
      "summary": "string",
      "observations": ["string"],
      "recommendations": ["string"],
      "alerts": ["string"]
    }
    `;
    
    let aiInsights = {
      summary: "Daily insights not available",
      observations: [],
      recommendations: [],
      alerts: []
    };
    
    try {
      aiInsights = await aiEngine.generateJSON(insightsPrompt);
    } catch (error) {
      console.warn('Failed to generate AI insights:', error.message);
    }
    
    res.json({
      success: true,
      data: {
        metrics: dailyData,
        insights: aiInsights
      }
    });
  } catch (error) {
    console.error('Daily Summary Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate daily summary',
      details: error.message
    });
  }
}

module.exports = {
  getDailySummary
};