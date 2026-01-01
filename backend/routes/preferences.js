const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getPreferences,
  updatePreferences,
  resetShortcuts
} = require('../controllers/preferencesController');

// All routes require authentication
router.use(authMiddleware);

// Get user preferences
router.get('/', getPreferences);

// Update user preferences
router.put('/', updatePreferences);

// Reset shortcuts to defaults
router.post('/reset-shortcuts', resetShortcuts);

module.exports = router;
