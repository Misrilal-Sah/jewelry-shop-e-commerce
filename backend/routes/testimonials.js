const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
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

// Admin routes (require auth + admin role)
router.get('/admin', authMiddleware, adminMiddleware, getAllTestimonials);
router.post('/admin', authMiddleware, adminMiddleware, createTestimonial);
router.put('/admin/:id', authMiddleware, adminMiddleware, updateTestimonial);
router.delete('/admin/:id', authMiddleware, adminMiddleware, deleteTestimonial);

module.exports = router;
