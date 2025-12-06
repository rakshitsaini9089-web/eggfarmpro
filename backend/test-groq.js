const axios = require('axios');

async function testGroq() {
  try {
    const GROQ_API_KEY = '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';
    
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