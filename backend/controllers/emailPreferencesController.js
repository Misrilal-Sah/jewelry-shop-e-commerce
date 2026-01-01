const db = require('../config/db');
const emailService = require('../services/emailService');

// Get email preferences for a user
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;

    // Check if preferences exist
    const [existing] = await db.execute(
      'SELECT * FROM email_preferences WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    // Create default preferences if not exist
    await db.execute(
      `INSERT INTO email_preferences (user_id, email, newsletter, offers, festive, others) 
       VALUES (?, ?, TRUE, TRUE, TRUE, TRUE)`,
      [userId, email]
    );

    res.json({
      user_id: userId,
      email: email,
      newsletter: true,
      offers: true,
      festive: true,
      others: true
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Failed to get preferences' });
  }
};

// Update email preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    const { newsletter, offers, festive, others } = req.body;

    // Check if preferences exist
    const [existing] = await db.execute(
      'SELECT id FROM email_preferences WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      // Update existing
      await db.execute(
        `UPDATE email_preferences 
         SET newsletter = ?, offers = ?, festive = ?, others = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [newsletter ?? true, offers ?? true, festive ?? true, others ?? true, userId]
      );
    } else {
      // Insert new
      await db.execute(
        `INSERT INTO email_preferences (user_id, email, newsletter, offers, festive, others) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, newsletter ?? true, offers ?? true, festive ?? true, others ?? true]
      );
    }

    res.json({ 
      success: true, 
      message: 'Email preferences updated successfully',
      preferences: { newsletter, offers, festive, others }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

// Send test emails (admin only)
exports.sendTestEmails = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const results = await emailService.sendTestEmails(email);
    
    res.json({ 
      success: true, 
      message: 'Test emails sent successfully!',
      results 
    });
  } catch (error) {
    console.error('Send test emails error:', error);
    res.status(500).json({ message: 'Failed to send test emails' });
  }
};

// Send single marketing email
exports.sendMarketingEmail = async (req, res) => {
  try {
    const { email, type, data } = req.body;
    
    if (!email || !type) {
      return res.status(400).json({ message: 'Email and type are required' });
    }

    await emailService.sendMarketingEmail(email, type, data || {});
    
    res.json({ 
      success: true, 
      message: `${type} email sent successfully!`
    });
  } catch (error) {
    console.error('Send marketing email error:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};
