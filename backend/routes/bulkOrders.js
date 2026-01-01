const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');

// Submit bulk order inquiry (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company_name, category, quantity, budget_range, message } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Insert bulk order inquiry
    const [result] = await pool.query(
      `INSERT INTO bulk_order_inquiries (name, email, phone, company_name, category, quantity, budget_range, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [name, email, phone || null, company_name || null, category || null, quantity || null, budget_range || null, message || null]
    );
    
    const inquiryId = result.insertId;
    
    // Get all admin users for notifications
    const [admins] = await pool.query(`SELECT id, email, name FROM users WHERE role = 'admin'`);
    
    // Send confirmation email to customer
    try {
      await emailService.sendBulkOrderCustomerConfirmation({
        name,
        email,
        category,
        quantity,
        budget_range,
        inquiryId
      });
    } catch (emailError) {
      console.error('Failed to send customer confirmation email:', emailError);
    }
    
    // Send notification emails to all admins
    for (const admin of admins) {
      try {
        await emailService.sendBulkOrderAdminNotification({
          adminEmail: admin.email,
          adminName: admin.name,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          companyName: company_name,
          category,
          quantity,
          budgetRange: budget_range,
          message,
          inquiryId
        });
      } catch (emailError) {
        console.error(`Failed to send admin notification to ${admin.email}:`, emailError);
      }
      
      // Create in-app notification for admin
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, link, is_read)
           VALUES (?, 'bulk_order', 'New Bulk Order Inquiry', ?, ?, 0)`,
          [admin.id, `${name} submitted a bulk order inquiry`, `/admin/bulk-orders`]
        );
      } catch (notifError) {
        console.error('Failed to create admin notification:', notifError);
      }
    }
    
    res.status(201).json({ 
      message: 'Inquiry submitted successfully',
      inquiryId 
    });
  } catch (error) {
    console.error('Bulk order submit error:', error);
    res.status(500).json({ message: 'Failed to submit inquiry' });
  }
});

// Get all bulk order inquiries (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    let query = `SELECT * FROM bulk_order_inquiries WHERE 1=1`;
    const params = [];
    
    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ? OR company_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Validate sort column
    const allowedSortColumns = ['created_at', 'name', 'company_name', 'category', 'quantity', 'budget_range', 'status'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${order}`;
    
    const [inquiries] = await pool.query(query, params);
    
    res.json(inquiries);
  } catch (error) {
    console.error('Fetch bulk orders error:', error);
    res.status(500).json({ message: 'Failed to fetch inquiries' });
  }
});

// Get single bulk order inquiry (admin only)
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM bulk_order_inquiries WHERE id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Fetch bulk order error:', error);
    res.status(500).json({ message: 'Failed to fetch inquiry' });
  }
});

// Update bulk order status (admin only)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'contacted', 'quoted', 'closed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await pool.query(
      `UPDATE bulk_order_inquiries SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );
    
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Delete bulk order inquiry (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query(`DELETE FROM bulk_order_inquiries WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Delete bulk order error:', error);
    res.status(500).json({ message: 'Failed to delete inquiry' });
  }
});

module.exports = router;
