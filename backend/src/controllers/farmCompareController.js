// Farm Comparison Controller
const Farm = require('../models/Farm');
const Batch = require('../models/Batch');
const EggProduction = require('../models/EggProduction');
const FeedConsumption = require('../models/FeedConsumption');
const { AIEngine } = require('../utils/aiEngine');

/**
 * GET /ai/farm-compare
 * Compare two farms' performance
 */
async function compareFarms(req, res) {
  try {
    const { farm1, farm2 } = req.query;
    
    if (!farm1 || !farm2) {
      return res.status(400).json({ 
        error: 'Both farm1 and farm2 parameters are required' 
      });
    }
    
    // Fetch farm data
    const [farm1Data, farm2Data] = await Promise.all([
      Farm.findOne({ name: farm1 }),
      Farm.findOne({ name: farm2 })
    ]);
    
    if (!farm1Data || !farm2Data) {
      return res.status(404).json({ 
        error: 'One or both farms not found' 
      });
    }
    
    // Fetch performance data for both farms (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [farm1Batches, farm1EggProduction, farm1FeedConsumption, 
           farm2Batches, farm2EggProduction, farm2FeedConsumption] = await Promise.all([
      Batch.find({ farmId: farm1Data._id }),
      EggProduction.find({ farmId: farm1Data._id, date: { $gte: thirtyDaysAgo } }),
      FeedConsumption.find({ farmId: farm1Data._id, date: { $gte: thirtyDaysAgo } }),
      Batch.find({ farmId: farm2Data._id }),
      EggProduction.find({ farmId: farm2Data._id, date: { $gte: thirtyDaysAgo } }),
      FeedConsumption.find({ farmId: farm2Data._id, date: { $gte: thirtyDaysAgo } })
    ]);
    
    // Calculate metrics for farm 1
    const farm1Metrics = {
      name: farm1Data.name,
      activeBatches: farm1Batches.length,
      totalEggs: farm1EggProduction.reduce((sum, record) => sum + (record.quantity || 0), 0),
      totalFeed: farm1FeedConsumption.reduce((sum, record) => sum + (record.quantity || 0), 0)
    };
    
    // Calculate metrics for farm 2
    const farm2Metrics = {
      name: farm2Data.name,
      activeBatches: farm2Batches.length,
      totalEggs: farm2EggProduction.reduce((sum, record) => sum + (record.quantity || 0), 0),
      totalFeed: farm2FeedConsumption.reduce((sum, record) => sum + (record.quantity || 0), 0)
    };
    
    // Calculate efficiency metrics
    farm1Metrics.eggsPerBatch = farm1Metrics.activeBatches > 0 ? 
      (farm1Metrics.totalEggs / farm1Metrics.activeBatches).toFixed(2) : 0;
    farm1Metrics.feedEfficiency = farm1Metrics.totalEggs > 0 ? 
      (farm1Metrics.totalFeed / farm1Metrics.totalEggs).toFixed(2) : 0;
      
    farm2Metrics.eggsPerBatch = farm2Metrics.activeBatches > 0 ? 
      (farm2Metrics.totalEggs / farm2Metrics.activeBatches).toFixed(2) : 0;
    farm2Metrics.feedEfficiency = farm2Metrics.totalEggs > 0 ? 
      (farm2Metrics.totalFeed / farm2Metrics.totalEggs).toFixed(2) : 0;
    
    // Prepare comparison data
    const comparisonData = {
      farm1: farm1Metrics,
      farm2: farm2Metrics,
      comparison: {
        eggsDifference: farm1Metrics.totalEggs - farm2Metrics.totalEggs,
        feedDifference: farm1Metrics.totalFeed - farm2Metrics.totalFeed,
        eggsPerBatchDifference: parseFloat(farm1Metrics.eggsPerBatch) - parseFloat(farm2Metrics.eggsPerBatch),
        feedEfficiencyDifference: parseFloat(farm1Metrics.feedEfficiency) - parseFloat(farm2Metrics.feedEfficiency)
      }
    };
    
    // Generate AI insights
    const aiEngine = new AIEngine();
    const insightsPrompt = `
    As an egg farm management consultant, analyze the following farm comparison data and provide insights:
    
    Farm 1 (${comparisonData.farm1.name}):
    - Active Batches: ${comparisonData.farm1.activeBatches}
    - Total Eggs Produced: ${comparisonData.farm1.totalEggs}
    - Total Feed Consumed: ${comparisonData.farm1.totalFeed} kg
    - Eggs per Batch: ${comparisonData.farm1.eggsPerBatch}
    - Feed Efficiency (kg/feed per egg): ${comparisonData.farm1.feedEfficiency}
    
    Farm 2 (${comparisonData.farm2.name}):
    - Active Batches: ${comparisonData.farm2.activeBatches}
    - Total Eggs Produced: ${comparisonData.farm2.totalEggs}
    - Total Feed Consumed: ${comparisonData.farm2.totalFeed} kg
    - Eggs per Batch: ${comparisonData.farm2.eggsPerBatch}
    - Feed Efficiency (kg/feed per egg): ${comparisonData.farm2.feedEfficiency}
    
    Differences:
    - Eggs Produced: ${comparisonData.comparison.eggsDifference > 0 ? '+' : ''}${comparisonData.comparison.eggsDifference}
    - Feed Consumed: ${comparisonData.comparison.feedDifference > 0 ? '+' : ''}${comparisonData.comparison.feedDifference} kg
    - Eggs per Batch: ${comparisonData.comparison.eggsPerBatchDifference > 0 ? '+' : ''}${comparisonData.comparison.eggsPerBatchDifference}
    - Feed Efficiency: ${comparisonData.comparison.feedEfficiencyDifference > 0 ? '+' : ''}${comparisonData.comparison.feedEfficiencyDifference}
    
    Provide:
    1. Performance comparison summary
    2. Key differences analysis
    3. Recommendations for improvement
    4. Best practices from the better-performing farm
    
    Format your response as JSON:
    {
      "summary": "string",
      "keyDifferences": ["string"],
      "recommendations": ["string"],
      "bestPractices": ["string"]
    }
    `;
    
    let aiInsights = {
      summary: "Farm comparison insights not available",
      keyDifferences: [],
      recommendations: [],
      bestPractices: []
    };
    
    try {
      aiInsights = await aiEngine.generateJSON(insightsPrompt);
    } catch (error) {
      console.warn('Failed to generate AI insights:', error.message);
    }
    
    res.json({
      success: true,
      data: {
        ...comparisonData,
        insights: aiInsights
      }
    });
  } catch (error) {
    console.error('Farm Comparison Error:', error);
    res.status(500).json({ 
      error: 'Failed to compare farms',
      details: error.message
    });
  }
}

module.exports = {
  compareFarms
};