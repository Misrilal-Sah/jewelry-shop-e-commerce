const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  subscribeAlert,
  unsubscribeAlert,
  getUserAlerts,
  checkAlertStatus,
  unsubscribeByProduct
} = require('../controllers/alertController');

// All routes require authentication
router.use(authMiddleware);

// Subscribe to alert
router.post('/', subscribeAlert);

// Get user's alerts
router.get('/', getUserAlerts);

// Check alert status for a product
router.get('/check/:productId', checkAlertStatus);

// Unsubscribe by alert ID
router.delete('/:id', unsubscribeAlert);

// Unsubscribe by product and type
router.delete('/product/:productId/:alertType', unsubscribeByProduct);

module.exports = router;
