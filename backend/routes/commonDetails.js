const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
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
// ADMIN ROUTES (require auth + admin)
// ============================================

// Settings
router.get('/settings', authMiddleware, adminMiddleware, getAllSettings);
router.put('/settings', authMiddleware, adminMiddleware, updateSettings);

// Categories
router.get('/categories', authMiddleware, adminMiddleware, getAllCategories);
router.post('/categories', authMiddleware, adminMiddleware, createCategory);
router.put('/categories/:id', authMiddleware, adminMiddleware, updateCategory);
router.delete('/categories/:id', authMiddleware, adminMiddleware, deleteCategory);

// Collections
router.get('/collections', authMiddleware, adminMiddleware, getAllCollections);
router.post('/collections', authMiddleware, adminMiddleware, createCollection);
router.put('/collections/:id', authMiddleware, adminMiddleware, updateCollection);
router.delete('/collections/:id', authMiddleware, adminMiddleware, deleteCollection);

module.exports = router;
