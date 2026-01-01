// Logs API Routes - Audit Logs and System Logs
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Get Audit Logs (Admin only)
router.get('/audit', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 25, 
      action, 
      resource_type, 
      admin_id,
      start_date,
      end_date,
      search 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = '1=1';
    const params = [];
    
    if (action) {
      whereClause += ' AND action = ?';
      params.push(action);
    }
    
    if (resource_type) {
      whereClause += ' AND resource_type = ?';
      params.push(resource_type);
    }
    
    if (admin_id) {
      whereClause += ' AND admin_id = ?';
      params.push(admin_id);
    }
    
    if (start_date) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }
    
    if (search) {
      whereClause += ' AND (description LIKE ? OR admin_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}`,
      params
    );
    
    // Get logs
    const [logs] = await pool.query(
      `SELECT * FROM audit_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    // Get unique resource types for filter
    const [resourceTypes] = await pool.query(
      'SELECT DISTINCT resource_type FROM audit_logs ORDER BY resource_type'
    );
    
    // Get unique admins for filter
    const [admins] = await pool.query(
      'SELECT DISTINCT admin_id, admin_name FROM audit_logs WHERE admin_id IS NOT NULL ORDER BY admin_name'
    );
    
    res.json({
      logs,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      filters: {
        resourceTypes: resourceTypes.map(r => r.resource_type),
        admins: admins
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

// Get System Logs (Admin only)
router.get('/system', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      level,
      start_date,
      end_date,
      search,
      endpoint,
      method 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = '1=1';
    const params = [];
    
    if (level) {
      whereClause += ' AND level = ?';
      params.push(level);
    }
    
    if (start_date) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }
    
    if (search) {
      whereClause += ' AND (message LIKE ? OR endpoint LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (endpoint) {
      whereClause += ' AND endpoint LIKE ?';
      params.push(`%${endpoint}%`);
    }
    
    if (method) {
      whereClause += ' AND method = ?';
      params.push(method);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM system_logs WHERE ${whereClause}`,
      params
    );
    
    // Get logs
    const [logs] = await pool.query(
      `SELECT id, level, message, source, request_id, user_id, ip_address, endpoint, method, status_code, response_time, created_at 
       FROM system_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    // Get log level counts
    const [levelCounts] = await pool.query(
      `SELECT level, COUNT(*) as count FROM system_logs WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY level`
    );
    
    res.json({
      logs,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      stats: {
        levelCounts: levelCounts.reduce((acc, l) => ({ ...acc, [l.level]: l.count }), {})
      }
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({ message: 'Failed to fetch system logs' });
  }
});

// Get System Log Detail (with stack trace and meta)
router.get('/system/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [logs] = await pool.query('SELECT * FROM system_logs WHERE id = ?', [req.params.id]);
    
    if (logs.length === 0) {
      return res.status(404).json({ message: 'Log not found' });
    }
    
    res.json(logs[0]);
  } catch (error) {
    console.error('Get log detail error:', error);
    res.status(500).json({ message: 'Failed to fetch log detail' });
  }
});

// Clear old logs (Admin only) - Keep last 30 days
router.delete('/cleanup', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    const [auditResult] = await pool.query(
      'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [parseInt(days)]
    );
    
    const [systemResult] = await pool.query(
      'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [parseInt(days)]
    );
    
    res.json({
      message: `Cleaned up logs older than ${days} days`,
      auditLogsDeleted: auditResult.affectedRows,
      systemLogsDeleted: systemResult.affectedRows
    });
  } catch (error) {
    console.error('Cleanup logs error:', error);
    res.status(500).json({ message: 'Failed to cleanup logs' });
  }
});

// Export logs as CSV (Admin only)
router.get('/export/:type', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { start_date, end_date } = req.query;
    
    let query, params = [];
    
    if (type === 'audit') {
      query = 'SELECT * FROM audit_logs WHERE 1=1';
    } else {
      query = 'SELECT id, level, message, source, endpoint, method, status_code, response_time, ip_address, created_at FROM system_logs WHERE 1=1';
    }
    
    if (start_date) {
      query += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 10000';
    
    const [logs] = await pool.query(query, params);
    
    // Convert to CSV
    if (logs.length === 0) {
      return res.json({ message: 'No logs found for export' });
    }
    
    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map(log => 
      Object.values(log).map(v => 
        typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({ message: 'Failed to export logs' });
  }
});

module.exports = router;
