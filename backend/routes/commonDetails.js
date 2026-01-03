const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const {
  getPublicSettings,
  getAllSettings,
  updateSettings,
  getPublicCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPublicCollections,
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection
} = require('../controllers/commonDetailsController');

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

// Get all settings for homepage (grouped by category)
router.get('/settings/public', getPublicSettings);

// Get all active categories
router.get('/categories/public', getPublicCategories);

// Get all active collections  
router.get('/collections/public', getPublicCollections);

// ============================================
// ADMIN ROUTES (require auth + admin + permission)
// ============================================

// Settings
router.get('/settings', authMiddleware, adminMiddleware, requirePermission('common_details', 'view'), getAllSettings);
router.put('/settings', authMiddleware, adminMiddleware, requirePermission('common_details', 'edit'), updateSettings);

// Categories
router.get('/categories', authMiddleware, adminMiddleware, requirePermission('common_details', 'view'), getAllCategories);
router.post('/categories', authMiddleware, adminMiddleware, requirePermission('common_details', 'edit'), createCategory);
router.put('/categories/:id', authMiddleware, adminMiddleware, requirePermission('common_details', 'edit'), updateCategory);
router.delete('/categories/:id', authMiddleware, adminMiddleware, requirePermission('common_details', 'edit'), deleteCategory);

// Collections
router.get('/collections', authMiddleware, adminMiddleware, requirePermission('common_details', 'view'), getAllCollections);
router.post('/collections', authMiddleware, adminMiddleware, requirePermission('common_details', 'edit'), createCollection);
router.put('/collections/:id', authMiddleware, adminMiddleware, requirePermission('common_details', 'edit'), updateCollection);
router.delete('/collections/:id', authMiddleware, adminMiddleware, requirePermission('common_details', 'edit'), deleteCollection);

module.exports = router;

