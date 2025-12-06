const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || 'user'
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Find user by email or username
    const user = await User.findOne({ 
      $or: [{ email: email }, { username: email }] 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }
    
    // Compare passwords
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateProfile(req, res) {
  try {
    const { username, email } = req.body;
    
    // Check if email or username is already taken by another user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: req.user.userId }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email or username already taken' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};