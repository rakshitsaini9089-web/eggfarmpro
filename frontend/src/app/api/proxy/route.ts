import { NextRequest } from 'next/server';

// Proxy handler for backend API requests
export async function POST(request: NextRequest) {
  try {
    // Get the target endpoint from the query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ message: 'Missing endpoint parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the authorization header
    const authorizationHeader = request.headers.get('authorization');
    
    // Forward the request to the backend
    const backendUrl = `http://localhost:5001/api${endpoint}`;
    
    console.log('Proxying POST request to:', backendUrl);
    
    // Check if the request has multipart form data
    const contentType = request.headers.get('content-type');
    let backendResponse;
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // For multipart form data, we need to forward the raw body
      // Get the raw body as ArrayBuffer
      const arrayBuffer = await request.arrayBuffer();
      
      backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          ...(authorizationHeader && { 'Authorization': authorizationHeader }),
          'content-type': contentType,
        },
        body: arrayBuffer,
      });
    } else {
      // For JSON or other data types, handle as before
      const body = await request.text();
      
      backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authorizationHeader && { 'Authorization': authorizationHeader }),
        },
        body: body,
      });
    }

    // Get the response data
    const data = await backendResponse.text();
    
    // Return the response with the same status and headers
    return new Response(data, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ message: 'Proxy error', error: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Proxy handler for GET requests
export async function GET(request: NextRequest) {
  try {
    // Get the target endpoint from the query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ message: 'Missing endpoint parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the authorization header
    const authorizationHeader = request.headers.get('authorization');
    
    // Forward the request to the backend
    const backendUrl = `http://localhost:5001/api${endpoint}`;
    
    console.log('Proxying GET request to:', backendUrl);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authorizationHeader && { 'Authorization': authorizationHeader }),
      },
    });

    // Get the response data
    const data = await backendResponse.text();
    
    // Return the response with the same status and headers
    return new Response(data, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ message: 'Proxy error', error: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}