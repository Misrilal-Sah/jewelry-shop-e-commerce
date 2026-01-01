const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

// Subscribe to newsletter
router.post('/subscribe', newsletterController.subscribe);

// Unsubscribe from newsletter (POST for form, GET for email link)
router.post('/unsubscribe', newsletterController.unsubscribe);
router.get('/unsubscribe', newsletterController.unsubscribeFromLink);

module.exports = router;
