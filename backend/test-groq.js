const axios = require('axios');

async function testGroq() {
  try {
    // Use environment variable instead of hardcoded key
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    // Check if API key is available
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY environment variable is not set');
      return;
    }
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant', // Updated to a supported model
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        temperature: 0.7,
        max_tokens: 100
      },
      {
        headers: { 
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Groq Response:', response.data);
  } catch (error) {
    console.error('Groq Error:', error.response ? error.response.data : error.message);
  }
}

testGroq();