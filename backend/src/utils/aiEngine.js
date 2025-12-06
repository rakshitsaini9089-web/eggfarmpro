// AI Engine - Multi-model fallback system
const OpenAI = require('openai');
const axios = require('axios');

class AIEngine {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    this.defaultModel = 'gpt-4o-mini';
    this.fallbackModels = [
      'GROQ_MODEL', // Groq fallback
      'HF_MODEL', // HuggingFace fallback
      'OLLAMA_MODEL' // Ollama local fallback
    ];
  }

  /**
   * Auto-select the best available AI model
   */
  async selectBestModel() {
    // Priority 1: OpenAI
    if (this.openai && process.env.OPENAI_API_KEY) {
      try {
        // Test OpenAI connectivity
        await this.openai.models.list();
        return 'openai';
      } catch (error) {
        console.warn('OpenAI not available, trying fallback models');
      }
    }

    // Priority 2: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        // Test Groq connectivity
        const response = await axios.get('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 5000
        });
        if (response.status === 200) return 'groq';
      } catch (error) {
        console.warn('Groq not available, trying fallback models');
      }
    }

    // Priority 3: HuggingFace
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        // Test HuggingFace connectivity
        const response = await axios.get('https://huggingface.co/api/models', {
          headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
          timeout: 5000
        });
        if (response.status === 200) return 'huggingface';
      } catch (error) {
        console.warn('HuggingFace not available, trying fallback models');
      }
    }

    // Priority 4: Ollama Local
    try {
      const response = await axios.get('http://localhost:11434/api/tags', { timeout: 3000 });
      if (response.status === 200) return 'ollama';
    } catch (error) {
      console.warn('Ollama not available');
    }

    throw new Error('No AI models available');
  }

  /**
   * Generate response using OpenAI
   */
  async openaiGenerate(prompt, jsonMode = false) {
    if (!this.openai) throw new Error('OpenAI not configured');

    const response = await this.openai.chat.completions.create({
      model: this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: jsonMode ? { type: "json_object" } : undefined
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate response using Groq
   */
  async groqGenerate(prompt, jsonMode = false) {
    if (!process.env.GROQ_API_KEY) throw new Error('Groq API key not configured');

    // Format messages properly for Groq API
    const messages = [
      { role: 'user', content: prompt }
    ];

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant', // Updated to a supported model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: { 
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Generate response using HuggingFace
   */
  async huggingfaceGenerate(prompt) {
    if (!process.env.HUGGINGFACE_API_KEY) throw new Error('HuggingFace API key not configured');

    // Using a general purpose model - you can change this to a specific model
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      { inputs: prompt },
      {
        headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        timeout: 30000
      }
    );

    return response.data[0].generated_text;
  }

  /**
   * Generate response using Ollama
   */
  async ollamaGenerate(prompt) {
    const response = await axios.post(
      'http://localhost:11434/api/generate',
      {
        model: 'llama3',
        prompt: prompt,
        stream: false
      },
      { timeout: 30000 }
    );

    return response.data.response;
  }

  /**
   * Main generation function with fallback
   */
  async generate(prompt, jsonMode = false) {
    const model = await this.selectBestModel();
    
    try {
      switch (model) {
        case 'openai':
          return await this.openaiGenerate(prompt, jsonMode);
        case 'groq':
          return await this.groqGenerate(prompt, jsonMode);
        case 'huggingface':
          return await this.huggingfaceGenerate(prompt);
        case 'ollama':
          return await this.ollamaGenerate(prompt);
        default:
          throw new Error('No model available');
      }
    } catch (error) {
      console.error(`Failed with ${model}, trying fallback:`, error.message);
      
      // Try fallback models
      for (const fallback of this.fallbackModels) {
        try {
          // Simplified fallback - in a real implementation you would have specific fallback logic
          if (fallback === 'GROQ_MODEL' && process.env.GROQ_API_KEY) {
            return await this.groqGenerate(prompt, jsonMode);
          } else if (fallback === 'HF_MODEL' && process.env.HUGGINGFACE_API_KEY) {
            return await this.huggingfaceGenerate(prompt);
          } else if (fallback === 'OLLAMA_MODEL') {
            return await this.ollamaGenerate(prompt);
          }
        } catch (fallbackError) {
          console.error(`Fallback ${fallback} also failed:`, fallbackError.message);
          continue;
        }
      }
      
      throw new Error('All AI models failed');
    }
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON(instruction) {
    const prompt = `
    You are EggMind AI, an intelligent assistant for an egg farm management system.
    Please provide a structured JSON response to the following instruction:
    
    Instruction: ${instruction}
    
    Respond ONLY with valid JSON that matches the requested structure.
    `;
    
    return JSON.parse(await this.generate(prompt, true));
  }
}

module.exports = { AIEngine };