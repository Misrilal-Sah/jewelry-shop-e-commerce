const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { uploadReviewImages } = require('../middleware/uploadMiddleware');
const { uploadFromBuffer } = require('../services/cloudinaryService');
const { enhanceProductImage, getAvailableBackgrounds } = require('../services/imageEnhancementService');
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

// Multer for image enhancement uploads
const enhanceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

// ============================================
// IMAGE ENHANCEMENT ENDPOINTS
// ============================================

// Get available backgrounds
router.get('/enhance/backgrounds', (req, res) => {
  res.json(getAvailableBackgrounds());
});

// Enhance product image (remove background + add new background)
router.post('/enhance-image', authMiddleware, adminMiddleware, enhanceUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const { backgroundUrl } = req.body;
    if (!backgroundUrl) {
      return res.status(400).json({ message: 'No background URL provided' });
    }
    
    console.log(`🖼️ Enhancing uploaded image with background URL`);

    // Enhance the image with background from URL
    const enhancedBuffer = await enhanceProductImage(req.file.buffer, backgroundUrl);

    // Upload to Cloudinary
    const uploadResult = await uploadFromBuffer(enhancedBuffer, 'products', 'enhanced');

    res.json({
      message: 'Image enhanced successfully',
      originalSize: req.file.size,
      enhancedUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Image enhancement error:', error);
    res.status(500).json({ 
      message: 'Failed to enhance image',
      error: error.message 
    });
  }
});

// Enhance image from URL (for existing product images)
router.post('/enhance-image-url', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { imageUrl, backgroundUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'No image URL provided' });
    }
    
    if (!backgroundUrl) {
      return res.status(400).json({ message: 'No background URL provided' });
    }

    console.log(`🖼️ Enhancing image with background URL`);

    // Enhance the image with background URL
    const enhancedBuffer = await enhanceProductImage(imageUrl, backgroundUrl);

    // Upload to Cloudinary
    const uploadResult = await uploadFromBuffer(enhancedBuffer, 'products', 'enhanced');

    res.json({
      message: 'Image enhanced successfully',
      originalUrl: imageUrl,
      enhancedUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Image enhancement error:', error);
    res.status(500).json({ 
      message: 'Failed to enhance image',
      error: error.message 
    });
  }
});

module.exports = router;
