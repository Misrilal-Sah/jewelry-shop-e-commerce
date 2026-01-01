const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} = require('../controllers/testimonialController');

// Public route
router.get('/', getTestimonials);

// Admin routes (require auth + admin role)
router.get('/admin', authMiddleware, adminMiddleware, getAllTestimonials);
router.post('/admin', authMiddleware, adminMiddleware, createTestimonial);
router.put('/admin/:id', authMiddleware, adminMiddleware, updateTestimonial);
router.delete('/admin/:id', authMiddleware, adminMiddleware, deleteTestimonial);

module.exports = router;
