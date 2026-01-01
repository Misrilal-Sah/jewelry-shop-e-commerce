const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadReviewImages } = require('../middleware/uploadMiddleware');
const { uploadFromBuffer } = require('../services/cloudinaryService');
const {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getCategories,
  searchProducts,
  addReview,
  getProductReviews,
  getRecommendations,
  toggleReviewHelpful
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/search', searchProducts);
router.get('/:id', getProduct);
router.get('/:id/reviews', getProductReviews);
router.get('/:id/recommendations', getRecommendations);
router.post('/:id/reviews', authMiddleware, addReview);
router.post('/reviews/:reviewId/helpful', authMiddleware, toggleReviewHelpful);

// Upload review images to Cloudinary (returns array of URLs)
router.post('/reviews/upload-images', authMiddleware, uploadReviewImages, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadPromises = req.files.map(file => 
      uploadFromBuffer(file.buffer, 'reviews', 'review')
    );

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.secure_url);

    res.json({ 
      message: 'Images uploaded successfully',
      images: imageUrls 
    });
  } catch (error) {
    console.error('Review image upload error:', error);
    res.status(500).json({ message: 'Failed to upload images' });
  }
});

module.exports = router;
