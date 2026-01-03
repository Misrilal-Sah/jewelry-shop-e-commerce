const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
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
  validateUserEmail,
  updateAdminRole,
  getCategorySales,
  getTopProducts,
  getOrderStatusStats
} = require('../controllers/adminController');

// All admin routes require auth and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get('/dashboard', requirePermission('dashboard', 'view'), getDashboardStats);

// Products
router.get('/products', requirePermission('products', 'view'), getAllProducts);
router.get('/products/:id', requirePermission('products', 'view'), getProductById);
router.post('/products', requirePermission('products', 'create'), createProduct);
router.put('/products/:id', requirePermission('products', 'edit'), updateProduct);
router.delete('/products/:id', requirePermission('products', 'delete'), deleteProduct);

// Image upload (requires products edit permission)
router.post('/products/:id/images', requirePermission('products', 'edit'), uploadProductImages, uploadImages);
router.delete('/products/:id/images/:index', requirePermission('products', 'edit'), deleteImage);

// Orders
router.get('/orders', requirePermission('orders', 'view'), getAllOrders);
router.get('/orders/:id', requirePermission('orders', 'view'), getOrderById);
router.put('/orders/:id/status', requirePermission('orders', 'update_status'), updateOrderStatus);

// Customers
router.get('/customers', requirePermission('customers', 'view'), getCustomers);

// Recalculate customer segments
const { updateAllCustomerSegments } = require('../services/customerSegmentationService');
router.post('/customers/recalculate-segments', requirePermission('customers', 'edit'), async (req, res) => {
  try {
    const result = await updateAllCustomerSegments();
    res.json(result);
  } catch (error) {
    console.error('Recalculate segments error:', error);
    res.status(500).json({ message: 'Failed to recalculate segments' });
  }
});

// Reports
router.get('/reports/sales', requirePermission('reports', 'view'), getSalesReport);
router.get('/reports/categories', requirePermission('reports', 'view'), getCategorySales);
router.get('/reports/top-products', requirePermission('reports', 'view'), getTopProducts);
router.get('/reports/order-status', requirePermission('reports', 'view'), getOrderStatusStats);

// Reviews (uses products permission)
router.get('/reviews/pending', requirePermission('products', 'view'), getPendingReviews);
router.post('/reviews/:id/approve', requirePermission('products', 'edit'), approveReview);
router.delete('/reviews/:id', requirePermission('products', 'delete'), deleteReview);

// Coupons
router.get('/coupons', requirePermission('coupons', 'view'), getCoupons);
router.post('/coupons', requirePermission('coupons', 'create'), createCoupon);
router.put('/coupons/:id', requirePermission('coupons', 'edit'), updateCoupon);
router.delete('/coupons/:id', requirePermission('coupons', 'delete'), deleteCoupon);
router.patch('/coupons/:id/toggle', requirePermission('coupons', 'edit'), toggleCouponStatus);

// Admin User Management
router.get('/users', requirePermission('users', 'view'), getAdmins);
router.get('/users/validate', requirePermission('users', 'create'), validateUserEmail);
router.post('/users/promote', requirePermission('users', 'create'), promoteToAdmin);
router.put('/users/:id/role', requirePermission('users', 'edit'), updateAdminRole);
router.delete('/users/:id', requirePermission('users', 'delete'), demoteAdmin);

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

// Test Birthday/Anniversary Scheduler (Admin only)
const { sendBirthdayEmails, sendAnniversaryEmails } = require('../scheduler/birthdayScheduler');
const pool = require('../config/db');

router.post('/test-birthday', async (req, res) => {
  try {
    const { email, type = 'birthday' } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Update user's birthday/anniversary to today for testing
    const today = new Date();
    
    if (type === 'birthday') {
      await pool.query('UPDATE users SET birthday = ? WHERE email = ?', [today, email]);
      console.log(`🧪 Test: Updated ${email} birthday to today`);
      
      // Run birthday scheduler
      const count = await sendBirthdayEmails();
      
      res.json({ 
        success: true, 
        message: `Birthday test completed! Sent ${count} email(s) and notification(s)`,
        details: {
          email,
          type: 'birthday',
          emailsSent: count,
          notificationCreated: count > 0
        }
      });
    } else {
      await pool.query('UPDATE users SET anniversary = ? WHERE email = ?', [today, email]);
      console.log(`🧪 Test: Updated ${email} anniversary to today`);
      
      // Run anniversary scheduler
      const count = await sendAnniversaryEmails();
      
      res.json({ 
        success: true, 
        message: `Anniversary test completed! Sent ${count} email(s) and notification(s)`,
        details: {
          email,
          type: 'anniversary',
          emailsSent: count,
          notificationCreated: count > 0
        }
      });
    }
  } catch (error) {
    console.error('Test birthday error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test failed', 
      error: error.message 
    });
  }
});

module.exports = router;

