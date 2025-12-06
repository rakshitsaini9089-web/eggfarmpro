const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin() {
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      }),
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();