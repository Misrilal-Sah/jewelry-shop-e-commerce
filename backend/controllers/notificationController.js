const pool = require('../config/db');

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const [notifications] = await pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [userId]
    );

    res.json({
      notifications,
      total: countResult[0].total
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create notification (internal use)
const createNotification = async (userId, type, title, message, imageUrl = null, link = null) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, image_url, link) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, imageUrl, link]
    );
    return result.insertId;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
