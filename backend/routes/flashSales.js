const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getAllFlashSales,
  getActiveFlashSales,
  getProductFlashSale,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale
} = require('../controllers/flashSaleController');

// Public routes
router.get('/active', getActiveFlashSales);
router.get('/product/:productId', getProductFlashSale);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, getAllFlashSales);
router.post('/', authMiddleware, adminMiddleware, createFlashSale);
router.put('/:id', authMiddleware, adminMiddleware, updateFlashSale);
router.delete('/:id', authMiddleware, adminMiddleware, deleteFlashSale);

module.exports = router;
