const pool = require('../config/db');
const emailService = require('../services/emailService');
const auditLogger = require('../services/auditLogger');

// Get all campaigns with pagination and filters
const getCampaigns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const type = req.query.type;
    const search = req.query.search || '';
    
    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['name', 'type', 'status', 'scheduled_at', 'created_at', 'sent_at'];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'created_at';
    const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let query = 'SELECT * FROM email_campaigns WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM email_campaigns WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (name LIKE ? OR subject LIKE ?)';
      countQuery += ' AND (name LIKE ? OR subject LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      countQuery += ' AND type = ?';
      params.push(type);
      countParams.push(type);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [campaigns] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get campaign by ID
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const [campaigns] = await pool.query(
      'SELECT * FROM email_campaigns WHERE id = ?',
      [id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaigns[0]);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new campaign
const createCampaign = async (req, res) => {
  try {
    const { name, type, subject, content, scheduled_at, recipient_type } = req.body;
    const userId = req.user.id;

    if (!name || !type || !subject) {
      return res.status(400).json({ message: 'Name, type, and subject are required' });
    }

    const status = scheduled_at ? 'scheduled' : 'draft';
    const recipientType = recipient_type || 'subscribers';

    const [result] = await pool.query(
      `INSERT INTO email_campaigns (name, type, subject, content, status, scheduled_at, recipient_type, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, subject, JSON.stringify(content || {}), status, scheduled_at || null, recipientType, userId]
    );

    // Audit log
    if (req.user) {
      auditLogger.create(req.user.id, req.user.name, 'EMAIL_CAMPAIGN', result.insertId, `Created email campaign: ${name}`, { type, status }, req);
    }

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: {
        id: result.insertId,
        name,
        type,
        subject,
        status,
        scheduled_at,
        recipient_type: recipientType
      }
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update campaign
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, subject, content, status, scheduled_at, recipient_type } = req.body;

    // Check if campaign exists
    const [existing] = await pool.query('SELECT * FROM email_campaigns WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Can't edit sent campaigns
    if (existing[0].status === 'sent') {
      return res.status(400).json({ message: 'Cannot edit a sent campaign' });
    }

    await pool.query(
      `UPDATE email_campaigns SET 
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        subject = COALESCE(?, subject),
        content = COALESCE(?, content),
        status = COALESCE(?, status),
        scheduled_at = ?,
        recipient_type = COALESCE(?, recipient_type)
       WHERE id = ?`,
      [name, type, subject, content ? JSON.stringify(content) : null, status, scheduled_at, recipient_type, id]
    );

    // Audit log
    if (req.user) {
      auditLogger.update(req.user.id, req.user.name, 'EMAIL_CAMPAIGN', parseInt(id), `Updated email campaign: ${existing[0].name}`, { status: existing[0].status }, { status }, req);
    }

    res.json({ message: 'Campaign updated successfully' });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get campaign for audit log before deleting
    const [existing] = await pool.query('SELECT * FROM email_campaigns WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    const oldData = existing[0];
    
    await pool.query('DELETE FROM email_campaigns WHERE id = ?', [id]);
    
    // Audit log
    if (req.user) {
      auditLogger.delete(req.user.id, req.user.name, 'EMAIL_CAMPAIGN', parseInt(id), `Deleted email campaign: ${oldData.name}`, oldData, req);
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send campaign immediately
const sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign
    const [campaigns] = await pool.query('SELECT * FROM email_campaigns WHERE id = ?', [id]);
    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const campaign = campaigns[0];

    if (campaign.status === 'sent') {
      return res.status(400).json({ message: 'Campaign has already been sent' });
    }

    // Get subscribers based on recipient_type
    const recipientType = campaign.recipient_type || 'subscribers';
    let subscriberQuery = 'SELECT email FROM newsletter_subscribers WHERE is_active = TRUE';
    
    if (recipientType === 'registered') {
      subscriberQuery += ' AND user_id IS NOT NULL';
    } else if (recipientType === 'subscribers') {
      subscriberQuery += ' AND user_id IS NULL';
    }
    // 'all' = no filter, get everyone

    const [subscribers] = await pool.query(subscriberQuery);

    if (subscribers.length === 0) {
      return res.status(400).json({ message: 'No active subscribers matching the recipient type' });
    }

    // Parse content
    const content = typeof campaign.content === 'string' 
      ? JSON.parse(campaign.content) 
      : campaign.content;

    // Send to all matching subscribers
    let sentCount = 0;
    for (const subscriber of subscribers) {
      try {
        await emailService.sendMarketingEmail(subscriber.email, campaign.type, content);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error.message);
      }
    }

    // Update campaign status
    await pool.query(
      'UPDATE email_campaigns SET status = ?, sent_at = NOW(), recipient_count = ? WHERE id = ?',
      ['sent', sentCount, id]
    );

    // Audit log
    if (req.user) {
      auditLogger.statusChange(req.user.id, req.user.name, 'EMAIL_CAMPAIGN', parseInt(id), `Sent campaign "${campaign.name}" to ${sentCount} subscribers`, { status: campaign.status }, { status: 'sent', sentCount }, req);
    }

    res.json({
      message: `Campaign sent successfully to ${sentCount} subscribers`,
      sentCount
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Schedule campaign
const scheduleCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_at } = req.body;

    if (!scheduled_at) {
      return res.status(400).json({ message: 'Scheduled time is required' });
    }

    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    await pool.query(
      'UPDATE email_campaigns SET status = ?, scheduled_at = ? WHERE id = ?',
      ['scheduled', scheduled_at, id]
    );

    res.json({ message: 'Campaign scheduled successfully' });
  } catch (error) {
    console.error('Schedule campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel scheduled campaign
const cancelScheduled = async (req, res) => {
  try {
    const { id } = req.params;

    const [campaigns] = await pool.query('SELECT status FROM email_campaigns WHERE id = ?', [id]);
    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaigns[0].status !== 'scheduled') {
      return res.status(400).json({ message: 'Only scheduled campaigns can be cancelled' });
    }

    await pool.query(
      'UPDATE email_campaigns SET status = ?, scheduled_at = NULL WHERE id = ?',
      ['cancelled', id]
    );

    res.json({ message: 'Campaign cancelled successfully' });
  } catch (error) {
    console.error('Cancel campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get email stats
const getEmailStats = async (req, res) => {
  try {
    const [subscriberCount] = await pool.query(
      'SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = TRUE'
    );
    
    const [campaignStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts
      FROM email_campaigns
    `);

    const [recentCampaigns] = await pool.query(
      'SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      subscribers: subscriberCount[0].count,
      campaigns: campaignStats[0],
      recentCampaigns
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all subscribers
const getSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const type = req.query.type || 'all';
    
    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['email', 'subscribed_at'];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'subscribed_at';
    const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let query = 'SELECT * FROM newsletter_subscribers WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM newsletter_subscribers WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND email LIKE ?';
      countQuery += ' AND email LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    // Type filter
    if (type === 'registered') {
      query += ' AND user_id IS NOT NULL';
      countQuery += ' AND user_id IS NOT NULL';
    } else if (type === 'newsletter_only') {
      query += ' AND user_id IS NULL';
      countQuery += ' AND user_id IS NULL';
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [subscribers] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      subscribers,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete subscriber
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    res.json({ message: 'Subscriber removed successfully' });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  scheduleCampaign,
  cancelScheduled,
  getEmailStats,
  getSubscribers,
  deleteSubscriber
};
