const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Auth test server running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Auth test server running on port ${PORT}`);
});