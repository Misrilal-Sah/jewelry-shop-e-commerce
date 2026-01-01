const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Get Razorpay key (public)
router.get('/key', paymentController.getPaymentKey);

// Create payment order (requires auth)
router.post('/create-order', authMiddleware, paymentController.createPaymentOrder);

// Verify payment (requires auth)
router.post('/verify', authMiddleware, paymentController.verifyPayment);

// Get payment details (requires auth)
router.get('/details/:orderId', authMiddleware, paymentController.getPaymentDetails);

// Process refund (admin only)
router.post('/refund/:orderId', authMiddleware, adminMiddleware, paymentController.processRefund);

// Razorpay webhook (no auth - verified by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
