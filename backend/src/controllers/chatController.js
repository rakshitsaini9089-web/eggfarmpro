// Chat Controller
const { AIEngine } = require('../utils/aiEngine');

const aiEngine = new AIEngine();

/**
 * Handle chat messages and generate AI responses
 */
async function handleChat(req, res) {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Add system context for egg farming
    const systemMessage = {
      role: 'system',
      content: `You are EggMind AI, an expert egg farm management assistant. You help farmers with:
- Best practices for egg production
- Hen nutrition and feeding schedules
- Coop management and environmental conditions
- Disease prevention and biosecurity
- Record keeping and financial tracking
- Marketing and sales strategies
- Equipment maintenance
- Staff management

Always provide practical, actionable advice based on proven farming techniques. Be concise but thorough in your responses.`
    };

    // Prepare messages for the AI engine
    const aiMessages = [systemMessage, ...messages];

    // Format messages for the AI engine (convert to prompt format)
    const prompt = aiMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');

    // Generate response using the AI engine with fallback capabilities
    const responseContent = await aiEngine.generate(prompt);

    // Return the response in the expected format
    const response = {
      content: responseContent
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('AI Chat error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('No AI models available')) {
      return res.status(500).json({ 
        error: 'AI service is not configured properly - no models available' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process your request - ' + error.message 
    });
  }
}

module.exports = { handleChat };