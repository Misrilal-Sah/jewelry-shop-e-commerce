const pool = require('../config/db');
const auditLogger = require('../services/auditLogger');

// ============================================
// SITE SETTINGS
// ============================================

// Get all settings (public - for homepage)
const getPublicSettings = async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT setting_key, setting_value, category FROM site_settings ORDER BY category, display_order'
    );
    
    // Group by category as arrays (for frontend .find() compatibility)
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) acc[setting.category] = [];
      acc[setting.category].push({
        setting_key: setting.setting_key,
        setting_value: setting.setting_value
      });
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all settings with metadata (admin)
const getAllSettings = async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT * FROM site_settings ORDER BY category, display_order'
    );
    
    // Group by category with full metadata
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) acc[setting.category] = [];
      acc[setting.category].push(setting);
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update settings (admin)
const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of { setting_key, setting_value }
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings must be an array' });
    }
    
    for (const setting of settings) {
      await pool.query(
        'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?',
        [setting.setting_value, setting.setting_key]
      );
    }
    
    auditLogger.update(req.user.id, req.user.name || req.user.email, 'SITE_SETTINGS', null, 
      `Updated ${settings.length} site settings`, null, { keys: settings.map(s => s.setting_key) }, req);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// CATEGORIES
// ============================================

// Get all categories (public)
const getPublicCategories = async (req, res) => {
  try {
    // homepage=true filter only shows categories marked for homepage
    const homepageOnly = req.query.homepage === 'true';
    const whereClause = homepageOnly 
      ? 'WHERE is_active = 1 AND is_homepage = 1' 
      : 'WHERE is_active = 1';
    const [categories] = await pool.query(
      `SELECT id, name, display_name, slug, image, is_homepage FROM categories ${whereClause} ORDER BY display_order, name`
    );
    res.json(categories);
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all categories with product count (admin)
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON p.category_id = c.id OR p.category = c.name
      GROUP BY c.id 
      ORDER BY c.display_order, c.name
    `);
    res.json(categories);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create category (admin)
const createCategory = async (req, res) => {
  try {
    const { name, display_name, image, display_order = 0, is_active = true, is_homepage = true } = req.body;
    
    // Validate name (slug) - required, lowercase, no spaces
    if (!name) {
      return res.status(400).json({ message: 'Category slug/key is required' });
    }
    
    // Validate slug format
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(name)) {
      return res.status(400).json({ message: 'Slug must be lowercase with no spaces (use hyphens). Example: daily-wear' });
    }
    
    // Display name defaults to capitalized slug if not provided
    const actualDisplayName = display_name || name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const [result] = await pool.query(
      'INSERT INTO categories (name, display_name, slug, image, display_order, is_active, is_homepage) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, actualDisplayName, name, image, display_order, is_active, is_homepage]
    );
    
    auditLogger.create(req.user.id, req.user.name || req.user.email, 'CATEGORY', result.insertId, 
      `Created category: ${actualDisplayName} (${name})`, { name, display_name: actualDisplayName }, req);
    
    res.status(201).json({ message: 'Category created', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category with this slug already exists' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update category (admin)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_name, image, display_order, is_active, is_homepage } = req.body;
    
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      // Validate slug format
      const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!slugRegex.test(name)) {
        return res.status(400).json({ message: 'Slug must be lowercase with no spaces (use hyphens)' });
      }
      updates.push('name = ?', 'slug = ?');
      values.push(name, name);
    }
    if (display_name !== undefined) { updates.push('display_name = ?'); values.push(display_name); }
    if (image !== undefined) { updates.push('image = ?'); values.push(image); }
    if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
    if (is_homepage !== undefined) { updates.push('is_homepage = ?'); values.push(is_homepage); }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(id);
    await pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
    
    // Also update products with old category name if name changed
    if (name !== undefined) {
      await pool.query('UPDATE products SET category = ? WHERE category_id = ?', [name, id]);
    }
    
    auditLogger.update(req.user.id, req.user.name || req.user.email, 'CATEGORY', id, 
      `Updated category`, req.body, req);
    
    res.json({ message: 'Category updated' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete category (admin) - unlinks products
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get category info and product count
    const [category] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (category.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const [products] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? OR category = ?',
      [id, category[0].name]
    );
    
    // Unlink products (set category to null)
    await pool.query('UPDATE products SET category_id = NULL, category = NULL WHERE category_id = ?', [id]);
    await pool.query('UPDATE products SET category_id = NULL, category = NULL WHERE category = ?', [category[0].name]);
    
    // Delete category
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    
    auditLogger.delete(req.user.id, req.user.name || req.user.email, 'CATEGORY', id, 
      `Deleted category: ${category[0].name} (${products[0].count} products unlinked)`, {}, req);
    
    res.json({ message: `Category deleted. ${products[0].count} products have been unlinked.` });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// COLLECTIONS
// ============================================

// Get all collections (public)
const getPublicCollections = async (req, res) => {
  try {
    // homepage=true filter only shows collections marked for homepage
    const homepageOnly = req.query.homepage === 'true';
    const whereClause = homepageOnly 
      ? 'WHERE is_active = 1 AND is_homepage = 1' 
      : 'WHERE is_active = 1';
    const [collections] = await pool.query(
      `SELECT id, name, display_name, slug, image, tagline, is_homepage FROM collections ${whereClause} ORDER BY display_order, name`
    );
    res.json(collections);
  } catch (error) {
    console.error('Get public collections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all collections with product count (admin)
const getAllCollections = async (req, res) => {
  try {
    const [collections] = await pool.query(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM collections c 
      LEFT JOIN products p ON p.collection_id = c.id OR p.collection = c.name
      GROUP BY c.id 
      ORDER BY c.display_order, c.name
    `);
    res.json(collections);
  } catch (error) {
    console.error('Get all collections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create collection (admin)
const createCollection = async (req, res) => {
  try {
    const { name, display_name, tagline, image, display_order = 0, is_active = true, is_homepage = true } = req.body;
    
    // Validate name (slug) - required, lowercase, no spaces
    if (!name) {
      return res.status(400).json({ message: 'Collection slug/key is required' });
    }
    
    // Validate slug format
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(name)) {
      return res.status(400).json({ message: 'Slug must be lowercase with no spaces (use hyphens). Example: daily-wear' });
    }
    
    // Display name defaults to capitalized slug if not provided
    const actualDisplayName = display_name || name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const [result] = await pool.query(
      'INSERT INTO collections (name, display_name, tagline, slug, image, display_order, is_active, is_homepage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, actualDisplayName, tagline || null, name, image, display_order, is_active, is_homepage]
    );
    
    auditLogger.create(req.user.id, req.user.name || req.user.email, 'COLLECTION', result.insertId, 
      `Created collection: ${actualDisplayName} (${name})`, { name, display_name: actualDisplayName, tagline }, req);
    
    res.status(201).json({ message: 'Collection created', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Collection with this slug already exists' });
    }
    console.error('Create collection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update collection (admin)
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_name, tagline, image, display_order, is_active, is_homepage } = req.body;
    
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      // Validate slug format
      const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!slugRegex.test(name)) {
        return res.status(400).json({ message: 'Slug must be lowercase with no spaces (use hyphens)' });
      }
      updates.push('name = ?', 'slug = ?');
      values.push(name, name);
    }
    if (display_name !== undefined) { updates.push('display_name = ?'); values.push(display_name); }
    if (tagline !== undefined) { updates.push('tagline = ?'); values.push(tagline); }
    if (image !== undefined) { updates.push('image = ?'); values.push(image); }
    if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
    if (is_homepage !== undefined) { updates.push('is_homepage = ?'); values.push(is_homepage); }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(id);
    await pool.query(`UPDATE collections SET ${updates.join(', ')} WHERE id = ?`, values);
    
    // Also update products with old collection name if name changed
    if (name !== undefined) {
      await pool.query('UPDATE products SET collection = ? WHERE collection_id = ?', [name, id]);
    }
    
    auditLogger.update(req.user.id, req.user.name || req.user.email, 'COLLECTION', id, 
      `Updated collection`, req.body, req);
    
    res.json({ message: 'Collection updated' });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete collection (admin) - unlinks products
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get collection info and product count
    const [collection] = await pool.query('SELECT * FROM collections WHERE id = ?', [id]);
    if (collection.length === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    const [products] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE collection_id = ? OR collection = ?',
      [id, collection[0].name]
    );
    
    // Unlink products (set collection to null)
    await pool.query('UPDATE products SET collection_id = NULL, collection = NULL WHERE collection_id = ?', [id]);
    await pool.query('UPDATE products SET collection_id = NULL, collection = NULL WHERE collection = ?', [collection[0].name]);
    
    // Delete collection
    await pool.query('DELETE FROM collections WHERE id = ?', [id]);
    
    auditLogger.delete(req.user.id, req.user.name || req.user.email, 'COLLECTION', id, 
      `Deleted collection: ${collection[0].name} (${products[0].count} products unlinked)`, {}, req);
    
    res.json({ message: `Collection deleted. ${products[0].count} products have been unlinked.` });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Settings
  getPublicSettings,
  getAllSettings,
  updateSettings,
  // Categories
  getPublicCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Collections
  getPublicCollections,
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection
};
