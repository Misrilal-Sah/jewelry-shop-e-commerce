const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const debug = require('../utils/logger');
const { sendOrderStatusSMS } = require('../services/smsService');
const auditLogger = require('../services/auditLogger');

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalOrders] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [totalRevenue] = await pool.query('SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"');
    const [totalProducts] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [totalCustomers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
    const [pendingOrders] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status IN ("placed", "confirmed")');
    const [lowStock] = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock < 5 AND is_active = TRUE');

    // Recent orders
    const [recentOrders] = await pool.query(
      `SELECT o.*, u.name as customer_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC LIMIT 5`
    );

    // Top selling products
    const [topProducts] = await pool.query(
      `SELECT p.id, p.name, p.images, SUM(oi.quantity) as sold
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       GROUP BY p.id
       ORDER BY sold DESC LIMIT 5`
    );

    res.json({
      stats: {
        totalOrders: totalOrders[0].count,
        totalRevenue: totalRevenue[0].total || 0,
        totalProducts: totalProducts[0].count,
        totalCustomers: totalCustomers[0].count,
        pendingOrders: pendingOrders[0].count,
        lowStock: lowStock[0].count
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Product CRUD
const createProduct = async (req, res) => {
  try {
    const {
      name, description, category, collection, metal_type, purity,
      weight_grams, metal_price, making_charges, gst_percent,
      gemstone_type, stock, images, sizes, is_featured,
      is_new, is_bestseller, is_limited
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO products (name, description, category, collection, metal_type, purity,
       weight_grams, metal_price, making_charges, gst_percent, gemstone_type, stock, images, sizes, is_featured, is_new, is_bestseller, is_limited)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, category, collection, metal_type, purity,
       weight_grams, metal_price, making_charges, gst_percent || 3,
       gemstone_type, stock || 0, JSON.stringify(images), JSON.stringify(sizes), is_featured || false,
       is_new || false, is_bestseller || false, is_limited || false]
    );

    // Audit log
    auditLogger.create(req.user.id, req.user.name, 'PRODUCT', result.insertId, `Created product: ${name}`, { name, category, metal_type }, req);
    
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('=== UPDATE PRODUCT DEBUG ===');
    console.log('Product ID:', id);
    console.log('Update payload:', updates);

    // Fetch old product data BEFORE update (for alert triggers)
    const [oldProducts] = await pool.query(
      'SELECT stock, metal_price, making_charges FROM products WHERE id = ?',
      [id]
    );
    const oldData = oldProducts[0] || {};

    // Define allowed fields (must match database columns)
    const allowedFields = [
      'name', 'description', 'category', 'collection', 'metal_type', 'purity',
      'weight_grams', 'metal_price', 'making_charges', 'gst_percent',
      'gemstone_type', 'stock', 'images', 'sizes', 'is_featured', 'is_active',
      'is_new', 'is_bestseller', 'is_limited'
    ];
    
    // Filter to only allowed fields
    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    console.log('Filtered updates:', Object.keys(filteredUpdates));

    if (filteredUpdates.images) filteredUpdates.images = JSON.stringify(filteredUpdates.images);
    if (filteredUpdates.sizes) filteredUpdates.sizes = JSON.stringify(filteredUpdates.sizes);

    const fields = Object.keys(filteredUpdates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(filteredUpdates);
    
    if (fields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    console.log('SQL Fields:', fields);
    console.log('Values count:', values.length);

    await pool.query(`UPDATE products SET ${fields} WHERE id = ?`, [...values, id]);
    console.log('Product updated successfully');

    // Trigger alerts for stock replenishment and price drops
    try {
      const { checkAndTriggerAlerts } = require('../services/alertTriggerService');
      const alertResults = await checkAndTriggerAlerts(id, oldData, filteredUpdates);
      console.log('Alert trigger results:', alertResults);
    } catch (alertError) {
      console.error('Alert trigger error (non-blocking):', alertError.message);
    }

    // Audit log the product update
    const [updatedProduct] = await pool.query('SELECT name FROM products WHERE id = ?', [id]);
    const productName = updatedProduct[0]?.name || 'Unknown';
    auditLogger.update(
      req.user.id, 
      req.user.name, 
      'PRODUCT', 
      parseInt(id), 
      `Updated product: ${productName}`, 
      oldData, 
      filteredUpdates, 
      req
    );

    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error('Update product error:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { permanent } = req.query;
    const productId = req.params.id;
    
    debug.log('=== DELETE PRODUCT ===');
    debug.log('Product ID:', productId);
    debug.log('Permanent param:', permanent);
    debug.log('Query params:', req.query);
    
    if (permanent === 'true') {
      // Hard delete - permanently remove from database
      debug.log('Performing HARD DELETE');
      const [result] = await pool.query('DELETE FROM products WHERE id = ?', [productId]);
      debug.log('Delete result:', result);
      auditLogger.delete(req.user.id, req.user.name, 'PRODUCT', productId, `Permanently deleted product #${productId}`, null, req);
      res.json({ message: 'Product permanently deleted' });
    } else {
      // Soft delete - just set inactive
      debug.log('Performing SOFT DELETE');
      await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [productId]);
      auditLogger.update(req.user.id, req.user.name, 'PRODUCT', productId, `Deactivated product #${productId}`, { is_active: true }, { is_active: false }, req);
      res.json({ message: 'Product set to inactive' });
    }
  } catch (error) {
    debug.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeInactive = 'false', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    debug.log('=== GET ALL PRODUCTS ===');
    debug.log('Query params:', req.query);
    debug.log('includeInactive:', includeInactive);
    debug.log('sortBy:', sortBy, 'sortOrder:', sortOrder);
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Validate sort columns to prevent SQL injection
    const validSortColumns = ['name', 'category', 'metal_type', 'metal_price', 'stock', 'is_active', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Build WHERE clause based on includeInactive
    const whereClause = includeInactive === 'true' ? '' : 'WHERE is_active = TRUE';
    
    debug.log('WHERE clause:', whereClause);
    debug.log('Sort:', sortColumn, order);
    
    const [products] = await pool.query(
      `SELECT * FROM products ${whereClause} ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`
    );

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ product: products[0] });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload product images to Cloudinary
const uploadImages = async (req, res) => {
  const { uploadFromBuffer, deleteImages, extractPublicId } = require('../services/cloudinaryService');
  
  try {
    const productId = req.params.id;
    
    console.log('Upload images request - Product ID:', productId);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    
    console.log('Files received:', req.files.length);
    
    // Get current product images (max 5)
    const [products] = await pool.query('SELECT images FROM products WHERE id = ?', [productId]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Parse current images - handle both string and array formats
    let currentImages = [];
    const imagesData = products[0].images;
    
    if (imagesData) {
      try {
        currentImages = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
        if (!Array.isArray(currentImages)) currentImages = [];
      } catch (e) {
        console.error('Error parsing existing images:', e);
        currentImages = [];
      }
    }
    
    console.log('Current images count:', currentImages.length);
    
    // Upload new images to Cloudinary
    const newImages = [];
    
    for (const file of req.files) {
      try {
        console.log('Uploading to Cloudinary:', file.originalname);
        const result = await uploadFromBuffer(file.buffer, 'products');
        newImages.push(result.secure_url);
        console.log('Uploaded successfully:', result.secure_url);
      } catch (uploadError) {
        console.error('Failed to upload file:', uploadError.message);
      }
    }
    
    console.log('New Cloudinary images:', newImages);
    
    // Combine and limit to 5 images
    const allImages = [...currentImages, ...newImages].slice(0, 5);
    
    console.log('All images (combined):', allImages.length);
    
    // Update database with Cloudinary URLs
    await pool.query('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(allImages), productId]);
    
    res.json({ 
      message: 'Images uploaded successfully',
      images: allImages
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Delete product image
const deleteImage = async (req, res) => {
  const { deleteImage: deleteFromCloudinary, extractPublicId } = require('../services/cloudinaryService');
  
  try {
    const { id, index } = req.params;
    const imageIndex = parseInt(index);
    
    debug.log('=== DELETE IMAGE REQUEST ===');
    debug.log('Product ID:', id, 'Index:', imageIndex);
    
    // Get current product images
    const [products] = await pool.query('SELECT images FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      debug.log('Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let images = [];
    const imagesData = products[0].images;
    debug.log('Raw images data from DB:', imagesData);
    
    if (imagesData) {
      try {
        images = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
        if (!Array.isArray(images)) images = [];
      } catch (e) {
        debug.error('Error parsing images:', e.message);
        images = [];
      }
    }
    
    debug.log('Parsed images array:', images);
    
    if (images.length === 0) {
      debug.log('No images to delete');
      return res.status(400).json({ message: 'No images to delete' });
    }
    
    if (imageIndex < 0 || imageIndex >= images.length) {
      debug.log('Invalid index:', imageIndex, 'Total:', images.length);
      return res.status(400).json({ message: `Invalid image index: ${imageIndex}. Total images: ${images.length}` });
    }
    
    // Get the image URL to delete
    const imageUrl = images[imageIndex];
    debug.log('Image to delete:', imageUrl);
    
    // Delete from Cloudinary if it's a Cloudinary URL
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
          debug.log('Deleted from Cloudinary:', publicId);
        } catch (cloudinaryError) {
          debug.error('Cloudinary delete failed:', cloudinaryError.message);
          // Continue anyway to remove from database
        }
      }
    } else if (imageUrl) {
      // Delete local file if it's a local path
      const imagePath = path.join(__dirname, '..', imageUrl);
      debug.log('Deleting local file:', imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        debug.log('Local file deleted');
      }
    }
    
    // Remove from array
    const deletedImage = images.splice(imageIndex, 1);
    debug.log('Deleted image:', deletedImage);
    debug.log('Remaining images:', images);
    
    // Update database
    const updateQuery = 'UPDATE products SET images = ? WHERE id = ?';
    const updateValues = [JSON.stringify(images), id];
    debug.log('SQL Query:', updateQuery);
    debug.log('SQL Values:', updateValues);
    
    const [result] = await pool.query(updateQuery, updateValues);
    
    debug.log('DB Update Result - Affected rows:', result.affectedRows);
    debug.log('DB Update Result - Changed rows:', result.changedRows);
    debug.log('=== DELETE IMAGE COMPLETE ===');
    
    res.json({ 
      message: 'Image deleted successfully',
      images: images
    });
  } catch (error) {
    debug.error('Delete image error:', error.message);
    debug.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Order management
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate sort columns
    const validSortColumns = ['order_number', 'customer_name', 'created_at', 'total_amount', 'status'];
    const sortColumn = validSortColumns.includes(sortBy) ? (sortBy === 'customer_name' ? 'u.name' : `o.${sortBy}`) : 'o.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE o.status = ?';
      params.push(status);
    }

    // Get orders with sorting
    const query = `SELECT o.*, u.name as customer_name, u.email as customer_email
                   FROM orders o JOIN users u ON o.user_id = u.id
                   ${whereClause}
                   ORDER BY ${sortColumn} ${order}
                   LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [orders] = await pool.query(query, params);

    // Get total count
    const countParams = status ? [status] : [];
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      countParams
    );

    res.json({ 
      orders,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [orderResult] = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM orders o JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`, 
      [id]
    );
    
    if (orderResult.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orderResult[0];
    
    // Get items
    const [items] = await pool.query(
      `SELECT oi.*, p.images 
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [id]
    );
    
    order.items = items;

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const validStatuses = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get order details for SMS
    const [orders] = await pool.query(
      `SELECT o.id, o.total_amount, o.user_id, u.name as customer_name, u.phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Get old status for audit
    const [oldOrder] = await pool.query('SELECT status FROM orders WHERE id = ?', [orderId]);
    const oldStatus = oldOrder[0]?.status;
    
    // Update status
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    
    // Audit log
    auditLogger.statusChange(req.user.id, req.user.name, 'ORDER', orderId, `Order #${orderId} status: ${oldStatus} → ${status}`, { status: oldStatus }, { status }, req);

    // Send SMS notification (non-blocking)
    if (order.phone) {
      sendOrderStatusSMS(order.phone, {
        orderId: orderId,
        customerName: order.customer_name,
        totalAmount: order.total_amount
      }, status).then(result => {
        if (result.success) {
          console.log(`📱 SMS sent for order #${orderId} status: ${status}`);
        } else {
          console.log(`⚠️ SMS failed for order #${orderId}:`, result.error);
        }
      }).catch(err => {
        console.error('SMS error:', err);
      });
    }

    res.json({ message: 'Order status updated', smsSent: !!order.phone });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Customer management
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate sort parameters
    const validSortColumns = ['name', 'email', 'created_at', 'order_count', 'total_spent'];
    const sortColumn = validSortColumns.includes(sortBy) ? 
      (sortBy === 'name' || sortBy === 'email' ? `u.${sortBy}` : sortBy) : 'u.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [customers] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, u.profile_image,
       COUNT(o.id) as order_count, COALESCE(SUM(o.total_amount), 0) as total_spent
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY ${sortColumn} ${order}
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users WHERE role = 'customer'`
    );

    res.json({ 
      customers,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reports
const getSalesReport = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    let groupBy, dateFormat, orderBy;
    switch (period) {
      case 'monthly':
        groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
        dateFormat = '%Y-%m';
        orderBy = 'DATE_FORMAT(created_at, "%Y-%m")';
        break;
      case 'weekly':
        groupBy = 'YEARWEEK(created_at)';
        dateFormat = '%Y-W%u';
        orderBy = 'YEARWEEK(created_at)';
        break;
      default:
        groupBy = 'DATE(created_at)';
        dateFormat = '%Y-%m-%d';
        orderBy = 'DATE(created_at)';
    }

    const [sales] = await pool.query(
      `SELECT ${groupBy} as period,
       COUNT(*) as orders, SUM(total_amount) as revenue
       FROM orders WHERE status != 'cancelled'
       GROUP BY ${groupBy}
       ORDER BY ${orderBy} DESC LIMIT 30`
    );

    res.json({ sales });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Category Sales Report
const getCategorySales = async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT 
        COALESCE(p.category, 'Uncategorized') as category,
        COUNT(DISTINCT oi.order_id) as orders,
        SUM(oi.quantity) as items_sold,
        SUM(oi.quantity * (p.metal_price + p.making_charges)) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
      LIMIT 10
    `);

    res.json({ categories });
  } catch (error) {
    console.error('Category sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Top Products Report
const getTopProducts = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.images,
        p.category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * (p.metal_price + p.making_charges)) as revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json({ products });
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Order Status Stats
const getOrderStatusStats = async (req, res) => {
  try {
    const [statuses] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);

    // Calculate total for percentages
    const total = statuses.reduce((sum, s) => sum + parseInt(s.count), 0);
    const statusWithPercentage = statuses.map(s => ({
      ...s,
      percentage: total > 0 ? ((s.count / total) * 100).toFixed(1) : 0
    }));

    res.json({ statuses: statusWithPercentage, total });
  } catch (error) {
    console.error('Order status stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Review moderation
const getPendingReviews = async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.*, u.name as user_name, p.name as product_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       WHERE r.is_approved = FALSE
       ORDER BY r.created_at DESC`
    );
    res.json({ reviews });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveReview = async (req, res) => {
  try {
    await pool.query('UPDATE reviews SET is_approved = TRUE WHERE id = ?', [req.params.id]);

    // Update product rating
    const [review] = await pool.query('SELECT product_id FROM reviews WHERE id = ?', [req.params.id]);
    if (review.length > 0) {
      await pool.query(
        `UPDATE products p SET 
         rating = (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND is_approved = TRUE),
         review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = TRUE)
         WHERE p.id = ?`,
        [review[0].product_id]
      );
    }

    res.json({ message: 'Review approved' });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// Coupon Management
// ============================================

// Get all coupons
const getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', showInactive = 'false', sortField = 'created_at', sortOrder = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClauses = [];
    let params = [];

    // Filter by active status
    if (showInactive !== 'true') {
      whereClauses.push('is_active = 1');
    }

    // Search filter
    if (search) {
      whereClauses.push('(code LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Hide auto-generated birthday/anniversary coupons (they're per-user and would spam the list)
    whereClauses.push("code NOT LIKE '%-BDAY-%' AND code NOT LIKE '%-ANNIV-%'");

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Validate sort field
    const allowedSortFields = ['code', 'created_at', 'min_order_amount', 'end_date', 'discount_value'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM coupons ${whereClause}`,
      params
    );

    const [coupons] = await pool.query(
      `SELECT * FROM coupons ${whereClause} ORDER BY ${validSortField} ${validSortOrder} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      coupons,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create coupon
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount = 0,
      max_discount = null,
      usage_limit = null,
      start_date,
      end_date
    } = req.body;

    // Validate required fields
    if (!code || !discount_type || !discount_value || !start_date || !end_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if code already exists
    const [existing] = await pool.query('SELECT id FROM coupons WHERE code = ?', [code.toUpperCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.toUpperCase(), description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, start_date, end_date]
    );
    
    // Audit log
    auditLogger.create(req.user.id, req.user.name, 'COUPON', result.insertId, `Created coupon: ${code.toUpperCase()}`, { code: code.toUpperCase(), discount_type, discount_value }, req);

    res.status(201).json({
      message: 'Coupon created successfully',
      couponId: result.insertId
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update coupon
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      usage_limit,
      start_date,
      end_date,
      is_active
    } = req.body;

    // Check if coupon exists
    const [existing] = await pool.query('SELECT id FROM coupons WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if code conflicts with another coupon
    if (code) {
      const [codeCheck] = await pool.query('SELECT id FROM coupons WHERE code = ? AND id != ?', [code.toUpperCase(), id]);
      if (codeCheck.length > 0) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
    }

    await pool.query(
      `UPDATE coupons SET 
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        min_order_amount = COALESCE(?, min_order_amount),
        max_discount = ?,
        usage_limit = ?,
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [code?.toUpperCase(), description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, start_date, end_date, is_active, id]
    );

    res.json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Get coupon details for audit
    const [oldCoupon] = await pool.query('SELECT code FROM coupons WHERE id = ?', [id]);
    
    const [result] = await pool.query('DELETE FROM coupons WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    // Audit log
    auditLogger.delete(req.user.id, req.user.name, 'COUPON', id, `Deleted coupon: ${oldCoupon[0]?.code || id}`, oldCoupon[0], req);

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle coupon status
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [coupon] = await pool.query('SELECT is_active FROM coupons WHERE id = ?', [id]);
    if (coupon.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const newStatus = !coupon[0].is_active;
    await pool.query('UPDATE coupons SET is_active = ? WHERE id = ?', [newStatus, id]);
    
    // Audit log
    auditLogger.statusChange(req.user.id, req.user.name, 'COUPON', id, `Coupon #${id} ${newStatus ? 'activated' : 'deactivated'}`, { is_active: !newStatus }, { is_active: newStatus }, req);

    res.json({ 
      message: `Coupon ${newStatus ? 'activated' : 'deactivated'} successfully`,
      is_active: newStatus
    });
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// Admin User Management
// ============================================

// Get all admin users
const getAdmins = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      search = ''
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate sort parameters
    const validSortColumns = ['name', 'email', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? `u.${sortBy}` : 'u.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build search condition
    let searchCondition = "u.role = 'admin'";
    const queryParams = [];
    
    if (search) {
      searchCondition += " AND (u.name LIKE ? OR u.email LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const [admins] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, u.profile_image,
              u.role_id, r.display_name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE ${searchCondition}
       ORDER BY ${sortColumn} ${order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users u WHERE ${searchCondition}`,
      queryParams
    );

    res.json({ 
      admins,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Promote user to admin by email
const promoteToAdmin = async (req, res) => {
  try {
    const { email, roleId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const [users] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'No account found with this email',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];

    if (user.role === 'admin') {
      return res.status(400).json({ 
        message: 'This user is already an admin',
        code: 'ALREADY_ADMIN'
      });
    }

    // Get or validate roleId
    let assignedRoleId = roleId;
    let roleName = 'Default Staff';
    
    if (roleId) {
      // Verify role exists
      const [roles] = await pool.query('SELECT id, display_name FROM roles WHERE id = ?', [roleId]);
      if (roles.length > 0) {
        roleName = roles[0].display_name;
      } else {
        // Fallback to default_staff
        const [defaultRole] = await pool.query('SELECT id, display_name FROM roles WHERE name = ?', ['default_staff']);
        if (defaultRole.length > 0) {
          assignedRoleId = defaultRole[0].id;
          roleName = defaultRole[0].display_name;
        }
      }
    } else {
      // No roleId provided, use default_staff
      const [defaultRole] = await pool.query('SELECT id, display_name FROM roles WHERE name = ?', ['default_staff']);
      if (defaultRole.length > 0) {
        assignedRoleId = defaultRole[0].id;
        roleName = defaultRole[0].display_name;
      }
    }

    // Update role to admin and assign role_id
    await pool.query(
      'UPDATE users SET role = ?, role_id = ? WHERE id = ?',
      ['admin', assignedRoleId, user.id]
    );
    
    // Audit log
    auditLogger.update(req.user.id, req.user.name, 'USER', user.id, `Promoted ${user.name || user.email} to admin with role: ${roleName}`, { role: 'customer', role_id: null }, { role: 'admin', role_id: assignedRoleId }, req);

    // Send admin promotion email
    try {
      const { sendAdminPromotionEmail } = require('../services/emailService');
      await sendAdminPromotionEmail(user.email, { name: user.name, email: user.email, roleName: roleName });
    } catch (emailError) {
      console.error('Failed to send admin promotion email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      message: `${user.name || user.email} has been promoted to admin`,
      user: { id: user.id, name: user.name, email: user.email, role: 'admin' }
    });
  } catch (error) {
    console.error('Promote to admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate if email exists (for frontend confirmation)
const validateUserEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ valid: false, message: 'Email is required' });
    }

    const [users] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.json({ 
        valid: false, 
        exists: false,
        message: 'No account found with this email. Ask the user to create an account first.'
      });
    }

    const user = users[0];

    if (user.role === 'admin') {
      return res.json({ 
        valid: false, 
        exists: true,
        isAdmin: true,
        message: 'This user is already an admin.'
      });
    }

    res.json({ 
      valid: true, 
      exists: true,
      user: { name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Validate email error:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
};

// Demote admin to customer
const demoteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-demotion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot remove your own admin privileges' });
    }

    // Find admin
    const [admins] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ? AND role = ?',
      [id, 'admin']
    );

    if (admins.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = admins[0];

    // Update role to customer
    await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      ['customer', id]
    );
    
    // Audit log
    auditLogger.update(req.user.id, req.user.name, 'USER', admin.id, `Demoted ${admin.name || admin.email} from admin`, { role: 'admin' }, { role: 'customer' }, req);

    res.json({ 
      message: `${admin.name || admin.email} has been removed as admin`,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'customer' }
    });
  } catch (error) {
    console.error('Demote admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update admin's role
const updateAdminRole = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ message: 'Role ID is required' });
    }

    // Find the admin user (all admins have role='admin')
    const [users] = await pool.query('SELECT id, name, email, role, role_id FROM users WHERE id = ? AND role IN (?, ?)', [adminId, 'admin', 'super_admin']);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = users[0];

    // Get the new role details
    const [roles] = await pool.query('SELECT id, name, display_name FROM roles WHERE id = ?', [roleId]);
    if (roles.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const newRole = roles[0];

    // Don't allow assigning super_admin role through this endpoint
    if (newRole.name === 'super_admin') {
      return res.status(403).json({ message: 'Super Admin role can only be assigned via database' });
    }

    // Update the user's role_id
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, adminId]);

    // Audit log
    auditLogger.update(req.user.id, req.user.name, 'USER', admin.id, 
      `Changed role for ${admin.name || admin.email} to ${newRole.display_name}`, 
      { role_id: admin.role_id }, { role_id: roleId }, req);

    res.json({ 
      message: `Role updated to ${newRole.display_name}`,
      admin: { id: admin.id, name: admin.name, email: admin.email, role_id: roleId, role_name: newRole.display_name }
    });
  } catch (error) {
    console.error('Update admin role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
  getCategorySales,
  getTopProducts,
  getOrderStatusStats,
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
  updateAdminRole
};
