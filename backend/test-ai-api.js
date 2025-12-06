const axios = require('axios');

// Use the real token from the login test
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTJlY2Q0MGZjY2U3OTNlZDE0M2U5NmIiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6Im93bmVyIiwiaWF0IjoxNzY1MDAyMjg5LCJleHAiOjE3NjUwODg2ODl9.NGhHsspAlgH5-4KjGvZfb2DBd0KY5iH2vsCMxl6_Ork';

async function testAIChatAPI() {
  try {
    console.log('\nTesting AI Chat API with real token...');
    
    const response = await axios.post(
      'http://localhost:5001/api/ai/chat',
      {
        messages: [
          { role: 'user', content: 'Hello, what can you help me with in egg farming?' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('AI Chat API Response:', response.data);
  } catch (error) {
    console.error('AI Chat API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAIChatAPI();