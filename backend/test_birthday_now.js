/**
 * Test Birthday & Anniversary Scheduler - Triggers both for same email
 * Usage: node test_birthday_now.js
 */

const pool = require('./config/db');
const { sendBirthdayEmails, sendAnniversaryEmails } = require('./scheduler/birthdayScheduler');

const TEST_EMAIL = 'misrilalsah09@gmail.com';

async function testBirthdayAndAnniversary() {
  try {
    console.log('🧪 Starting Birthday & Anniversary Test...\n');
    
    // Update user's birthday to today
    const today = new Date();
    await pool.query('UPDATE users SET birthday = ?, anniversary = ? WHERE email = ?', [today, today, TEST_EMAIL]);
    console.log(`✅ Updated ${TEST_EMAIL} birthday & anniversary to today (${today.toDateString()})\n`);
    
    // Run the birthday scheduler
    console.log('🎂 Triggering BIRTHDAY scheduler...');
    const bdayCount = await sendBirthdayEmails();
    console.log(`   ✅ Birthday emails sent: ${bdayCount}\n`);
    
    // Run the anniversary scheduler
    console.log('💍 Triggering ANNIVERSARY scheduler...');
    const annivCount = await sendAnniversaryEmails();
    console.log(`   ✅ Anniversary emails sent: ${annivCount}\n`);
    
    console.log('========================================');
    console.log(`� Test Complete!`);
    console.log(`🎂 Birthday: ${bdayCount} email(s) + notification(s)`);
    console.log(`� Anniversary: ${annivCount} email(s) + notification(s)`);
    console.log('========================================\n');
    
    console.log('✅ Check your inbox for 2 emails:');
    console.log('   - Birthday email with coupon');
    console.log('   - Anniversary email with coupon');
    console.log('\n✅ Check notifications page for 2 celebrations!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testBirthdayAndAnniversary();
