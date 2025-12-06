import { NextRequest } from 'next/server';
import { getFarmAssistantResponse } from '@/lib/ai/groqClient';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    console.log('Received messages:', messages);

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get response from Groq API
    console.log('Calling getFarmAssistantResponse with messages:', messages);
    const response = await getFarmAssistantResponse(messages);
    console.log('Received response from Groq API:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('AI Chat API error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('GROQ_API_KEY is not set')) {
      return new Response(
        JSON.stringify({ error: 'AI service is not configured properly: API key is missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle network errors
    if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
      return new Response(
        JSON.stringify({ error: 'Unable to connect to AI service. Please check your internet connection.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle rate limiting
    if (error.message?.includes('rate limit')) {
      return new Response(
      JSON.stringify({ error: 'AI service is currently busy. Please wait a moment and try again.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: `Failed to process your request: ${error.message || 'Unknown error'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}