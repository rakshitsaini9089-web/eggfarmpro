// Profit Calculator Controller
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const FeedConsumption = require('../models/FeedConsumption');
const Medicine = require('../models/Medicine');
const { AIEngine } = require('../utils/aiEngine');

/**
 * Calculate profit for a given period
 */
async function calculateProfit(period, startDate, endDate) {
  try {
    let start, end;
    
    // Set date range based on period
    const now = new Date();
    switch (period) {
      case 'daily':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'weekly':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        start = new Date(startDate);
        end = new Date(endDate);
        break;
      default:
        throw new Error('Invalid period');
    }
    
    // Fetch data for the period
    const [sales, expenses, feedConsumptions, medicines] = await Promise.all([
      Sale.find({ date: { $gte: start, $lte: end } }),
      Expense.find({ date: { $gte: start, $lte: end } }),
      FeedConsumption.find({ date: { $gte: start, $lte: end } }),
      Medicine.find({ date: { $gte: start, $lte: end } })
    ]);
    
    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);
    const totalFeedCost = feedConsumptions.reduce((sum, feed) => sum + (feed.cost || 0), 0);
    const totalMedicineCost = medicines.reduce((sum, medicine) => sum + (medicine.cost || 0), 0);
    
    // Calculate profit
    const totalCosts = totalExpenses + totalFeedCost + totalMedicineCost;
    const profit = totalSales - totalCosts;
    
    return {
      period: period,
      startDate: start,
      endDate: end,
      metrics: {
        totalSales: totalSales,
        totalExpenses: totalExpenses,
        totalFeedCost: totalFeedCost,
        totalMedicineCost: totalMedicineCost,
        totalCosts: totalCosts,
        profit: profit
      }
    };
  } catch (error) {
    console.error('Profit Calculation Error:', error);
    throw new Error('Failed to calculate profit');
  }
}

/**
 * GET /ai/profit-calculator
 * Calculate profit for specified period
 */
async function getProfit(req, res) {
  try {
    const { period, startDate, endDate } = req.query;
    
    if (!period && (!startDate || !endDate)) {
      return res.status(400).json({ 
        error: 'Period or startDate and endDate are required' 
      });
    }
    
    const profitData = await calculateProfit(period, startDate, endDate);
    
    // Generate AI insights
    const aiEngine = new AIEngine();
    const insightsPrompt = `
    As an egg farm financial analyst, analyze the following profit data and provide insights:
    
    Period: ${profitData.period}
    Start Date: ${profitData.startDate.toISOString().split('T')[0]}
    End Date: ${profitData.endDate.toISOString().split('T')[0]}
    Total Sales: ₹${profitData.metrics.totalSales.toFixed(2)}
    Total Expenses: ₹${profitData.metrics.totalExpenses.toFixed(2)}
    Total Feed Cost: ₹${profitData.metrics.totalFeedCost.toFixed(2)}
    Total Medicine Cost: ₹${profitData.metrics.totalMedicineCost.toFixed(2)}
    Total Costs: ₹${profitData.metrics.totalCosts.toFixed(2)}
    Profit: ₹${profitData.metrics.profit.toFixed(2)}
    
    Provide:
    1. Financial performance summary
    2. Cost breakdown analysis
    3. Profitability trends
    4. Recommendations for improving profitability
    
    Format your response as JSON:
    {
      "summary": "string",
      "costAnalysis": {
        "expensesPercentage": number,
        "feedPercentage": number,
        "medicinePercentage": number
      },
      "trends": ["string"],
      "recommendations": ["string"]
    }
    `;
    
    let aiInsights = {
      summary: "Profit insights not available",
      costAnalysis: {
        expensesPercentage: 0,
        feedPercentage: 0,
        medicinePercentage: 0
      },
      trends: [],
      recommendations: []
    };
    
    try {
      aiInsights = await aiEngine.generateJSON(insightsPrompt);
    } catch (error) {
      console.warn('Failed to generate AI insights:', error.message);
    }
    
    res.json({
      success: true,
      data: {
        ...profitData,
        insights: aiInsights
      }
    });
  } catch (error) {
    console.error('Profit Calculator Error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate profit',
      details: error.message
    });
  }
}

module.exports = {
  getProfit,
  calculateProfit
};