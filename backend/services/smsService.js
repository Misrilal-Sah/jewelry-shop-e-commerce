const axios = require('axios');
require('dotenv').config();

/**
 * SMS Service using Fast2SMS API
 * Sends order status notifications to customers
 */

const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_ENABLED = process.env.SMS_ENABLED === 'true';
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Format phone number for SMS
 * Removes +91 prefix if present, keeps only 10 digits
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  // Remove any non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  // If starts with 91 and is 12 digits, remove 91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }
  // If starts with 0, remove it
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  // Return only if 10 digits
  return cleaned.length === 10 ? cleaned : null;
};

/**
 * Format price in INR
 */
const formatPrice = (amount) => {
  try {
    // Convert to number first
    const num = Number(amount);
    // Check if valid number
    if (!Number.isFinite(num) || num < 0) {
      return '₹0';
    }
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  } catch (e) {
    console.error('formatPrice error:', e, 'amount:', amount);
    return '₹0';
  }
};

/**
 * Get SMS message template based on order status
 */
const getOrderStatusMessage = (status, orderData) => {
  const { orderId, customerName, totalAmount, trackingUrl } = orderData;
  const name = customerName?.split(' ')[0] || 'Customer'; // First name only
  
  const messages = {
    confirmed: `Hi ${name}! Your Aabhar order #${orderId} is confirmed. Total: ${formatPrice(totalAmount)}. We're preparing it for shipment!`,
    
    packed: `Hi ${name}! Great news - your order #${orderId} has been packed and is ready for dispatch. You'll receive tracking details soon!`,
    
    shipped: `Hi ${name}! Your order #${orderId} has been shipped! Expected delivery: 3-5 business days.${trackingUrl ? ` Track: ${trackingUrl}` : ''}`,
    
    delivered: `Hi ${name}! Your Aabhar order #${orderId} has been delivered. Thank you for shopping with us! Enjoy your beautiful jewelry!`,
    
    cancelled: `Hi ${name}, your order #${orderId} has been cancelled. If payment was made, refund will be processed in 5-7 business days.`
  };
  
  return messages[status] || null;
};

/**
 * Send SMS using Fast2SMS API
 * @param {string} phone - Customer phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - API response
 */
const sendSMS = async (phone, message) => {
  if (!SMS_ENABLED) {
    console.log('📱 SMS disabled. Would have sent:', { phone, message });
    return { success: true, disabled: true };
  }

  if (!SMS_API_KEY) {
    console.error('❌ SMS API key not configured');
    return { success: false, error: 'SMS API key not configured' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    console.error('❌ Invalid phone number:', phone);
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const response = await axios.get(FAST2SMS_URL, {
      params: {
        authorization: SMS_API_KEY,
        message: message,
        language: 'english',
        route: 'q', // Quick SMS route (for testing/promotional)
        numbers: formattedPhone
      }
    });

    if (response.data.return === true) {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
      return { success: true, response: response.data };
    } else {
      console.error('❌ SMS sending failed:', response.data);
      return { success: false, error: response.data.message || 'SMS sending failed' };
    }
  } catch (error) {
    console.error('❌ SMS API error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send order status SMS notification
 * @param {string} phone - Customer phone number
 * @param {Object} orderData - Order details
 * @param {string} status - New order status
 * @returns {Promise<Object>} - Result of SMS send
 */
const sendOrderStatusSMS = async (phone, orderData, status) => {
  const message = getOrderStatusMessage(status, orderData);
  
  if (!message) {
    console.log(`ℹ️ No SMS template for status: ${status}`);
    return { success: false, error: 'No template for this status' };
  }

  console.log(`📱 Sending ${status} SMS for order #${orderData.orderId} to ${phone}`);
  return await sendSMS(phone, message);
};

/**
 * Send custom SMS
 * @param {string} phone - Phone number
 * @param {string} message - Custom message
 * @returns {Promise<Object>} - Result
 */
const sendCustomSMS = async (phone, message) => {
  return await sendSMS(phone, message);
};

module.exports = {
  sendOrderStatusSMS,
  sendCustomSMS,
  sendSMS,
  formatPhoneNumber,
  getOrderStatusMessage
};
