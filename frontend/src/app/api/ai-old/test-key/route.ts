import { NextRequest } from 'next/server';
import { groqClient } from '@/lib/ai/groqClient';

export async function GET(request: NextRequest) {
  try {
    // Test if the API key is valid
    const isValid = await groqClient.testConnection();
    
    if (isValid) {
      return new Response(
        JSON.stringify({ status: 'success', message: 'API key is valid and working' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ status: 'error', message: 'API key is invalid or not working' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('API Key Test Error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: `Failed to test API key: ${error.message || 'Unknown error'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}