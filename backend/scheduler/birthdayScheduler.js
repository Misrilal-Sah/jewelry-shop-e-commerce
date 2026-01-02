/**
 * Birthday/Anniversary Email Scheduler
 * Runs daily at 8 AM to send birthday and anniversary emails with discount coupons
 */
const cron = require('node-cron');
const pool = require('../config/db');
const { sendBirthdayEmail, sendAnniversaryEmail } = require('../services/emailService');
const { createNotification } = require('../controllers/notificationController');

// Coupon settings
const BIRTHDAY_DISCOUNT = 15;
const ANNIVERSARY_DISCOUNT = 10;
const MIN_ORDER = 1000;
const COUPON_VALID_DAYS = 7;

/**
 * Generate unique coupon code with user initials for birthday/anniversary
 * Format: MS-BDAY-12-2026 (initials-type-userId-year)
 */
const generateCouponCode = (type, userId, year, userName) => {
  const prefix = type === 'birthday' ? 'BDAY' : 'ANNIV';
  // Get initials from name (first 2 letters of first and last name, or first 2 letters if single name)
  const nameParts = (userName || 'XX').trim().split(/\s+/);
  let initials;
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  } else {
    initials = nameParts[0].substring(0, 2).toUpperCase();
  }
  return `${initials}-${prefix}-${userId}-${year}`;
};

/**
 * Create coupon in database
 */
const createCoupon = async (code, discount, userId, type) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + COUPON_VALID_DAYS);
    
    // Check if coupon already exists (avoid duplicates)
    const [existing] = await pool.query(
      'SELECT id FROM coupons WHERE code = ?',
      [code]
    );
    
    if (existing.length > 0) {
      console.log(`Coupon ${code} already exists, skipping creation`);
      return { code, endDate };
    }
    
    // Use the same column names as admin-created coupons
    await pool.query(`
      INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, usage_limit, used_count, start_date, end_date, is_active)
      VALUES (?, ?, 'percentage', ?, ?, 1, 0, ?, ?, 1)
    `, [code, `${type === 'birthday' ? 'Birthday' : 'Anniversary'} special for user ${userId}`, discount, MIN_ORDER, startDate, endDate]);
    
    console.log(`Created ${type} coupon: ${code}`);
    return { code, endDate };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { code, endDate: new Date(Date.now() + COUPON_VALID_DAYS * 24 * 60 * 60 * 1000) };
  }
};

/**
 * Create birthday/anniversary notification with coupon data
 */
const createSpecialNotification = async (userId, type, userName, couponCode, discount, validUntil) => {
  try {
    const title = type === 'birthday' 
      ? `🎂 Happy Birthday, ${userName}!` 
      : `💍 Happy Anniversary, ${userName}!`;
    
    const message = type === 'birthday'
      ? `Celebrate your special day with ${discount}% off! Use code ${couponCode}`
      : `Celebrate your love with ${discount}% off! Use code ${couponCode}`;
    
    // Store coupon details as JSON in metadata column
    const metadata = JSON.stringify({
      type: type,
      couponCode: couponCode,
      discount: discount,
      minOrder: MIN_ORDER,
      validUntil: validUntil.toISOString()
    });
    
    await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, metadata, is_read)
      VALUES (?, ?, ?, ?, ?, FALSE)
    `, [userId, type, title, message, metadata]);
    
    console.log(`Created ${type} notification for user ${userId}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Send birthday emails to users whose birthday is today
 */
const sendBirthdayEmails = async () => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const year = today.getFullYear();
    
    const [users] = await pool.query(`
      SELECT id, name, email, birthday 
      FROM users 
      WHERE MONTH(birthday) = ? AND DAY(birthday) = ?
      AND role = 'customer'
      AND birthday IS NOT NULL
    `, [month, day]);
    
    console.log(`🎂 Found ${users.length} users with birthday today`);
    
    for (const user of users) {
      try {
        const couponCode = generateCouponCode('birthday', user.id, year, user.name);
        const { endDate } = await createCoupon(couponCode, BIRTHDAY_DISCOUNT, user.id, 'birthday');
        
        // Send email
        await sendBirthdayEmail(user.email, {
          name: user.name,
          couponCode,
          discount: BIRTHDAY_DISCOUNT,
          minOrder: MIN_ORDER,
          validDays: COUPON_VALID_DAYS
        });
        
        // Create in-app notification
        await createSpecialNotification(user.id, 'birthday', user.name, couponCode, BIRTHDAY_DISCOUNT, endDate);
        
        console.log(`✅ Birthday email + notification sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send birthday email to ${user.email}:`, error.message);
      }
    }
    
    return users.length;
  } catch (error) {
    console.error('Error in sendBirthdayEmails:', error);
    return 0;
  }
};

/**
 * Send anniversary emails to users whose anniversary is today
 */
const sendAnniversaryEmails = async () => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const year = today.getFullYear();
    
    const [users] = await pool.query(`
      SELECT id, name, email, anniversary 
      FROM users 
      WHERE MONTH(anniversary) = ? AND DAY(anniversary) = ?
      AND role = 'customer'
      AND anniversary IS NOT NULL
    `, [month, day]);
    
    console.log(`💍 Found ${users.length} users with anniversary today`);
    
    for (const user of users) {
      try {
        const couponCode = generateCouponCode('anniversary', user.id, year, user.name);
        const { endDate } = await createCoupon(couponCode, ANNIVERSARY_DISCOUNT, user.id, 'anniversary');
        
        // Send email
        await sendAnniversaryEmail(user.email, {
          name: user.name,
          couponCode,
          discount: ANNIVERSARY_DISCOUNT,
          minOrder: MIN_ORDER,
          validDays: COUPON_VALID_DAYS
        });
        
        // Create in-app notification
        await createSpecialNotification(user.id, 'anniversary', user.name, couponCode, ANNIVERSARY_DISCOUNT, endDate);
        
        console.log(`✅ Anniversary email + notification sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send anniversary email to ${user.email}:`, error.message);
      }
    }
    
    return users.length;
  } catch (error) {
    console.error('Error in sendAnniversaryEmails:', error);
    return 0;
  }
};

/**
 * Start the birthday/anniversary scheduler
 * Runs daily at 8:00 AM
 */
const startBirthdayScheduler = () => {
  console.log('🎂 Birthday/Anniversary scheduler started');
  
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily birthday/anniversary email check...');
    
    const birthdaysSent = await sendBirthdayEmails();
    const anniversariesSent = await sendAnniversaryEmails();
    
    console.log(`📧 Daily summary: ${birthdaysSent} birthday, ${anniversariesSent} anniversary emails sent`);
  });
};

module.exports = { 
  startBirthdayScheduler,
  sendBirthdayEmails,
  sendAnniversaryEmails
};
