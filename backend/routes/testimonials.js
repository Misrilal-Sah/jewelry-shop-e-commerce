const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const {
  getTestimonials,
  getAllTestimonials,
  submitTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} = require('../controllers/testimonialController');

// Public route - get approved testimonials for homepage
router.get('/', getTestimonials);

// Customer submission route (requires auth, not admin)
router.post('/submit', authMiddleware, submitTestimonial);

// Admin routes (require auth + admin role + permission)
router.get('/admin', authMiddleware, adminMiddleware, requirePermission('testimonials', 'view'), getAllTestimonials);
router.post('/admin', authMiddleware, adminMiddleware, requirePermission('testimonials', 'create'), createTestimonial);
router.put('/admin/:id', authMiddleware, adminMiddleware, requirePermission('testimonials', 'edit'), updateTestimonial);
router.delete('/admin/:id', authMiddleware, adminMiddleware, requirePermission('testimonials', 'delete'), deleteTestimonial);

module.exports = router;

