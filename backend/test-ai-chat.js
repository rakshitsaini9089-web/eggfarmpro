const axios = require('axios');

async function testAIChat() {
  try {
    // First, let's login to get a token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, token received');

    // Now let's test the AI chat
    const chatResponse = await axios.post('http://localhost:5001/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hello, what can you help me with?' }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('AI Chat Response:', chatResponse.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAIChat();