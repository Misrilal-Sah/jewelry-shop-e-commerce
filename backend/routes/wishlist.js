const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  generateShareLink,
  getSharedWishlist,
  disableShare,
  getShareStatus,
  likeSharedWishlist,
  checkWishlistLike
} = require('../controllers/wishlistController');

// Public route - view shared wishlist (must be before authMiddleware)
router.get('/shared/:shareCode', getSharedWishlist);

// Protected routes
router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.get('/check/:productId', checkWishlist);

// Share management routes (MUST be before /:productId to avoid conflict)
router.post('/share', generateShareLink);
router.get('/share/status', getShareStatus);
router.delete('/share', disableShare);

// Like routes (require auth)
router.post('/shared/:shareCode/like', likeSharedWishlist);
router.get('/shared/:shareCode/like', checkWishlistLike);

// This route must be LAST because /:productId is a wildcard
router.delete('/:productId', removeFromWishlist);

module.exports = router;
