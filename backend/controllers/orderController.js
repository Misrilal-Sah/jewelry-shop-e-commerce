const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendOrderStatusSMS } = require('../services/smsService');

// Create order
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      address_id, 
      payment_method, 
      coupon_code, 
      coupon_id, 
      discount_amount, 
      notes,
      is_gift = false,
      gift_message = null,
      gift_recipient_name = null
    } = req.body;

    // Get cart items
    const [cartItems] = await connection.query(
      `SELECT c.*, p.name, p.metal_price, p.making_charges, p.gst_percent, p.stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Get shipping address
    const [addresses] = await connection.query(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
      [address_id, req.user.id]
    );

    if (addresses.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid address' });
    }

    // Calculate totals
    let subtotal = 0;
    let gstTotal = 0;

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }

      const itemPrice = (parseFloat(item.metal_price) + parseFloat(item.making_charges)) * item.quantity;
      const itemGst = itemPrice * (parseFloat(item.gst_percent) / 100);
      subtotal += itemPrice;
      gstTotal += itemGst;
    }

    // Use discount from request (already validated on frontend) or calculate from coupon
    let discount = discount_amount || 0;
    let usedCouponCode = coupon_code || null;

    // If coupon code provided but no discount_amount, calculate it
    if (coupon_code && !discount_amount) {
      const [coupons] = await connection.query(
        `SELECT * FROM coupons 
         WHERE code = ? AND is_active = TRUE 
         AND start_date <= NOW() AND end_date >= NOW()
         AND (usage_limit IS NULL OR used_count < usage_limit)`,
        [coupon_code]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        if (subtotal >= parseFloat(coupon.min_order_amount)) {
          if (coupon.discount_type === 'percentage') {
            discount = subtotal * (parseFloat(coupon.discount_value) / 100);
            if (coupon.max_discount) {
              discount = Math.min(discount, parseFloat(coupon.max_discount));
            }
          } else {
            discount = parseFloat(coupon.discount_value);
          }
        }
      }
    }

    // Update coupon used_count if coupon was applied
    if (usedCouponCode && discount > 0) {
      await connection.query(
        'UPDATE coupons SET used_count = used_count + 1 WHERE code = ?',
        [usedCouponCode]
      );
    }

    const totalAmount = subtotal + gstTotal - discount;
    const orderNumber = `JWL${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Map payment method for database ENUM compatibility
    // 'online' gets set to 'upi' initially, will be updated after Razorpay returns actual method
    const dbPaymentMethod = payment_method === 'online' ? 'upi' : payment_method;

    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, user_id, subtotal, gst_amount, total_amount, payment_method, 
       shipping_address, coupon_code, discount_amount, notes, payment_status, status,
       is_gift, gift_message, gift_recipient_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        req.user.id,
        subtotal,
        gstTotal,
        totalAmount,
        dbPaymentMethod,
        JSON.stringify(addresses[0]),
        coupon_code,
        discount,
        notes,
        'pending',
        payment_method === 'cod' ? 'confirmed' : 'placed',
        is_gift || false,
        gift_message || null,
        gift_recipient_name || null
      ]
    );

    const orderId = orderResult.insertId;

    // Create order items and update stock
    for (const item of cartItems) {
      const itemPrice = parseFloat(item.metal_price) + parseFloat(item.making_charges);
      const itemTotal = itemPrice * item.quantity;
      const itemGst = itemTotal * (parseFloat(item.gst_percent) / 100);

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, size, 
         metal_price, making_charges, gst_amount, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.name,
          item.quantity,
          item.size,
          item.metal_price,
          item.making_charges,
          itemGst,
          itemTotal + itemGst
        ]
      );

      // Update stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    await connection.commit();

    // Send confirmation SMS for COD orders (non-blocking)
    if (payment_method === 'cod') {
      const [user] = await pool.query('SELECT name, phone FROM users WHERE id = ?', [req.user.id]);
      if (user[0]?.phone) {
        sendOrderStatusSMS(user[0].phone, {
          orderId: orderId,
          customerName: user[0].name,
          totalAmount: totalAmount
        }, 'confirmed').catch(err => console.error('SMS error:', err));
      }
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: orderId,
        order_number: orderNumber,
        total: totalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// Get user orders
const getOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Fetch order items
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [req.params.id]
    );

    // Fetch address if address_id exists
    let address = null;
    if (order.address_id) {
      const [addresses] = await pool.query(
        'SELECT * FROM addresses WHERE id = ?',
        [order.address_id]
      );
      if (addresses.length > 0) {
        address = addresses[0];
      }
    }

    res.json({ ...order, items, address });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['placed', 'confirmed'].includes(orders[0].status)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    // Restore stock
    const [items] = await connection.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [req.params.id]
    );

    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await connection.query(
      'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
      ['cancelled', orders[0].payment_status === 'paid' ? 'refunded' : 'pending', req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder
};
