const cron = require('node-cron');
const pool = require('../config/db');
const emailService = require('../services/emailService');

// Send scheduled campaigns - runs every minute
const startCampaignScheduler = () => {
  console.log('📅 Campaign scheduler started');
  
  // Run every minute to check for scheduled campaigns
  cron.schedule('* * * * *', async () => {
    try {
      // Find campaigns that are scheduled and due to be sent
      const [campaigns] = await pool.query(
        `SELECT * FROM email_campaigns 
         WHERE status = 'scheduled' 
         AND scheduled_at <= NOW()`
      );

      if (campaigns.length === 0) {
        return; // No campaigns to send
      }

      console.log(`📧 Found ${campaigns.length} scheduled campaign(s) to send`);

      for (const campaign of campaigns) {
        try {
          console.log(`📤 Sending campaign: ${campaign.name}`);
          
          // Get subscribers based on recipient_type
          const recipientType = campaign.recipient_type || 'subscribers';
          let subscriberQuery = 'SELECT email FROM newsletter_subscribers WHERE is_active = TRUE';
          
          if (recipientType === 'registered') {
            subscriberQuery += ' AND user_id IS NOT NULL';
          } else if (recipientType === 'subscribers') {
            subscriberQuery += ' AND user_id IS NULL';
          }
          // 'all' = no filter

          const [subscribers] = await pool.query(subscriberQuery);

          if (subscribers.length === 0) {
            console.log(`⚠️ No subscribers for campaign: ${campaign.name}`);
            // Mark as sent with 0 recipients
            await pool.query(
              'UPDATE email_campaigns SET status = ?, sent_at = NOW(), recipient_count = ? WHERE id = ?',
              ['sent', 0, campaign.id]
            );
            continue;
          }

          // Parse content
          const content = typeof campaign.content === 'string' 
            ? JSON.parse(campaign.content) 
            : campaign.content;

          // Send to all subscribers
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
            ['sent', sentCount, campaign.id]
          );

          console.log(`✅ Campaign "${campaign.name}" sent to ${sentCount} subscribers`);
        } catch (error) {
          console.error(`❌ Error sending campaign ${campaign.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Campaign scheduler error:', error.message);
    }
  });
};

module.exports = { startCampaignScheduler };
