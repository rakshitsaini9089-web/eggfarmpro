const express = require('express');
const router = express.Router();
const { 
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword
} = require('../controllers/userController');
const { ownerOnly, managerOnly } = require('../middleware/rbac');

// Get all users (Owner and Manager only)
router.get('/', managerOnly, getUsers);

// Get user by ID (Owner and Manager can view any user, others can only view themselves)
router.get('/:id', getUserById);

// Create new user (Owner only)
router.post('/', ownerOnly, createUser);

// Update user (Owner can update any user, others can only update themselves)
router.put('/:id', updateUser);

// Delete user (Owner only)
router.delete('/:id', ownerOnly, deleteUser);

// Change password (Any authenticated user)
router.put('/:id/change-password', changePassword);

module.exports = router;