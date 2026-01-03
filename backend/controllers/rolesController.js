const pool = require('../config/db');
const auditLogger = require('../services/auditLogger');

// ============================================
// GET ALL ROLES
// ============================================
const getAllRoles = async (req, res) => {
  try {
    const [roles] = await pool.query(
      'SELECT * FROM roles ORDER BY is_system DESC, created_at ASC'
    );

    // Parse JSON fields
    const parsedRoles = roles.map(role => ({
      ...role,
      permissions: typeof role.permissions === 'string' 
        ? JSON.parse(role.permissions) 
        : role.permissions,
      can_assign_roles: typeof role.can_assign_roles === 'string'
        ? JSON.parse(role.can_assign_roles)
        : role.can_assign_roles
    }));

    res.json({ roles: parsedRoles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// GET SINGLE ROLE
// ============================================
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [roles] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const role = roles[0];
    res.json({
      ...role,
      permissions: typeof role.permissions === 'string' 
        ? JSON.parse(role.permissions) 
        : role.permissions,
      can_assign_roles: typeof role.can_assign_roles === 'string'
        ? JSON.parse(role.can_assign_roles)
        : role.can_assign_roles
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// CREATE ROLE (Super Admin only)
// ============================================
const createRole = async (req, res) => {
  try {
    const { name, display_name, description, permissions, can_assign_roles } = req.body;

    // Validate required fields
    if (!name || !display_name || !permissions) {
      return res.status(400).json({ message: 'Name, display name, and permissions are required' });
    }

    // Check if role name already exists
    const [existing] = await pool.query('SELECT id FROM roles WHERE name = ?', [name.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Role name already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO roles (name, display_name, description, permissions, can_assign_roles, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.toLowerCase().replace(/\s+/g, '_'),
        display_name,
        description || null,
        JSON.stringify(permissions),
        JSON.stringify(can_assign_roles || []),
        req.user.id
      ]
    );

    // Audit log
    auditLogger.create(
      req.user.id,
      req.user.name,
      'ROLE',
      result.insertId,
      `Created role: ${display_name}`,
      { name, display_name, permissions },
      req
    );

    res.status(201).json({
      message: 'Role created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// UPDATE ROLE (Super Admin only)
// ============================================
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, description, permissions, can_assign_roles } = req.body;

    // Check if role exists
    const [existing] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const oldRole = existing[0];

    // Prevent editing system role name
    const updates = [];
    const values = [];

    if (display_name) {
      updates.push('display_name = ?');
      values.push(display_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (permissions) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(permissions));
    }
    if (can_assign_roles !== undefined) {
      updates.push('can_assign_roles = ?');
      values.push(JSON.stringify(can_assign_roles));
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, values);

    // Audit log
    auditLogger.update(
      req.user.id,
      req.user.name,
      'ROLE',
      parseInt(id),
      `Updated role: ${oldRole.display_name}`,
      { permissions: oldRole.permissions },
      { permissions },
      req
    );

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// DELETE ROLE (Super Admin only)
// ============================================
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists and is not system role
    const [existing] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (existing[0].is_system) {
      return res.status(400).json({ message: 'Cannot delete system roles' });
    }

    // Check if any users have this role
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [id]);
    if (users[0].count > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. ${users[0].count} user(s) are assigned to this role.`
      });
    }

    await pool.query('DELETE FROM roles WHERE id = ?', [id]);

    // Audit log
    auditLogger.delete(
      req.user.id,
      req.user.name,
      'ROLE',
      parseInt(id),
      `Deleted role: ${existing[0].display_name}`,
      { name: existing[0].name, display_name: existing[0].display_name },
      req
    );

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// GET ASSIGNABLE ROLES (for current user)
// ============================================
const getAssignableRoles = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's can_assign_roles
    const [users] = await pool.query(
      `SELECT r.can_assign_roles
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0 || !users[0].can_assign_roles) {
      return res.json({ roles: [] });
    }

    const canAssign = typeof users[0].can_assign_roles === 'string'
      ? JSON.parse(users[0].can_assign_roles)
      : users[0].can_assign_roles;

    // If "all", return all roles except super_admin (which can only be assigned via database)
    if (canAssign.includes('all')) {
      const [allRoles] = await pool.query(
        'SELECT id, name, display_name FROM roles WHERE name != ? ORDER BY display_name',
        ['super_admin']
      );
      return res.json({ roles: allRoles });
    }

    // Otherwise, return only allowed roles
    if (canAssign.length === 0) {
      return res.json({ roles: [] });
    }

    const [roles] = await pool.query(
      `SELECT id, name, display_name FROM roles WHERE name IN (?) ORDER BY display_name`,
      [canAssign]
    );

    res.json({ roles });
  } catch (error) {
    console.error('Get assignable roles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// ASSIGN ROLE TO USER
// ============================================
const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({ message: 'User ID and Role ID are required' });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT id, name, role_id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if role exists
    const [roles] = await pool.query('SELECT id, name, display_name FROM roles WHERE id = ?', [roleId]);
    if (roles.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const oldRoleId = users[0].role_id;

    // Update user's role
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, userId]);

    // Audit log
    auditLogger.update(
      req.user.id,
      req.user.name,
      'USER_ROLE',
      parseInt(userId),
      `Assigned role "${roles[0].display_name}" to user: ${users[0].name}`,
      { role_id: oldRoleId },
      { role_id: roleId, role_name: roles[0].name },
      req
    );

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// GET PERMISSION TEMPLATE (empty permissions object)
// ============================================
const getPermissionTemplate = async (req, res) => {
  const template = {
    dashboard: { view: false },
    products: { view: false, create: false, edit: false, delete: false },
    orders: { view: false, update_status: false, delete: false },
    customers: { view: false, edit: false, delete: false },
    coupons: { view: false, create: false, edit: false, delete: false },
    flash_sales: { view: false, create: false, edit: false, delete: false },
    bulk_orders: { view: false, update_status: false, delete: false },
    testimonials: { view: false, create: false, edit: false, delete: false },
    faqs: { view: false, create: false, edit: false, delete: false },
    blog: { view: false, create: false, edit: false, delete: false },
    reports: { view: false },
    email: { view: false, send: false },
    users: { view: false, create: false, edit: false, delete: false },
    common_details: { view: false, edit: false },
    logs: { view: false },
    roles: { view: false, create: false, edit: false, delete: false }
  };

  res.json({ template });
};

// ============================================
// GET PERMISSION PRESETS (from database)
// ============================================
const getPermissionPresets = async (req, res) => {
  try {
    const [templates] = await pool.query(
      'SELECT * FROM permission_templates ORDER BY is_default DESC, display_name ASC'
    );

    // Convert to the format expected by frontend: { key: { name, description, permissions } }
    const presets = {};
    templates.forEach(t => {
      presets[t.name] = {
        id: t.id,
        name: t.display_name,
        description: t.description,
        permissions: typeof t.permissions === 'string' ? JSON.parse(t.permissions) : t.permissions,
        isDefault: t.is_default
      };
    });

    res.json({ presets });
  } catch (error) {
    console.error('Get presets error:', error);
    res.status(500).json({ message: 'Failed to fetch presets' });
  }
};

// ============================================
// GET ALL TEMPLATES (for template management)
// ============================================
const getAllTemplates = async (req, res) => {
  try {
    const [templates] = await pool.query(
      'SELECT * FROM permission_templates ORDER BY is_default DESC, display_name ASC'
    );

    const parsed = templates.map(t => ({
      ...t,
      permissions: typeof t.permissions === 'string' ? JSON.parse(t.permissions) : t.permissions
    }));

    res.json({ templates: parsed });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
};

// ============================================
// CREATE TEMPLATE (Super Admin only)
// ============================================
const createTemplate = async (req, res) => {
  try {
    const { name, display_name, description, permissions } = req.body;

    if (!name || !display_name || !permissions) {
      return res.status(400).json({ message: 'Name, display name, and permissions are required' });
    }

    // Check for duplicate name
    const normalizedName = name.toLowerCase().replace(/\s+/g, '_');
    const [existing] = await pool.query('SELECT id FROM permission_templates WHERE name = ?', [normalizedName]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Template name already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO permission_templates (name, display_name, description, permissions, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        normalizedName,
        display_name,
        description || null,
        JSON.stringify(permissions),
        req.user.id
      ]
    );

    // Audit log
    auditLogger.create(
      req.user.id,
      req.user.name,
      'TEMPLATE',
      result.insertId,
      `Created permission template: ${display_name}`,
      { name: normalizedName, display_name },
      req
    );

    res.status(201).json({
      message: 'Template created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
};

// ============================================
// UPDATE TEMPLATE (Super Admin only)
// ============================================
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, description, permissions } = req.body;

    // Check if template exists
    const [existing] = await pool.query('SELECT * FROM permission_templates WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const updates = [];
    const values = [];

    if (display_name) {
      updates.push('display_name = ?');
      values.push(display_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (permissions) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE permission_templates SET ${updates.join(', ')} WHERE id = ?`, values);

    // Audit log
    auditLogger.update(
      req.user.id,
      req.user.name,
      'TEMPLATE',
      parseInt(id),
      `Updated permission template: ${existing[0].display_name}`,
      { permissions: existing[0].permissions },
      { permissions },
      req
    );

    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
};

// ============================================
// DELETE TEMPLATE (Super Admin only)
// ============================================
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const [existing] = await pool.query('SELECT * FROM permission_templates WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Templates can now be deleted (including defaults)

    await pool.query('DELETE FROM permission_templates WHERE id = ?', [id]);

    // Audit log
    auditLogger.delete(
      req.user.id,
      req.user.name,
      'TEMPLATE',
      parseInt(id),
      `Deleted permission template: ${existing[0].display_name}`,
      { name: existing[0].name, display_name: existing[0].display_name },
      req
    );

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
};


// ============================================
// DUPLICATE ROLE
// ============================================
const duplicateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_name, description } = req.body;

    // Validate required fields
    if (!name || !display_name) {
      return res.status(400).json({ message: 'Name and display name are required' });
    }

    // Get source role
    const [sourceRoles] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (sourceRoles.length === 0) {
      return res.status(404).json({ message: 'Source role not found' });
    }

    const sourceRole = sourceRoles[0];

    // Check if new role name already exists
    const normalizedName = name.toLowerCase().replace(/\s+/g, '_');
    const [existing] = await pool.query('SELECT id FROM roles WHERE name = ?', [normalizedName]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Role name already exists' });
    }

    // Create new role with cloned permissions
    // Ensure permissions is a JSON string
    const permissionsStr = typeof sourceRole.permissions === 'string' 
      ? sourceRole.permissions 
      : JSON.stringify(sourceRole.permissions);
    
    const [result] = await pool.query(
      `INSERT INTO roles (name, display_name, description, permissions, can_assign_roles, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        normalizedName,
        display_name,
        description || `Duplicated from ${sourceRole.display_name}`,
        permissionsStr,
        '[]', // Start with no assignable roles
        req.user.id
      ]
    );

    // Audit log
    auditLogger.create(
      req.user.id,
      req.user.name,
      'ROLE',
      result.insertId,
      `Duplicated role "${sourceRole.display_name}" as "${display_name}"`,
      { source_role_id: id, source_role_name: sourceRole.name },
      req
    );

    res.status(201).json({
      message: 'Role duplicated successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Duplicate role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAssignableRoles,
  assignRoleToUser,
  getPermissionTemplate,
  getPermissionPresets,
  duplicateRole,
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
