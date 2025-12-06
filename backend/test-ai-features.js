require('dotenv').config();
const { AIEngine } = require('./src/utils/aiEngine');

async function testAIEngine() {
  console.log('Testing AI Engine...');
  
  // Check environment variables
  console.log('AI_FEATURES_ENABLED:', process.env.AI_FEATURES_ENABLED);
  console.log('GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
  console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
  console.log('HUGGINGFACE_API_KEY present:', !!process.env.HUGGINGFACE_API_KEY);
  
  try {
    const aiEngine = new AIEngine();
    
    // Test model selection
    console.log('\nTesting model selection...');
    const model = await aiEngine.selectBestModel();
    console.log('Selected model:', model);
    
    // Test generating a response
    console.log('\nTesting response generation...');
    const response = await aiEngine.generate('Hello, what can you help me with in egg farming?');
    console.log('Response:', response);
    
    console.log('\nAI Engine test completed successfully!');
  } catch (error) {
    console.error('AI Engine test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAIEngine();