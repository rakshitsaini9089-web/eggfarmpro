const User = require('../models/User');

/**
 * Get all users
 */
async function getUsers(req, res) {
  try {
    // Only owners and managers can view all users
    if (!['owner', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get user by ID
 */
async function getUserById(req, res) {
  try {
    // Users can only view their own profile unless they're owner/manager
    if (req.user.role !== 'owner' && req.user.role !== 'manager' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new user
 */
async function createUser(req, res) {
  try {
    // Only owners can create new users
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Only owners can create new users.' });
    }
    
    const { username, email, password, role, isActive } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists. Please use different credentials.' });
    }
    
    const user = new User({
      username,
      email,
      password,
      role: role || 'staff',
      isActive: isActive !== undefined ? isActive : true
    });
    
    const newUser = await user.save();
    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    });
  } catch (err) {
    // Log the actual error for debugging
    console.error('Error creating user:', err);
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Username or email already exists. Please use different credentials.' });
    }
    
    res.status(400).json({ message: err.message || 'An error occurred while creating the user.' });
  }
}

/**
 * Update user
 */
async function updateUser(req, res) {
  try {
    // Users can update their own profile, owners can update anyone
    if (req.user.role !== 'owner' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Owners can change roles, others cannot
    if (req.body.role && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can change user roles' });
    }
    
    // Prevent users from deactivating themselves
    if (req.user.userId === req.params.id && req.body.isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    
    Object.keys(req.body).forEach(key => {
      // Don't allow password updates through this endpoint
      if (key !== 'password') {
        user[key] = req.body[key];
      }
    });
    
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete user
 */
async function deleteUser(req, res) {
  try {
    // Only owners can delete users
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Prevent users from deleting themselves
    if (req.user.userId === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Change password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Set new password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword
};