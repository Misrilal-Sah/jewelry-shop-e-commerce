const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCoupon
} = require('../controllers/cartController');

router.use(authMiddleware);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeFromCart);
router.delete('/', clearCart);
router.post('/coupon/validate', validateCoupon);

module.exports = router;

