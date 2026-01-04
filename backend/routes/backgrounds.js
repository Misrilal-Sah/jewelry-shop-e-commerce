/**
 * Product Backgrounds Routes
 * CRUD for background images used in product enhancement
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { uploadFromBuffer } = require('../services/cloudinaryService');

// Multer for background uploads
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Initialize table if not exists
const initTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_backgrounds (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ product_backgrounds table initialized');
  } catch (error) {
    console.error('Failed to initialize product_backgrounds table:', error.message);
  }
};

// Run on module load
initTable();

/**
 * GET /api/backgrounds
 * List all backgrounds (public)
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, image_url, created_at FROM product_backgrounds ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get backgrounds error:', error);
    res.status(500).json({ message: 'Failed to fetch backgrounds' });
  }
});

/**
 * POST /api/backgrounds
 * Upload new background (admin only)
 */
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !req.file) {
      return res.status(400).json({ message: 'Name and image are required' });
    }
    
    // Upload to Cloudinary in product-backgrounds folder
    const uploadResult = await uploadFromBuffer(
      req.file.buffer, 
      'product-backgrounds', 
      'bg'
    );
    
    // Insert into DB
    const [result] = await pool.query(
      'INSERT INTO product_backgrounds (name, image_url) VALUES (?, ?)',
      [name, uploadResult.secure_url]
    );
    
    res.json({
      message: 'Background added successfully',
      background: {
        id: result.insertId,
        name,
        image_url: uploadResult.secure_url
      }
    });
  } catch (error) {
    console.error('Add background error:', error);
    res.status(500).json({ message: 'Failed to add background' });
  }
});

/**
 * DELETE /api/backgrounds/:id
 * Delete a background (admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'DELETE FROM product_backgrounds WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Background not found' });
    }
    
    res.json({ message: 'Background deleted successfully' });
  } catch (error) {
    console.error('Delete background error:', error);
    res.status(500).json({ message: 'Failed to delete background' });
  }
});

module.exports = router;
