const db = require('../config/db');

// Get saved items for user
const getSavedItems = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [items] = await db.query(`
      SELECT sfl.*, p.name, p.images, p.metal_price, p.making_charges, 
             p.category, p.metal_type, p.purity, p.stock, p.gst_percent
      FROM saved_for_later sfl
      JOIN products p ON sfl.product_id = p.id
      WHERE sfl.user_id = ?
      ORDER BY sfl.created_at DESC
    `, [userId]);

    res.json(items);
  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ message: 'Failed to get saved items' });
  }
};

// Save item for later
const saveForLater = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1, selected_size = null } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists
    const [product] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Insert or update if exists
    await db.query(`
      INSERT INTO saved_for_later (user_id, product_id, quantity, selected_size)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        quantity = VALUES(quantity),
        selected_size = VALUES(selected_size),
        created_at = CURRENT_TIMESTAMP
    `, [userId, product_id, quantity, selected_size]);

    res.json({ message: 'Item saved for later' });
  } catch (error) {
    console.error('Save for later error:', error);
    res.status(500).json({ message: 'Failed to save item' });
  }
};

// Move item from saved to cart (returns item data)
const moveToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Get item details
    const [items] = await db.query(`
      SELECT sfl.*, p.name, p.images, p.metal_price, p.making_charges, 
             p.category, p.metal_type, p.purity, p.stock
      FROM saved_for_later sfl
      JOIN products p ON sfl.product_id = p.id
      WHERE sfl.id = ? AND sfl.user_id = ?
    `, [id, userId]);

    if (items.length === 0) {
      return res.status(404).json({ message: 'Saved item not found' });
    }

    // Delete from saved
    await db.query('DELETE FROM saved_for_later WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ 
      message: 'Item moved to cart', 
      item: items[0]
    });
  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({ message: 'Failed to move item' });
  }
};

// Remove saved item
const removeSavedItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM saved_for_later WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Saved item not found' });
    }

    res.json({ message: 'Item removed from saved' });
  } catch (error) {
    console.error('Remove saved item error:', error);
    res.status(500).json({ message: 'Failed to remove item' });
  }
};

// Clear all saved items
const clearSavedItems = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM saved_for_later WHERE user_id = ?', [userId]);
    res.json({ message: 'All saved items cleared' });
  } catch (error) {
    console.error('Clear saved items error:', error);
    res.status(500).json({ message: 'Failed to clear saved items' });
  }
};

module.exports = {
  getSavedItems,
  saveForLater,
  moveToCart,
  removeSavedItem,
  clearSavedItems
};
