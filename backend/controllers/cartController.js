const pool = require('../config/db');

// Get cart items
const getCart = async (req, res) => {
  try {
    // Join with flash_sales to get active flash sale for each product
    const [items] = await pool.query(
      `SELECT c.*, p.name, p.images, p.metal_price, p.making_charges, p.gst_percent, p.stock,
              fs.id as flash_sale_id, fs.discount_percentage, fs.flash_price, fs.end_time as flash_end_time
       FROM cart c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN flash_sales fs ON p.id = fs.product_id 
         AND fs.is_active = TRUE 
         AND fs.start_time <= NOW() 
         AND fs.end_time > NOW()
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    // Calculate totals
    let subtotal = 0;
    let gstTotal = 0;

    const cartItems = items.map(item => {
      const basePrice = parseFloat(item.metal_price) + parseFloat(item.making_charges);
      
      // Check if flash sale is active for this product
      let itemPrice = basePrice;
      let flashSaleApplied = false;
      let flashSaleDiscount = 0;
      
      if (item.flash_sale_id) {
        flashSaleApplied = true;
        flashSaleDiscount = parseFloat(item.discount_percentage);
        // Use flash_price if set, otherwise calculate from discount
        itemPrice = item.flash_price 
          ? parseFloat(item.flash_price) 
          : basePrice * (1 - flashSaleDiscount / 100);
      }
      
      const itemTotal = itemPrice * item.quantity;
      const itemGst = itemTotal * (parseFloat(item.gst_percent) / 100);
      
      subtotal += itemTotal;
      gstTotal += itemGst;

      return {
        ...item,
        item_price: itemPrice,
        item_total: itemTotal,
        item_gst: itemGst,
        original_price: basePrice,
        flash_sale_applied: flashSaleApplied,
        flash_sale_discount: flashSaleDiscount,
        flash_end_time: item.flash_end_time
      };
    });

    res.json({
      items: cartItems,
      subtotal,
      gst: gstTotal,
      total: subtotal + gstTotal
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1, size } = req.body;

    // Check product exists and has stock
    const [products] = await pool.query(
      'SELECT stock FROM products WHERE id = ? AND is_active = TRUE',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (products[0].stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Check if already in cart
    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL))',
      [req.user.id, product_id, size, size]
    );

    if (existing.length > 0) {
      // Update quantity
      const newQty = existing[0].quantity + quantity;
      if (newQty > products[0].stock) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      // Insert new item
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)',
        [req.user.id, product_id, quantity, size]
      );
    }

    res.json({ message: 'Added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update cart item
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Check stock
    const [items] = await pool.query(
      `SELECT c.*, p.stock FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [id, req.user.id]
    );

    if (items.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity > items[0].stock) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, id]);
    res.json({ message: 'Cart updated' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate and apply coupon
const validateCoupon = async (req, res) => {
  try {
    const { code, cart_total } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    // Find coupon
    const [coupons] = await pool.query(
      'SELECT * FROM coupons WHERE code = ? AND is_active = 1',
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    const coupon = coupons[0];

    // Check date validity
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (now < startDate) {
      return res.status(400).json({ message: 'This coupon is not yet active' });
    }

    if (now > endDate) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'This coupon has reached its usage limit' });
    }

    // Check minimum order amount
    if (cart_total < coupon.min_order_amount) {
      return res.status(400).json({ 
        message: `Minimum order of ₹${coupon.min_order_amount} required for this coupon` 
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (cart_total * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = parseFloat(coupon.max_discount);
      }
    } else {
      discount = parseFloat(coupon.discount_value);
    }

    // Ensure discount doesn't exceed cart total
    if (discount > cart_total) {
      discount = cart_total;
    }

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      },
      discount: Math.round(discount),
      message: `Coupon applied! You save ₹${Math.round(discount)}`
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCoupon
};

