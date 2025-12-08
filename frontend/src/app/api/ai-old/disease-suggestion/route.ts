import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { issue, farmData } = await request.json();
    
    if (!issue) {
      return new Response(
        JSON.stringify({ error: 'Issue description is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          } 
        }
      );
    }
    
    // In a real implementation, this would analyze the issue description and farm data
    // using AI to suggest possible diseases or issues and solutions
    
    // For demo purposes, returning mock disease suggestions
    const mockSuggestions = {
      issue: issue,
      possibleCauses: [
        {
          cause: "Nutritional Deficiency",
          probability: 75,
          description: "Drop in egg production could be due to lack of essential nutrients",
          solution: "Review feed composition and consider adding vitamin supplements"
        },
        {
          cause: "Stress Factors",
          probability: 60,
          description: "Environmental stress can significantly impact egg production",
          solution: "Check coop conditions, temperature, and noise levels"
        },
        {
          cause: "Disease Outbreak",
          probability: 45,
          description: "Possible early signs of infectious bronchitis",
          solution: "Isolate affected birds and consult veterinarian immediately"
        }
      ],
      recommendedActions: [
        "Conduct immediate health check of all birds",
        "Review and adjust feeding program",
        "Ensure proper ventilation in coops",
        "Monitor egg production closely for next 3 days"
      ],
      status: 'success'
    };
    
    return new Response(
      JSON.stringify(mockSuggestions),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('Disease Suggestion API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze issue',
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