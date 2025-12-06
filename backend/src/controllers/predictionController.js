// AI Prediction Controller
const Batch = require('../models/Batch');
const EggProduction = require('../models/EggProduction');
const FeedConsumption = require('../models/FeedConsumption');
const Mortality = require('../models/Mortality');
const Client = require('../models/Client');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const { AIEngine } = require('../utils/aiEngine');

/**
 * GET /ai/predictions/egg-production
 * Predict future egg production based on historical data
 */
async function predictEggProduction(req, res) {
  try {
    const { days = 7 } = req.query;
    
    // Fetch historical egg production data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const eggProductionHistory = await EggProduction.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });
    
    // Prepare data for AI analysis
    const productionData = eggProductionHistory.map(record => ({
      date: record.date.toISOString().split('T')[0],
      quantity: record.quantity || 0,
      batchId: record.batchId
    }));
    
    // Generate prediction using AI engine
    const aiEngine = new AIEngine();
    const predictionPrompt = `
    As an egg production forecasting expert, analyze the following historical egg production data and predict production for the next ${days} days:
    
    Historical Data:
    ${JSON.stringify(productionData, null, 2)}
    
    Consider factors like:
    - Seasonal patterns
    - Batch ages and productivity cycles
    - Environmental factors
    - Feed quality and consumption
    
    Provide:
    1. Predicted egg production for each of the next ${days} days
    2. Confidence level for predictions
    3. Key factors influencing the predictions
    4. Recommendations for optimizing production
    
    Format your response as JSON:
    {
      "predictions": [
        {
          "date": "YYYY-MM-DD",
          "predictedQuantity": 0,
          "confidence": 0.0
        }
      ],
      "factors": ["string"],
      "recommendations": ["string"]
    }
    `;
    
    let predictions = {
      predictions: [],
      factors: [],
      recommendations: []
    };
    
    try {
      predictions = await aiEngine.generateJSON(predictionPrompt);
    } catch (error) {
      console.warn('Failed to generate egg production predictions:', error.message);
      // Generate simple linear regression as fallback
      predictions = generateSimpleEggPrediction(productionData, parseInt(days));
    }
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Egg Production Prediction Error:', error);
    res.status(500).json({ 
      error: 'Failed to predict egg production',
      details: error.message
    });
  }
}

/**
 * GET /ai/predictions/feed-consumption
 * Predict future feed consumption based on historical data
 */
async function predictFeedConsumption(req, res) {
  try {
    const { days = 7 } = req.query;
    
    // Fetch historical feed consumption data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const feedConsumptionHistory = await FeedConsumption.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });
    
    // Prepare data for AI analysis
    const consumptionData = feedConsumptionHistory.map(record => ({
      date: record.date.toISOString().split('T')[0],
      quantity: record.quantity || 0,
      batchId: record.batchId,
      feedType: record.feedType
    }));
    
    // Generate prediction using AI engine
    const aiEngine = new AIEngine();
    const predictionPrompt = `
    As a poultry nutrition expert, analyze the following historical feed consumption data and predict consumption for the next ${days} days:
    
    Historical Data:
    ${JSON.stringify(consumptionData, null, 2)}
    
    Consider factors like:
    - Bird age and weight
    - Egg production levels
    - Seasonal variations
    - Feed quality and composition
    - Environmental temperature
    
    Provide:
    1. Predicted feed consumption for each of the next ${days} days
    2. Recommended feed types and quantities
    3. Cost projections
    4. Recommendations for optimization
    
    Format your response as JSON:
    {
      "predictions": [
        {
          "date": "YYYY-MM-DD",
          "predictedQuantity": 0,
          "feedType": "string"
        }
      ],
      "costProjection": 0,
      "recommendations": ["string"]
    }
    `;
    
    let predictions = {
      predictions: [],
      costProjection: 0,
      recommendations: []
    };
    
    try {
      predictions = await aiEngine.generateJSON(predictionPrompt);
    } catch (error) {
      console.warn('Failed to generate feed consumption predictions:', error.message);
      // Generate simple projection as fallback
      predictions = generateSimpleFeedPrediction(consumptionData, parseInt(days));
    }
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Feed Consumption Prediction Error:', error);
    res.status(500).json({ 
      error: 'Failed to predict feed consumption',
      details: error.message
    });
  }
}

/**
 * GET /ai/predictions/mortality-trend
 * Analyze mortality trends and predict future risks
 */
async function predictMortalityTrend(req, res) {
  try {
    // Fetch historical mortality data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const mortalityHistory = await Mortality.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });
    
    // Prepare data for AI analysis
    const mortalityData = mortalityHistory.map(record => ({
      date: record.date.toISOString().split('T')[0],
      count: record.count || 0,
      batchId: record.batchId,
      cause: record.cause
    }));
    
    // Generate analysis using AI engine
    const aiEngine = new AIEngine();
    const analysisPrompt = `
    As a poultry health expert, analyze the following mortality data and identify trends and risks:
    
    Historical Data:
    ${JSON.stringify(mortalityData, null, 2)}
    
    Consider factors like:
    - Disease patterns
    - Environmental stressors
    - Feed and water quality
    - Biosecurity measures
    - Seasonal factors
    
    Provide:
    1. Mortality trend analysis
    2. Risk assessment for the coming week
    3. Early warning signs to monitor
    4. Preventive measures and recommendations
    
    Format your response as JSON:
    {
      "trend": "string",
      "riskLevel": "low|medium|high",
      "warningSigns": ["string"],
      "preventiveMeasures": ["string"]
    }
    `;
    
    let analysis = {
      trend: "No data available",
      riskLevel: "low",
      warningSigns: [],
      preventiveMeasures: []
    };
    
    try {
      analysis = await aiEngine.generateJSON(analysisPrompt);
    } catch (error) {
      console.warn('Failed to analyze mortality trends:', error.message);
      // Generate simple analysis as fallback
      analysis = generateSimpleMortalityAnalysis(mortalityData);
    }
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Mortality Trend Analysis Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze mortality trends',
      details: error.message
    });
  }
}

/**
 * GET /ai/predictions/customer-risk
 * Analyze customer payment patterns and predict risks
 */
async function predictCustomerRisk(req, res) {
  try {
    // Fetch all clients and their payment/sale history
    const clients = await Client.find({});
    
    // For each client, get their sales and payments
    const clientRisks = [];
    
    for (const client of clients) {
      const [sales, payments] = await Promise.all([
        Sale.find({ clientId: client._id }),
        Payment.find({ clientId: client._id })
      ]);
      
      // Calculate payment patterns
      const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const outstandingBalance = totalSales - totalPayments;
      const paymentRatio = totalSales > 0 ? totalPayments / totalSales : 1;
      
      // Determine risk level
      let riskLevel = 'low';
      if (outstandingBalance > client.creditLimit || paymentRatio < 0.5) {
        riskLevel = 'high';
      } else if (outstandingBalance > client.creditLimit * 0.5 || paymentRatio < 0.8) {
        riskLevel = 'medium';
      }
      
      clientRisks.push({
        clientId: client._id,
        clientName: client.name,
        totalSales,
        totalPayments,
        outstandingBalance,
        paymentRatio,
        riskLevel
      });
    }
    
    // Generate AI analysis
    const aiEngine = new AIEngine();
    const analysisPrompt = `
    As a credit risk analyst, analyze the following customer payment data and assess risks:
    
    Customer Data:
    ${JSON.stringify(clientRisks, null, 2)}
    
    Consider factors like:
    - Payment history and timeliness
    - Outstanding balances vs credit limits
    - Sales volume trends
    - Seasonal payment patterns
    
    Provide:
    1. Overall risk assessment
    2. High-risk customers requiring attention
    3. Recommendations for credit management
    4. Collection strategies
    
    Format your response as JSON:
    {
      "overallRisk": "low|medium|high",
      "highRiskCustomers": [
        {
          "clientId": "string",
          "clientName": "string",
          "reason": "string"
        }
      ],
      "recommendations": ["string"],
      "collectionStrategies": ["string"]
    }
    `;
    
    let analysis = {
      overallRisk: "low",
      highRiskCustomers: [],
      recommendations: [],
      collectionStrategies: []
    };
    
    try {
      analysis = await aiEngine.generateJSON(analysisPrompt);
    } catch (error) {
      console.warn('Failed to analyze customer risks:', error.message);
      // Generate simple analysis as fallback
      analysis = generateSimpleCustomerRiskAnalysis(clientRisks);
    }
    
    res.json({
      success: true,
      data: {
        customerRisks: clientRisks,
        analysis
      }
    });
  } catch (error) {
    console.error('Customer Risk Analysis Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze customer risks',
      details: error.message
    });
  }
}

// Helper functions for fallback predictions
function generateSimpleEggPrediction(historicalData, days) {
  // Simple average-based prediction
  const avgProduction = historicalData.reduce((sum, record) => sum + record.quantity, 0) / historicalData.length || 0;
  
  const predictions = [];
  const today = new Date();
  
  for (let i = 1; i <= days; i++) {
    const predictionDate = new Date(today);
    predictionDate.setDate(today.getDate() + i);
    
    predictions.push({
      date: predictionDate.toISOString().split('T')[0],
      predictedQuantity: Math.round(avgProduction),
      confidence: 0.7
    });
  }
  
  return {
    predictions,
    factors: ["Historical average production", "Seasonal trends"],
    recommendations: ["Maintain consistent feeding schedule", "Monitor flock health"]
  };
}

function generateSimpleFeedPrediction(historicalData, days) {
  // Simple projection based on average consumption
  const avgConsumption = historicalData.reduce((sum, record) => sum + record.quantity, 0) / historicalData.length || 0;
  
  const predictions = [];
  const today = new Date();
  
  for (let i = 1; i <= days; i++) {
    const predictionDate = new Date(today);
    predictionDate.setDate(today.getDate() + i);
    
    predictions.push({
      date: predictionDate.toISOString().split('T')[0],
      predictedQuantity: Math.round(avgConsumption),
      feedType: "Standard Layer Feed"
    });
  }
  
  return {
    predictions,
    costProjection: Math.round(avgConsumption * days * 25), // Assuming ₹25/kg
    recommendations: ["Order feed in advance", "Monitor feed quality"]
  };
}

function generateSimpleMortalityAnalysis(historicalData) {
  // Simple trend analysis
  const recentData = historicalData.slice(-7); // Last 7 days
  const olderData = historicalData.slice(-14, -7); // Previous 7 days
  
  const recentAvg = recentData.reduce((sum, record) => sum + record.count, 0) / recentData.length || 0;
  const olderAvg = olderData.reduce((sum, record) => sum + record.count, 0) / olderData.length || 0;
  
  let trend = "stable";
  let riskLevel = "low";
  
  if (recentAvg > olderAvg * 1.2) {
    trend = "increasing";
    riskLevel = "high";
  } else if (recentAvg > olderAvg * 1.1) {
    trend = "slightly increasing";
    riskLevel = "medium";
  }
  
  return {
    trend,
    riskLevel,
    warningSigns: trend !== "stable" ? ["Monitor flock health closely"] : [],
    preventiveMeasures: ["Ensure proper ventilation", "Check feed and water quality"]
  };
}

function generateSimpleCustomerRiskAnalysis(clientRisks) {
  const highRiskCustomers = clientRisks
    .filter(client => client.riskLevel === 'high')
    .map(client => ({
      clientId: client.clientId,
      clientName: client.clientName,
      reason: `High outstanding balance: ₹${client.outstandingBalance}`
    }));
  
  const overallRisk = highRiskCustomers.length > 0 ? "medium" : "low";
  
  return {
    overallRisk,
    highRiskCustomers,
    recommendations: ["Review credit limits", "Implement stricter payment terms"],
    collectionStrategies: ["Prioritize high-risk accounts", "Offer early payment discounts"]
  };
}

module.exports = {
  predictEggProduction,
  predictFeedConsumption,
  predictMortalityTrend,
  predictCustomerRisk
};