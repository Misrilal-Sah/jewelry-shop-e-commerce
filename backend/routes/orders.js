const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder
} = require('../controllers/orderController');

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);

module.exports = router;
