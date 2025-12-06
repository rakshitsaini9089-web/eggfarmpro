import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch today's data from the database
    // and generate a summary using AI
    
    // For demo purposes, returning mock daily summary
    const mockSummary = {
      date: new Date().toISOString().split('T')[0],
      eggsProduced: 1250,
      feedConsumed: 250, // in kg
      mortality: 3, // number of birds
      expenses: 1450, // in rupees
      profit: 8750, // in rupees
      insights: [
        "Egg production is 8% higher than yesterday",
        "Feed consumption is optimal for current flock size",
        "Consider increasing protein content in feed for better yield"
      ],
      status: 'success'
    };
    
    return new Response(
      JSON.stringify(mockSummary),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('Daily Summary API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate daily summary',
        message: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  }
}