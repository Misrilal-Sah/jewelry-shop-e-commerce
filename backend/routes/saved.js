const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getSavedItems,
  saveForLater,
  moveToCart,
  removeSavedItem,
  clearSavedItems
} = require('../controllers/savedController');

// All routes require authentication
router.use(authMiddleware);

// Get saved items
router.get('/', getSavedItems);

// Save item for later
router.post('/', saveForLater);

// Move item to cart
router.post('/:id/to-cart', moveToCart);

// Remove saved item
router.delete('/:id', removeSavedItem);

// Clear all saved items
router.delete('/', clearSavedItems);

module.exports = router;
