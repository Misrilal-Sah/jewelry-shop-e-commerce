/**
 * Chatbot API Routes
 */
const express = require('express');
const router = express.Router();
const { handleMessage, getQuickActions } = require('../services/chatbotService');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * POST /api/chatbot/message
 * Handle chat message (works for both logged-in and guest users)
 */
router.post('/message', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    // Get user email if authenticated (for order lookup verification)
    let userEmail = null;
    
    // Try to extract user from token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userEmail = decoded.email;
      } catch (err) {
        // Token invalid or expired, continue as guest
      }
    }
    
    const result = await handleMessage(message, history, userEmail);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({
      success: false,
      response: "I'm having trouble right now. Please try again in a moment.",
      type: 'error'
    });
  }
});

/**
 * GET /api/chatbot/quick-actions
 * Get quick action suggestions
 */
router.get('/quick-actions', (req, res) => {
  res.json({
    success: true,
    actions: getQuickActions()
  });
});

/**
 * GET /api/chatbot/health
 * Check chatbot service health
 */
router.get('/health', async (req, res) => {
  const status = {
    service: 'online',
    groq: !!process.env.GROQ_API_KEY,
    openrouter1: !!process.env.OPENROUTER_KEY_1,
    openrouter2: !!process.env.OPENROUTER_KEY_2
  };
  
  res.json({
    success: true,
    status
  });
});

module.exports = router;
