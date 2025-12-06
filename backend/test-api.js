const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'API test successful' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test API server running on port ${PORT}`);
});