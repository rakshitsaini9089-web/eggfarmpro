import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('UPI Scan API route called');
  
  try {
    // Get the form data from the request
    const formData = await request.formData();
    console.log('Received form data with', formData.entries().next().value ? 'entries' : 'no entries');
    
    // Get the authorization header
    const authorizationHeader = request.headers.get('authorization');
    console.log('Authorization header present:', !!authorizationHeader);
    if (authorizationHeader) {
      console.log('Authorization header value:', authorizationHeader.substring(0, 50) + '...');
    }
    
    // Forward the request to the backend using the same approach as the proxy
    const backendUrl = 'http://localhost:5001/api/upi/scan';
    console.log('Forwarding request to:', backendUrl);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      headers: {
        ...(authorizationHeader && { 'Authorization': authorizationHeader }),
      },
    });
    
    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));
    
    // Get the response data as text first to handle both JSON and HTML responses
    const responseText = await backendResponse.text();
    console.log('Backend response text length:', responseText.length);
    console.log('Backend response starts with:', responseText.substring(0, 100));
    
    // Try to parse as JSON, fallback to plain text if it fails
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Successfully parsed JSON response');
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Check if it's HTML (DOCTYPE response)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.log('Received HTML response - likely authentication issue');
        responseData = { 
          success: false, 
          message: 'Authentication required or route not found',
          rawResponse: 'HTML response received - possibly a redirect to login page'
        };
      } else {
        responseData = { 
          success: false, 
          message: 'Invalid response from backend',
          rawResponse: responseText.substring(0, 200) // First 200 chars for debugging
        };
      }
    }
    
    console.log('Sending response back to frontend');
    
    // Return the response with the same status
    return new Response(JSON.stringify(responseData), {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('UPI Scan API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to process UPI scan' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}