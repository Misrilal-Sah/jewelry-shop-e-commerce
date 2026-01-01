/**
 * Customer Segmentation Service
 * RF (Recency-Frequency) based customer segmentation
 */
const pool = require('../config/db');

/**
 * Calculate RF scores for a specific user
 * @param {number} userId - The user ID to calculate scores for
 * @returns {Object} - { recency, frequency, rfScore, segment }
 */
const calculateRFScores = async (userId) => {
  try {
    // Get order stats for the user
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        MAX(created_at) as last_order_date,
        DATEDIFF(NOW(), MAX(created_at)) as days_since_last_order
      FROM orders 
      WHERE user_id = ? AND status NOT IN ('cancelled', 'refunded')
    `, [userId]);

    const { total_orders, last_order_date, days_since_last_order } = stats[0];
    
    // Calculate Recency Score (1-5)
    let recency = 1;
    if (days_since_last_order === null) {
      recency = 0; // No orders at all
    } else if (days_since_last_order <= 7) {
      recency = 5;
    } else if (days_since_last_order <= 30) {
      recency = 4;
    } else if (days_since_last_order <= 60) {
      recency = 3;
    } else if (days_since_last_order <= 120) {
      recency = 2;
    } else {
      recency = 1;
    }
    
    // Calculate Frequency Score (1-5)
    let frequency = 1;
    if (total_orders >= 10) {
      frequency = 5;
    } else if (total_orders >= 5) {
      frequency = 4;
    } else if (total_orders >= 3) {
      frequency = 3;
    } else if (total_orders >= 2) {
      frequency = 2;
    } else {
      frequency = 1;
    }
    
    const rfScore = `${recency}${frequency}`;
    const segment = determineSegment(recency, frequency);
    
    return {
      recency,
      frequency,
      rfScore,
      segment,
      total_orders,
      last_order_date
    };
  } catch (error) {
    console.error(`Error calculating RF scores for user ${userId}:`, error);
    return null;
  }
};

/**
 * Determine customer segment based on RF scores
 * @param {number} r - Recency score (1-5)
 * @param {number} f - Frequency score (1-5)
 * @returns {string} - Segment name
 */
const determineSegment = (r, f) => {
  // Champions: High recency, high frequency
  if (r >= 4 && f >= 4) return 'champions';
  
  // Loyal: Good recency, good frequency
  if (r >= 3 && f >= 3) return 'loyal';
  
  // Potential Loyalist: Recent but moderate frequency
  if (r >= 4 && f === 2) return 'potential_loyalist';
  
  // New Customer: Very recent, first order
  if (r === 5 && f === 1) return 'new_customer';
  
  // Can't Lose: Low recency but high frequency (was very active)
  if (r <= 2 && f >= 4) return 'cant_lose';
  
  // At Risk: Moderate decline in recency but used to buy often
  if (r === 2 && f >= 3) return 'at_risk';
  
  // Dormant: Low recency and low frequency
  if (r === 1 && f <= 2) return 'dormant';
  
  // Others: Everyone else
  return 'others';
};

/**
 * Update RF scores and segment for a single user
 * @param {number} userId - The user ID to update
 */
const updateCustomerSegment = async (userId) => {
  try {
    const rfData = await calculateRFScores(userId);
    
    if (!rfData) return false;
    
    await pool.query(`
      UPDATE users SET
        rf_recency = ?,
        rf_frequency = ?,
        rf_score = ?,
        customer_segment = ?,
        total_orders = ?,
        last_order_date = ?,
        rf_updated_at = NOW()
      WHERE id = ?
    `, [
      rfData.recency,
      rfData.frequency,
      rfData.rfScore,
      rfData.segment,
      rfData.total_orders,
      rfData.last_order_date,
      userId
    ]);
    
    return true;
  } catch (error) {
    console.error(`Error updating segment for user ${userId}:`, error);
    return false;
  }
};

/**
 * Update RF scores and segments for ALL customers
 * Called by the daily cron job
 */
const updateAllCustomerSegments = async () => {
  console.log('🎯 Starting customer segmentation update...');
  const startTime = Date.now();
  
  try {
    // Get all customers (role = 'customer')
    const [customers] = await pool.query(`
      SELECT id, name, email FROM users WHERE role = 'customer'
    `);
    
    console.log(`📊 Processing ${customers.length} customers...`);
    
    let updated = 0;
    let failed = 0;
    
    for (const customer of customers) {
      const success = await updateCustomerSegment(customer.id);
      if (success) {
        updated++;
      } else {
        failed++;
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Segmentation complete: ${updated} updated, ${failed} failed (${duration}s)`);
    
    return { updated, failed, duration };
  } catch (error) {
    console.error('❌ Error in updateAllCustomerSegments:', error);
    return { updated: 0, failed: 0, error: error.message };
  }
};

/**
 * Get segment statistics summary
 * @returns {Object} - Count of customers per segment
 */
const getSegmentStats = async () => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        customer_segment as segment,
        COUNT(*) as count
      FROM users 
      WHERE role = 'customer'
      GROUP BY customer_segment
      ORDER BY count DESC
    `);
    
    return stats;
  } catch (error) {
    console.error('Error getting segment stats:', error);
    return [];
  }
};

module.exports = {
  calculateRFScores,
  determineSegment,
  updateCustomerSegment,
  updateAllCustomerSegments,
  getSegmentStats
};
