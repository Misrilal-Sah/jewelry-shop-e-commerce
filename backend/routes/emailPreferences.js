const express = require('express');
const router = express.Router();
const emailPreferencesController = require('../controllers/emailPreferencesController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get email preferences (requires auth)
router.get('/preferences', authMiddleware, emailPreferencesController.getPreferences);

// Update email preferences (requires auth)
router.put('/preferences', authMiddleware, emailPreferencesController.updatePreferences);

// Send test emails (for testing - will be removed)
router.post('/test', emailPreferencesController.sendTestEmails);

// Send single marketing email
router.post('/send', emailPreferencesController.sendMarketingEmail);

module.exports = router;
