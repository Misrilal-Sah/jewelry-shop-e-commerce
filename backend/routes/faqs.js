const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
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
router.get('/admin', authMiddleware, adminMiddleware, getAllFaqs);
router.post('/admin', authMiddleware, adminMiddleware, createFaq);
router.put('/admin/:id', authMiddleware, adminMiddleware, updateFaq);
router.delete('/admin/:id', authMiddleware, adminMiddleware, deleteFaq);

module.exports = router;
