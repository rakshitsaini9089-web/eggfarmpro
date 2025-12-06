// Role-based access control middleware
const User = require('../models/User');

// Check if user has required role
const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      // Get user from database to ensure we have the latest role
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: 'User account is deactivated' });
      }
      
      // Check if user's role is in the allowed roles
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${user.role}` 
        });
      }
      
      // Attach user to request object
      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ message: 'Server error while checking permissions' });
    }
  };
};

// Specific role middlewares
const ownerOnly = checkRole(['owner']);
const managerOnly = checkRole(['owner', 'manager']);
const staffOnly = checkRole(['owner', 'manager', 'staff']);
const auditorOnly = checkRole(['owner', 'auditor']);

// Permission-based middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    // Define role-based permissions
    const permissions = {
      owner: [
        'manage_users',
        'view_all_data',
        'manage_finances',
        'manage_settings',
        'view_audit_trail',
        'generate_reports',
        'manage_inventory',
        'manage_clients',
        'manage_sales',
        'manage_expenses'
      ],
      manager: [
        'view_all_data',
        'manage_finances',
        'view_audit_trail',
        'generate_reports',
        'manage_inventory',
        'manage_clients',
        'manage_sales',
        'manage_expenses'
      ],
      staff: [
        'view_assigned_data',
        'manage_clients',
        'manage_sales',
        'manage_expenses'
      ],
      auditor: [
        'view_all_data',
        'view_audit_trail',
        'generate_reports'
      ]
    };
    
    try {
      // Get user from request (attached by authenticateToken middleware)
      const userRole = req.user.role;
      
      // Check if user has the required permission
      if (!permissions[userRole] || !permissions[userRole].includes(permission)) {
        return res.status(403).json({ 
          message: `Access denied. Required permission: ${permission}` 
        });
      }
      
      next();
    } catch (err) {
      res.status(500).json({ message: 'Server error while checking permissions' });
    }
  };
};

module.exports = {
  checkRole,
  ownerOnly,
  managerOnly,
  staffOnly,
  auditorOnly,
  checkPermission
};