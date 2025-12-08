import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    
    if (!command) {
      return new Response(
        JSON.stringify({ error: 'Command is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          } 
        }
      );
    }
    
    // In a real implementation, this would parse the voice command
    // and extract expense details using AI
    
    // For demo purposes, returning mock parsed data
    const mockParsedData = {
      category: 'FEED EXPENSE',
      subCategory: 'Feed bag',
      amount: 1450,
      farm: 'ARNB',
      description: command,
      date: new Date().toISOString().split('T')[0],
      status: 'success'
    };
    
    return new Response(
      JSON.stringify(mockParsedData),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('Expense Parser API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to parse expense command',
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

export async function GET() {
  try {
    // Return available expense categories and subcategories
    const expenseCategories = {
      'FEED EXPENSE': [
        'Feed bag', 'LC', 'Maki', 'Bajara', 'Stone', 
        'Stone dust', 'DORB', 'DOC', 'Protein (soya)', 'Medicine'
      ],
      'CONSTRUCTION MATERIAL': [
        'Cement', 'Sand', 'Bricks', 'Steel', 'Wood', 
        'Paint', 'Tiles', 'Pipes', 'Electrical', 'Other'
      ],
      'CONSTRUCTION LABOUR': [],
      'OTHER': []
    };
    
    return new Response(
      JSON.stringify(expenseCategories),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('Expense Categories API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch expense categories',
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