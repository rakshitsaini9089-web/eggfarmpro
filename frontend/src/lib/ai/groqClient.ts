// Groq API client for AI chat functionality
// This should only be used on the server-side to protect API keys

class GroqClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    this.baseUrl = 'https://api.groq.com/openai/v1';
  }

  async chatCompletion(messages: { role: string; content: string }[], model = 'llama-3.3-70b-versatile') {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }

    console.log('Making request to Groq API with messages:', messages);
    console.log('Using API key (first 10 chars):', this.apiKey.substring(0, 10));

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      console.log('Groq API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Groq API error data:', errorData);
        throw new Error(`Groq API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Groq API response data:', data);
      return data.choices[0].message;
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  // Test if the API key is valid
  async testConnection(): Promise<boolean> {
    try {
      await this.chatCompletion([
        { role: 'user', content: 'Hello, this is a test message.' }
      ], 'llama3-8b-8192');
      return true;
    } catch (error) {
      console.error('Groq API connection test failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
// Check if we're in a server environment before accessing process.env
const apiKey = typeof process !== 'undefined' ? process.env.GROQ_API_KEY : undefined;
export const groqClient = new GroqClient(apiKey);

// Helper function for farm-related queries
export async function getFarmAssistantResponse(messages: { role: string; content: string }[]) {
  // Add context about egg farming to the conversation
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

When asked about your name, you should respond: "I am EggMind AI."
When asked about the AI model you're using, you should respond: "I'm powered by EggMind v1.00."

Always provide practical, actionable advice based on proven farming techniques. Be concise but thorough in your responses.`
  };

  return await groqClient.chatCompletion([systemMessage, ...messages], 'llama-3.3-70b-versatile');
}