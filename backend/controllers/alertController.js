const pool = require('../config/db');

// Subscribe to an alert
const subscribeAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, alert_type, target_price } = req.body;

    if (!product_id || !alert_type) {
      return res.status(400).json({ message: 'Product ID and alert type required' });
    }

    if (!['back_in_stock', 'price_drop'].includes(alert_type)) {
      return res.status(400).json({ message: 'Invalid alert type' });
    }

    // Get current product price
    const [products] = await pool.query(
      'SELECT metal_price, making_charges, stock FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];
    const currentPrice = parseFloat(product.metal_price) + parseFloat(product.making_charges || 0);

    // Check if already subscribed
    const [existing] = await pool.query(
      'SELECT id FROM product_alerts WHERE user_id = ? AND product_id = ? AND alert_type = ?',
      [userId, product_id, alert_type]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already subscribed to this alert' });
    }

    // Create alert subscription
    const [result] = await pool.query(
      `INSERT INTO product_alerts (user_id, product_id, alert_type, target_price, original_price) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, product_id, alert_type, target_price || null, currentPrice]
    );

    res.status(201).json({
      message: alert_type === 'back_in_stock' 
        ? 'You will be notified when this item is back in stock!' 
        : 'You will be notified when the price drops!',
      alert_id: result.insertId
    });
  } catch (error) {
    console.error('Subscribe alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unsubscribe from an alert
const unsubscribeAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM product_alerts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert subscription removed' });
  } catch (error) {
    console.error('Unsubscribe alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's alerts
const getUserAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [alerts] = await pool.query(`
      SELECT 
        a.*,
        p.name as product_name,
        p.images,
        p.metal_price,
        p.making_charges,
        p.stock
      FROM product_alerts a
      JOIN products p ON a.product_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [userId]);

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is subscribed to a product alert
const checkAlertStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const [alerts] = await pool.query(
      'SELECT id, alert_type FROM product_alerts WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    const status = {
      back_in_stock: false,
      price_drop: false,
      back_in_stock_id: null,
      price_drop_id: null
    };

    alerts.forEach(alert => {
      status[alert.alert_type] = true;
      status[`${alert.alert_type}_id`] = alert.id;
    });

    res.json(status);
  } catch (error) {
    console.error('Check alert status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unsubscribe by product and type
const unsubscribeByProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, alertType } = req.params;

    const [result] = await pool.query(
      'DELETE FROM product_alerts WHERE user_id = ? AND product_id = ? AND alert_type = ?',
      [userId, productId, alertType]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert subscription removed' });
  } catch (error) {
    console.error('Unsubscribe by product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  subscribeAlert,
  unsubscribeAlert,
  getUserAlerts,
  checkAlertStatus,
  unsubscribeByProduct
};
