// AI Authentication Middleware
const jwt = require('jsonwebtoken');

/**
 * Middleware to ensure only authenticated users can access AI features
 */
function aiAuthMiddleware(req, res, next) {
  // Check if AI features are enabled
  if (process.env.AI_FEATURES_ENABLED !== 'true') {
    return res.status(403).json({ 
      error: 'AI features are not enabled on this server' 
    });
  }

  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  // Check if token exists
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ 
      error: 'Invalid token' 
    });
  }
}

module.exports = { aiAuthMiddleware };