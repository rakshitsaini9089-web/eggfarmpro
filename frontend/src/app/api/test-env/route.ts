import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are available
    const groqApiKey = process.env.GROQ_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
    
    return new Response(
      JSON.stringify({ 
        groqApiKeyPresent: !!groqApiKey,
        openaiApiKeyPresent: !!openaiApiKey,
        huggingFaceApiKeyPresent: !!huggingFaceApiKey,
        groqApiKeyLength: groqApiKey ? groqApiKey.length : 0,
        nodeEnv: process.env.NODE_ENV
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Environment Test Error:', error);
    return new Response(
      JSON.stringify({ error: `Failed to test environment: ${error.message || 'Unknown error'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}