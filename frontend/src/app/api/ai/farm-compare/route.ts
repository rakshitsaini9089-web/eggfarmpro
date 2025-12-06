import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farm1 = searchParams.get('farm1');
    const farm2 = searchParams.get('farm2');
    
    if (!farm1 || !farm2) {
      return new Response(
        JSON.stringify({ error: 'Both farm1 and farm2 parameters are required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          } 
        }
      );
    }
    
    // In a real implementation, this would fetch data for both farms from the database
    // and compare them using AI analysis
    
    // For demo purposes, returning mock comparison data
    const mockComparison = {
      farm1: {
        name: farm1,
        production: 1250, // eggs per day
        feedUsage: 250, // kg per day
        profit: 8750 // rupees per day
      },
      farm2: {
        name: farm2,
        production: 1100, // eggs per day
        feedUsage: 270, // kg per day
        profit: 7200 // rupees per day
      },
      analysis: {
        productionDifference: 150, // farm1 - farm2
        feedEfficiency: {
          farm1: 5, // eggs per kg feed
          farm2: 4.07 // eggs per kg feed
        },
        profitDifference: 1550, // farm1 - farm2
        recommendations: [
          `${farm1} has 13.6% higher production efficiency`,
          `${farm2} should optimize feed usage to match ${farm1}'s performance`,
          "Consider implementing ${farm1}'s feeding schedule at ${farm2}"
        ]
      },
      status: 'success'
    };
    
    return new Response(
      JSON.stringify(mockComparison),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('Farm Comparison API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to compare farms',
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