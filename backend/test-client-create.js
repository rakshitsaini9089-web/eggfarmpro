const axios = require('axios');

async function testClientCreation() {
  try {
    // Test data
    const clientData = {
      name: 'Test Client Direct API',
      phone: '9876543210',
      ratePerTray: 160
    };
    
    console.log('Sending client data to backend...');
    console.log('Data:', clientData);
    
    // Make POST request to create client
    const response = await axios.post('http://localhost:5001/api/clients', clientData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // If successful, try to retrieve the client
    if (response.status === 201) {
      const getClientResponse = await axios.get(`http://localhost:5001/api/clients/${response.data._id}`);
      console.log('Retrieved client:', getClientResponse.data);
      
      // Clean up - delete the test client
      const deleteResponse = await axios.delete(`http://localhost:5001/api/clients/${response.data._id}`);
      console.log('Delete response:', deleteResponse.status);
    }
  } catch (error) {
    console.error('Full error object:', error);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testClientCreation();