import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const { type } = params;
    
    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Report type is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          } 
        }
      );
    }
    
    // Validate report type
    const validTypes = ['daily', 'weekly', 'monthly'];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid report type' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          } 
        }
      );
    }
    
    // In a real implementation, this would generate a PDF report
    // based on the requested type and farm data
    
    // For demo purposes, returning mock report data
    const mockReportData = {
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      generatedAt: new Date().toISOString(),
      url: `/api/ai/report/${type}/download`, // Mock download URL
      status: 'success'
    };
    
    return new Response(
      JSON.stringify(mockReportData),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('Report Generator API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate report',
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