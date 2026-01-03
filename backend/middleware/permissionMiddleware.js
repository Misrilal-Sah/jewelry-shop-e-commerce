const pool = require('../config/db');

/**
 * Permission checking middleware for RBAC
 * Usage: requirePermission('products', 'create')
 */
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      // Super admin bypass - always allow (check role_name from JWT)
      if (req.user && req.user.role_name === 'super_admin') {
        return next();
      }

      // Get user's role and permissions
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const [users] = await pool.query(
        `SELECT u.role_id, r.permissions, r.name as role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }

      const user = users[0];
      
      // If user has no role assigned, deny access
      if (!user.role_id || !user.permissions) {
        return res.status(403).json({ 
          message: 'Access denied. No role assigned.',
          required: { resource, action }
        });
      }

      // Parse permissions JSON
      let permissions;
      try {
        permissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      } catch (e) {
        console.error('Error parsing permissions:', e);
        return res.status(500).json({ message: 'Invalid permissions format' });
      }

      // Check if resource exists in permissions
      const resourcePerms = permissions[resource];
      if (!resourcePerms) {
        return res.status(403).json({ 
          message: `Access denied. No permissions for ${resource}.`,
          required: { resource, action }
        });
      }

      // Check if action is allowed
      if (resourcePerms[action] !== true) {
        return res.status(403).json({ 
          message: `Access denied. Cannot ${action} ${resource}.`,
          required: { resource, action },
          yourPermissions: resourcePerms
        });
      }

      // Store permissions in request for later use
      req.permissions = permissions;
      req.userRole = user.role_name;
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

/**
 * Check if user can assign a specific role
 */
const canAssignRole = (targetRoleId) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      // Get assigner's role and can_assign_roles
      const [users] = await pool.query(
        `SELECT r.can_assign_roles, r.name as role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0 || !users[0].can_assign_roles) {
        return res.status(403).json({ message: 'You cannot assign roles' });
      }

      const canAssign = typeof users[0].can_assign_roles === 'string'
        ? JSON.parse(users[0].can_assign_roles)
        : users[0].can_assign_roles;

      // "all" means can assign any role
      if (canAssign.includes('all')) {
        return next();
      }

      // Get the target role name
      const [targetRoles] = await pool.query(
        'SELECT name FROM roles WHERE id = ?',
        [targetRoleId]
      );

      if (targetRoles.length === 0) {
        return res.status(404).json({ message: 'Target role not found' });
      }

      // Check if target role is in allowed list
      if (!canAssign.includes(targetRoles[0].name)) {
        return res.status(403).json({ 
          message: 'You are not authorized to assign this role',
          allowedRoles: canAssign
        });
      }

      next();
    } catch (error) {
      console.error('Role assignment check error:', error);
      res.status(500).json({ message: 'Role assignment check failed' });
    }
  };
};

/**
 * Require super admin only
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    const [users] = await pool.query(
      `SELECT r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0 || users[0].role_name !== 'super_admin') {
      return res.status(403).json({ message: 'Super Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

/**
 * Get user's permissions (for frontend)
 */
const getUserPermissions = async (userId) => {
  try {
    const [users] = await pool.query(
      `SELECT u.role_id, r.permissions, r.name as role_name, r.display_name, r.can_assign_roles
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0 || !users[0].role_id) {
      return null;
    }

    const user = users[0];
    const permissions = typeof user.permissions === 'string'
      ? JSON.parse(user.permissions)
      : user.permissions;
    
    const canAssign = typeof user.can_assign_roles === 'string'
      ? JSON.parse(user.can_assign_roles)
      : user.can_assign_roles;

    return {
      roleId: user.role_id,
      roleName: user.role_name,
      roleDisplayName: user.display_name,
      permissions,
      canAssignRoles: canAssign
    };
  } catch (error) {
    console.error('Get user permissions error:', error);
    return null;
  }
};

module.exports = {
  requirePermission,
  canAssignRole,
  requireSuperAdmin,
  getUserPermissions
};
