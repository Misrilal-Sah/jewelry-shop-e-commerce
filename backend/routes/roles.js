const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/permissionMiddleware');
const {
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
} = require('../controllers/rolesController');

// All routes require authentication
router.use(authMiddleware);

// Get permission template (for role creation UI)
router.get('/template', getPermissionTemplate);

// Get permission presets (Super Admin only)
router.get('/presets', requireSuperAdmin, getPermissionPresets);

// ============================================
// TEMPLATE MANAGEMENT ROUTES (Super Admin only)
// ============================================
router.get('/templates', requireSuperAdmin, getAllTemplates);
router.post('/templates', requireSuperAdmin, createTemplate);
router.put('/templates/:id', requireSuperAdmin, updateTemplate);
router.delete('/templates/:id', requireSuperAdmin, deleteTemplate);

// Get roles the current user can assign
router.get('/assignable', getAssignableRoles);

// Get all roles (Super Admin only)
router.get('/', requireSuperAdmin, getAllRoles);

// Get single role (Super Admin only)
router.get('/:id', requireSuperAdmin, getRoleById);

// Create role (Super Admin only)
router.post('/', requireSuperAdmin, createRole);

// Duplicate role (Super Admin only)
router.post('/:id/duplicate', requireSuperAdmin, duplicateRole);

// Update role (Super Admin only)
router.put('/:id', requireSuperAdmin, updateRole);

// Delete role (Super Admin only)
router.delete('/:id', requireSuperAdmin, deleteRole);

// Assign role to user (requires permission check in controller)
router.post('/assign', assignRoleToUser);

module.exports = router;
