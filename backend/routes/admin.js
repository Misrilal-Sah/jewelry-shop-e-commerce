const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { uploadProductImages } = require('../middleware/uploadMiddleware');
const {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  uploadImages,
  deleteImage,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getCustomers,
  getSalesReport,
  getPendingReviews,
  approveReview,
  deleteReview,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getAdmins,
  promoteToAdmin,
  demoteAdmin,
  validateUserEmail
} = require('../controllers/adminController');

// All admin routes require auth and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Image upload
router.post('/products/:id/images', uploadProductImages, uploadImages);
router.delete('/products/:id/images/:index', deleteImage);

// Orders
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);

// Customers
router.get('/customers', getCustomers);

// Recalculate customer segments
const { updateAllCustomerSegments } = require('../services/customerSegmentationService');
router.post('/customers/recalculate-segments', async (req, res) => {
  try {
    const result = await updateAllCustomerSegments();
    res.json(result);
  } catch (error) {
    console.error('Recalculate segments error:', error);
    res.status(500).json({ message: 'Failed to recalculate segments' });
  }
});

// Reports
router.get('/reports/sales', getSalesReport);

// Reviews
router.get('/reviews/pending', getPendingReviews);
router.post('/reviews/:id/approve', approveReview);
router.delete('/reviews/:id', deleteReview);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.patch('/coupons/:id/toggle', toggleCouponStatus);

// Admin User Management
router.get('/users', getAdmins);
router.get('/users/validate', validateUserEmail);
router.post('/users/promote', promoteToAdmin);
router.delete('/users/:id', demoteAdmin);

// Generic Image Upload (for testimonials, blog, etc.)
const multer = require('multer');
const { uploadFromBuffer, extractPublicId, deleteImage: deleteCloudinaryImage } = require('../services/cloudinaryService');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }
    
    const folder = req.body.folder || 'others';
    const prefix = req.body.prefix || 'img';
    const result = await uploadFromBuffer(req.file.buffer, folder, prefix);
    
    res.json({ 
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Delete image from Cloudinary
router.post('/delete-image', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'No URL provided' });
    }
    
    const publicId = extractPublicId(url);
    if (!publicId) {
      return res.status(400).json({ message: 'Invalid Cloudinary URL' });
    }
    
    await deleteCloudinaryImage(publicId);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

module.exports = router;
