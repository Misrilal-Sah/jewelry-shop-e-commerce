const pool = require('../config/db');
const auditLogger = require('../services/auditLogger');

// Get all flash sales (admin)
const getAllFlashSales = async (req, res) => {
  try {
    const [sales] = await pool.query(
      `SELECT fs.*, p.name as product_name, p.images as product_images, 
              (p.metal_price + COALESCE(p.making_charges, 0)) as original_price
       FROM flash_sales fs
       JOIN products p ON fs.product_id = p.id
       ORDER BY fs.created_at DESC`
    );
    res.json(sales);
  } catch (error) {
    console.error('Get flash sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active flash sales (public)
const getActiveFlashSales = async (req, res) => {
  try {
    const [sales] = await pool.query(
      `SELECT fs.*, p.id as product_id, p.name, p.images, 
              (p.metal_price + COALESCE(p.making_charges, 0)) as original_price, 
              p.category, p.rating, p.review_count
       FROM flash_sales fs
       JOIN products p ON fs.product_id = p.id
       WHERE fs.is_active = TRUE 
         AND fs.start_time <= NOW() 
         AND fs.end_time > NOW()
         AND p.is_active = TRUE
       ORDER BY fs.end_time ASC`
    );
    res.json(sales);
  } catch (error) {
    console.error('Get active flash sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if product has flash sale
const getProductFlashSale = async (req, res) => {
  try {
    const { productId } = req.params;
    const [sales] = await pool.query(
      `SELECT fs.* FROM flash_sales fs
       WHERE fs.product_id = ? 
         AND fs.is_active = TRUE 
         AND fs.start_time <= NOW() 
         AND fs.end_time > NOW()
       LIMIT 1`,
      [productId]
    );
    
    if (sales.length === 0) {
      return res.json({ hasFlashSale: false });
    }

    res.json({
      hasFlashSale: true,
      flashSale: sales[0]
    });
  } catch (error) {
    console.error('Get product flash sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create flash sale (admin)
const createFlashSale = async (req, res) => {
  try {
    const { product_id, discount_percentage, flash_price, start_time, end_time, max_quantity } = req.body;

    // Check for overlapping flash sales
    const [existing] = await pool.query(
      `SELECT id FROM flash_sales 
       WHERE product_id = ? AND is_active = TRUE
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
      [product_id, end_time, start_time, end_time, start_time]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Product already has an overlapping flash sale' });
    }

    // Convert empty strings to null for optional fields
    const flashPriceValue = flash_price === '' || flash_price === undefined ? null : flash_price;
    const maxQuantityValue = max_quantity === '' || max_quantity === undefined ? null : max_quantity;

    const [result] = await pool.query(
      `INSERT INTO flash_sales (product_id, discount_percentage, flash_price, start_time, end_time, max_quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product_id, discount_percentage, flashPriceValue, start_time, end_time, maxQuantityValue]
    );

    // Get product name for audit log
    const [product] = await pool.query('SELECT name FROM products WHERE id = ?', [product_id]);
    const productName = product[0]?.name || 'Unknown';
    
    // Audit log
    if (req.user) {
      auditLogger.create(
        req.user.id, 
        req.user.name, 
        'FLASH_SALE', 
        result.insertId, 
        `Created flash sale for: ${productName} (${discount_percentage}% off)`,
        { product_id, discount_percentage, start_time, end_time },
        req
      );
    }

    res.status(201).json({ 
      message: 'Flash sale created',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create flash sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update flash sale (admin)
const updateFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount_percentage, flash_price, start_time, end_time, max_quantity, is_active } = req.body;

    // Get old values for audit
    const [oldSale] = await pool.query('SELECT * FROM flash_sales WHERE id = ?', [id]);
    const oldData = oldSale[0] || {};

    await pool.query(
      `UPDATE flash_sales SET 
        discount_percentage = COALESCE(?, discount_percentage),
        flash_price = COALESCE(?, flash_price),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        max_quantity = COALESCE(?, max_quantity),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [discount_percentage, flash_price, start_time, end_time, max_quantity, is_active, id]
    );

    // Audit log
    if (req.user) {
      auditLogger.update(
        req.user.id, 
        req.user.name, 
        'FLASH_SALE', 
        parseInt(id), 
        `Updated flash sale #${id}`,
        { discount_percentage: oldData.discount_percentage, is_active: oldData.is_active },
        { discount_percentage, is_active },
        req
      );
    }

    res.json({ message: 'Flash sale updated' });
  } catch (error) {
    console.error('Update flash sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete flash sale (admin)
const deleteFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get sale info for audit
    const [oldSale] = await pool.query(
      `SELECT fs.*, p.name as product_name FROM flash_sales fs 
       JOIN products p ON fs.product_id = p.id WHERE fs.id = ?`, 
      [id]
    );
    const oldData = oldSale[0];
    
    await pool.query('DELETE FROM flash_sales WHERE id = ?', [id]);
    
    // Audit log
    if (req.user) {
      auditLogger.delete(
        req.user.id, 
        req.user.name, 
        'FLASH_SALE', 
        parseInt(id), 
        `Deleted flash sale for: ${oldData?.product_name || 'Unknown'}`,
        oldData,
        req
      );
    }
    
    res.json({ message: 'Flash sale deleted' });
  } catch (error) {
    console.error('Delete flash sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllFlashSales,
  getActiveFlashSales,
  getProductFlashSale,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale
};
