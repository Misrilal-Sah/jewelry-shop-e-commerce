const pool = require('../config/db');
const razorpayService = require('../services/razorpayService');
const { sendOrderStatusSMS } = require('../services/smsService');

// Create a payment order
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Get order details
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    // Create Razorpay order
    const receipt = `order_${orderId}_${Date.now()}`;
    const razorpayOrder = await razorpayService.createOrder(
      parseFloat(order.total_amount),
      receipt,
      { 
        order_id: orderId.toString(),
        user_id: userId.toString()
      }
    );

    // Store Razorpay order ID in database
    await pool.query(
      'UPDATE orders SET razorpay_order_id = ? WHERE id = ?',
      [razorpayOrder.id, orderId]
    );

    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

// Verify payment and update order
const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = req.body;

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpayService.fetchPayment(razorpay_payment_id);

    // Update order with payment details
    await pool.query(
      `UPDATE orders SET 
        payment_status = 'paid',
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        payment_method = ?,
        paid_at = NOW(),
        status = 'confirmed'
      WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, payment.method, orderId]
    );

    // Insert payment record
    await pool.query(
      `INSERT INTO payments (
        order_id, razorpay_order_id, razorpay_payment_id, 
        amount, currency, status, method, 
        bank, wallet, vpa, card_last4, card_network,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        payment.amount / 100, // Convert from paise
        payment.currency,
        payment.status,
        payment.method,
        payment.bank || null,
        payment.wallet || null,
        payment.vpa || null,
        payment.card ? payment.card.last4 : null,
        payment.card ? payment.card.network : null
      ]
    );

    // Send confirmation SMS (non-blocking)
    const [users] = await pool.query(
      'SELECT u.name, u.phone, o.total_amount FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );
    if (users[0]?.phone) {
      sendOrderStatusSMS(users[0].phone, {
        orderId: orderId,
        customerName: users[0].name,
        totalAmount: users[0].total_amount
      }, 'confirmed').catch(err => console.error('SMS error:', err));
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: razorpay_payment_id,
        method: payment.method,
        amount: payment.amount / 100
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// Get payment details
const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Verify order belongs to user (or user is admin)
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];
    if (order.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get payment record
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );

    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment: payments[0] });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process refund (Admin only)
const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    // Get order and payment details
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    if (!order.razorpay_payment_id) {
      return res.status(400).json({ message: 'No payment found for this order' });
    }

    // Process refund through Razorpay
    const refund = await razorpayService.refundPayment(
      order.razorpay_payment_id,
      amount || null
    );

    // Update order status
    await pool.query(
      `UPDATE orders SET 
        payment_status = ?,
        refund_id = ?,
        refund_amount = ?,
        refund_reason = ?,
        refunded_at = NOW()
      WHERE id = ?`,
      [
        amount && amount < order.total_amount ? 'partial_refund' : 'refunded',
        refund.id,
        refund.amount / 100,
        reason || 'Customer request',
        orderId
      ]
    );

    // Insert refund record
    await pool.query(
      `INSERT INTO refunds (
        order_id, razorpay_refund_id, payment_id,
        amount, reason, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderId,
        refund.id,
        order.razorpay_payment_id,
        refund.amount / 100,
        reason || 'Customer request',
        refund.status
      ]
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Refund processing failed' });
  }
};

// Razorpay webhook handler
const handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify webhook signature if secret is set
    if (secret) {
      const signature = req.headers['x-razorpay-signature'];
      const shasum = require('crypto').createHmac('sha256', secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');
      
      if (signature !== digest) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    switch (event) {
      case 'payment.captured':
        // Payment successful - update order
        const payment = payload.payment.entity;
        const orderId = payment.notes?.order_id;
        
        if (orderId) {
          await pool.query(
            `UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = ?`,
            [orderId]
          );
        }
        break;

      case 'payment.failed':
        // Payment failed
        const failedPayment = payload.payment.entity;
        const failedOrderId = failedPayment.notes?.order_id;
        
        if (failedOrderId) {
          await pool.query(
            `UPDATE orders SET payment_status = 'failed' WHERE id = ?`,
            [failedOrderId]
          );
        }
        break;

      case 'refund.created':
        // Refund initiated
        console.log('Refund created:', payload.refund.entity.id);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// Get Razorpay key for frontend
const getPaymentKey = async (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  processRefund,
  handleWebhook,
  getPaymentKey
};
