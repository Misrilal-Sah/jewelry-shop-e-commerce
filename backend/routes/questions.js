const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getProductQuestions,
  askQuestion,
  answerQuestion,
  getAllQuestions,
  deleteQuestion,
  deleteAnswer
} = require('../controllers/questionController');

// Public routes
router.get('/products/:id/questions', getProductQuestions);

// Authenticated routes
router.post('/products/:id/questions', authMiddleware, askQuestion);
router.post('/questions/:questionId/answers', authMiddleware, answerQuestion);

// Admin routes
router.get('/admin/questions', authMiddleware, adminMiddleware, getAllQuestions);
router.delete('/admin/questions/:id', authMiddleware, adminMiddleware, deleteQuestion);
router.delete('/admin/answers/:id', authMiddleware, adminMiddleware, deleteAnswer);

module.exports = router;
