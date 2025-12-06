require('dotenv').config();
const { AIEngine } = require('./src/utils/aiEngine');
const axios = require('axios');

async function testAllAIModels() {
  console.log('Testing all AI models with your configured keys...\n');
  
  try {
    const aiEngine = new AIEngine();
    
    // Test model selection
    console.log('1. Testing model selection...');
    const selectedModel = await aiEngine.selectBestModel();
    console.log('✓ Selected model:', selectedModel);
    
    // Test each model individually
    console.log('\n2. Testing individual models...');
    
    // Test Groq (should work with your key)
    try {
      console.log('\n  Testing Groq model...');
      const groqResponse = await aiEngine.groqGenerate('Hello, what AI model are you?');
      console.log('  ✓ Groq model working');
      console.log('  Sample response:', groqResponse.substring(0, 100) + '...');
    } catch (error) {
      console.error('  ✗ Groq model failed:', error.message);
    }
    
    // Test HuggingFace (if key is provided)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        console.log('\n  Testing HuggingFace model...');
        const hfResponse = await aiEngine.huggingfaceGenerate('Hello, what AI model are you?');
        console.log('  ✓ HuggingFace model working');
        console.log('  Sample response:', hfResponse.substring(0, 100) + '...');
      } catch (error) {
        console.error('  ✗ HuggingFace model failed:', error.message);
      }
    } else {
      console.log('\n  Skipping HuggingFace test (no API key configured)');
    }
    
    // Test fallback mechanism
    console.log('\n3. Testing fallback mechanism...');
    try {
      // Force using a specific model to test fallback
      const fallbackResponse = await aiEngine.generate('What are the best practices for egg farming?', false);
      console.log('✓ Fallback mechanism working');
      console.log('Sample response:', fallbackResponse.substring(0, 100) + '...');
    } catch (error) {
      console.error('✗ Fallback mechanism failed:', error.message);
    }
    
    console.log('\n✅ All AI model tests completed!');
    
  } catch (error) {
    console.error('❌ AI model test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAllAIModels();