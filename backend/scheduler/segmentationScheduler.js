/**
 * Customer Segmentation Scheduler
 * Runs daily to update RF scores and segments for all customers
 */
const cron = require('node-cron');
const { updateAllCustomerSegments } = require('../services/customerSegmentationService');

const startSegmentationScheduler = () => {
  console.log('🎯 Customer segmentation scheduler started');
  
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running scheduled customer segmentation...');
    await updateAllCustomerSegments();
  });
  
  // Also run on startup (after 5 second delay to let DB connect)
  setTimeout(async () => {
    console.log('🎯 Running initial customer segmentation...');
    await updateAllCustomerSegments();
  }, 5000);
};

module.exports = { startSegmentationScheduler };
