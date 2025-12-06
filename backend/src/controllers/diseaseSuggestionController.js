// Disease/Issue Suggestion Controller
const Batch = require('../models/Batch');
const EggProduction = require('../models/EggProduction');
const Mortality = require('../models/Mortality');
const FeedConsumption = require('../models/FeedConsumption');
const { AIEngine } = require('../utils/aiEngine');

/**
 * POST /ai/disease-suggestions
 * Provide suggestions based on user-reported issues and farm data
 */
async function getSuggestions(req, res) {
  try {
    const { issue, farmId } = req.body;
    
    if (!issue) {
      return res.status(400).json({ 
        error: 'Issue description is required' 
      });
    }
    
    // Fetch recent farm data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let farmData = {};
    
    if (farmId) {
      // Fetch data for specific farm
      const [batches, eggProductions, mortalities, feedConsumptions] = await Promise.all([
        Batch.find({ farmId }),
        EggProduction.find({ farmId, date: { $gte: sevenDaysAgo } }),
        Mortality.find({ farmId, date: { $gte: sevenDaysAgo } }),
        FeedConsumption.find({ farmId, date: { $gte: sevenDaysAgo } })
      ]);
      
      // Calculate metrics
      const totalEggs = eggProductions.reduce((sum, record) => sum + (record.quantity || 0), 0);
      const avgDailyEggs = eggProductions.length > 0 ? totalEggs / eggProductions.length : 0;
      const totalMortality = mortalities.reduce((sum, record) => sum + (record.count || 0), 0);
      const totalFeed = feedConsumptions.reduce((sum, record) => sum + (record.quantity || 0), 0);
      
      farmData = {
        batches: batches.length,
        avgDailyEggs: avgDailyEggs.toFixed(2),
        totalMortality: totalMortality,
        totalFeed: totalFeed,
        recentTrends: {
          eggProduction: eggProductions.map(e => ({
            date: e.date,
            quantity: e.quantity
          })).slice(-5), // Last 5 entries
          mortality: mortalities.map(m => ({
            date: m.date,
            count: m.count
          })).slice(-5) // Last 5 entries
        }
      };
    }
    
    // Generate AI suggestions
    const aiEngine = new AIEngine();
    const suggestionPrompt = `
    As an experienced poultry farm veterinarian and manager, analyze the following issue and farm data:
    
    Reported Issue: "${issue}"
    
    ${farmId ? 
      `Recent Farm Data (Last 7 Days):
      - Active Batches: ${farmData.batches}
      - Average Daily Egg Production: ${farmData.avgDailyEggs}
      - Total Mortality: ${farmData.totalMortality}
      - Total Feed Consumed: ${farmData.totalFeed} kg
      
      Recent Trends:
      Egg Production: ${JSON.stringify(farmData.recentTrends.eggProduction)}
      Mortality: ${JSON.stringify(farmData.recentTrends.mortality)}` : 
      'No specific farm data available.'
    }
    
    Provide:
    1. Possible causes for the reported issue
    2. Immediate actions to take
    3. Preventive measures
    4. When to consult a veterinarian
    
    Format your response as JSON:
    {
      "possibleCauses": ["string"],
      "immediateActions": ["string"],
      "preventiveMeasures": ["string"],
      "vetConsultation": "string"
    }
    `;
    
    let aiSuggestions = {
      possibleCauses: [],
      immediateActions: [],
      preventiveMeasures: [],
      vetConsultation: "No specific recommendation"
    };
    
    try {
      aiSuggestions = await aiEngine.generateJSON(suggestionPrompt);
    } catch (error) {
      console.warn('Failed to generate AI suggestions:', error.message);
    }
    
    res.json({
      success: true,
      data: aiSuggestions
    });
  } catch (error) {
    console.error('Disease Suggestion Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message
    });
  }
}

module.exports = {
  getSuggestions
};