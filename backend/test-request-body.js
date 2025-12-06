const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Test endpoint to see what data is received
app.post('/test-body', (req, res) => {
  console.log('Received request body:', req.body);
  console.log('Email field:', req.body.email);
  console.log('Type of email field:', typeof req.body.email);
  res.json({ received: req.body });
});

app.listen(3003, () => {
  console.log('Test server running on port 3003');
});