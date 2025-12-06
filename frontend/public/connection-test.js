// Simple test script to verify frontend-backend connection
async function testConnection() {
  try {
    console.log('Testing connection to backend...');
    
    // Test basic connection
    const response = await fetch('http://localhost:5001');
    const data = await response.json();
    console.log('Basic connection test:', data);
    
    // Test API endpoint (without authentication)
    try {
      const apiResponse = await fetch('http://localhost:5001/api/dashboard');
      const apiData = await apiResponse.json();
      console.log('API endpoint test:', apiData);
    } catch (apiError) {
      console.log('API endpoint test (expected to fail without auth):', apiError.message);
    }
    
    console.log('Connection tests completed.');
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

// Run the test
testConnection();