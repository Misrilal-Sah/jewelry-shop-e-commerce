const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const {
  getFaqs,
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqCategories
} = require('../controllers/faqController');

// Public routes
router.get('/', getFaqs);
router.get('/categories', getFaqCategories);

// Admin routes
router.get('/admin', authMiddleware, adminMiddleware, requirePermission('faqs', 'view'), getAllFaqs);
router.post('/admin', authMiddleware, adminMiddleware, requirePermission('faqs', 'create'), createFaq);
router.put('/admin/:id', authMiddleware, adminMiddleware, requirePermission('faqs', 'edit'), updateFaq);
router.delete('/admin/:id', authMiddleware, adminMiddleware, requirePermission('faqs', 'delete'), deleteFaq);

module.exports = router;

