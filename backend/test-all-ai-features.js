const axios = require('axios');

// Use the real token from the login test
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTJlY2Q0MGZjY2U3OTNlZDE0M2U5NmIiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6Im93bmVyIiwiaWF0IjoxNzY1MDAyMjg5LCJleHAiOjE3NjUwODg2ODl9.NGhHsspAlgH5-4KjGvZfb2DBd0KY5iH2vsCMxl6_Ork';

const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

async function testAllAIFeatures() {
  console.log('Testing all AI features...\n');
  
  // Test AI Chat
  try {
    console.log('1. Testing AI Chat...');
    const chatResponse = await apiClient.post('/ai/chat', {
      messages: [
        { role: 'user', content: 'What are the best practices for egg production?' }
      ]
    });
    console.log('✓ AI Chat working\n');
  } catch (error) {
    console.error('✗ AI Chat failed:', error.response?.data || error.message);
  }
  
  // Test Daily Summary
  try {
    console.log('2. Testing Daily Summary...');
    const summaryResponse = await apiClient.get('/ai/daily-summary');
    console.log('✓ Daily Summary working\n');
  } catch (error) {
    console.error('✗ Daily Summary failed:', error.response?.data || error.message);
  }
  
  // Test Profit Calculator
  try {
    console.log('3. Testing Profit Calculator...');
    const profitResponse = await apiClient.get('/ai/profit-calculator?period=week&farmId=test');
    console.log('✓ Profit Calculator working\n');
  } catch (error) {
    console.error('✗ Profit Calculator failed:', error.response?.data || error.message);
  }
  
  // Test Farm Compare
  try {
    console.log('4. Testing Farm Compare...');
    const compareResponse = await apiClient.get('/ai/farm-compare?farm1=test1&farm2=test2');
    console.log('✓ Farm Compare working\n');
  } catch (error) {
    console.error('✗ Farm Compare failed:', error.response?.data || error.message);
  }
  
  // Test Report Generation
  try {
    console.log('5. Testing Report Generation...');
    const reportResponse = await apiClient.get('/ai/report/daily');
    console.log('✓ Report Generation working\n');
  } catch (error) {
    console.error('✗ Report Generation failed:', error.response?.data || error.message);
  }
  
  // Test Feed Optimization
  try {
    console.log('6. Testing Feed Optimization...');
    const feedResponse = await apiClient.post('/ai/feed-optimizer', {
      ingredients: ['corn', 'soybean meal', 'calcium carbonate'],
      targetNutrition: { protein: 16, calcium: 3.5 }
    });
    console.log('✓ Feed Optimization working\n');
  } catch (error) {
    console.error('✗ Feed Optimization failed:', error.response?.data || error.message);
  }
  
  // Test Disease Suggestions
  try {
    console.log('7. Testing Disease Suggestions...');
    const diseaseResponse = await apiClient.post('/ai/disease-suggestions', {
      issue: 'Decreased egg production with lethargy and loss of appetite'
    });
    console.log('✓ Disease Suggestions working\n');
  } catch (error) {
    console.error('✗ Disease Suggestions failed:', error.response?.data || error.message);
  }
  
  console.log('AI features test completed!');
}

testAllAIFeatures();