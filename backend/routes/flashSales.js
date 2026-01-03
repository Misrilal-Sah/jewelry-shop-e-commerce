const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
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
router.get('/', authMiddleware, adminMiddleware, requirePermission('flash_sales', 'view'), getAllFlashSales);
router.post('/', authMiddleware, adminMiddleware, requirePermission('flash_sales', 'create'), createFlashSale);
router.put('/:id', authMiddleware, adminMiddleware, requirePermission('flash_sales', 'edit'), updateFlashSale);
router.delete('/:id', authMiddleware, adminMiddleware, requirePermission('flash_sales', 'delete'), deleteFlashSale);

module.exports = router;

