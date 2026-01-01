const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in INR (will be converted to paise)
 * @param {string} receipt - Unique receipt ID
 * @param {object} notes - Additional notes
 */
const createOrder = async (amount, receipt, notes = {}) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: receipt,
      notes: notes,
      payment_capture: 1 // Auto capture payment
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay create order error:', error);
    throw error;
  }
};

/**
 * Verify payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Payment signature from Razorpay
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Fetch payment details
 * @param {string} paymentId - Razorpay payment ID
 */
const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay fetch payment error:', error);
    throw error;
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in INR (optional, full refund if not provided)
 */
const refundPayment = async (paymentId, amount = null) => {
  try {
    const options = {};
    if (amount) {
      options.amount = Math.round(amount * 100); // Convert to paise
    }
    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw error;
  }
};

/**
 * Fetch order details
 * @param {string} orderId - Razorpay order ID
 */
const fetchOrder = async (orderId) => {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Razorpay fetch order error:', error);
    throw error;
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  refundPayment,
  fetchOrder
};
