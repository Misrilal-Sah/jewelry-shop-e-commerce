const pool = require('../config/db');
const { createNotification } = require('../controllers/notificationController');
const { sendBackInStockEmail, sendPriceDropEmail } = require('./emailService');

// Safe price formatter that won't throw on large numbers
const formatPrice = (amount) => {
  const num = parseFloat(amount) || 0;
  // Simple fallback format for safety
  return '₹' + Math.round(num).toLocaleString('en-IN');
};

/**
 * Process stock alerts when a product's stock is replenished
 * Call this when admin updates stock from 0 to > 0
 */
const processStockAlerts = async (productId, newStock) => {
  console.log(`[STOCK ALERT] Processing for product ${productId}, newStock: ${newStock}`);
  
  if (newStock <= 0) {
    console.log(`[STOCK ALERT] Skipped - stock is ${newStock}`);
    return { notified: 0 };
  }

  try {
    // Get all users subscribed to back_in_stock for this product
    const [alerts] = await pool.query(`
      SELECT 
        a.id as alert_id,
        a.user_id,
        u.email,
        u.name as user_name,
        p.name as product_name,
        p.images,
        p.metal_price,
        p.making_charges
      FROM product_alerts a
      JOIN users u ON a.user_id = u.id
      JOIN products p ON a.product_id = p.id
      WHERE a.product_id = ? 
        AND a.alert_type = 'back_in_stock' 
        AND a.is_notified = FALSE
    `, [productId]);

    console.log(`[STOCK ALERT] Found ${alerts.length} subscribers`);

    if (alerts.length === 0) {
      return { notified: 0 };
    }

    let notifiedCount = 0;

    for (const alert of alerts) {
      try {
        // Calculate price
        const price = parseFloat(alert.metal_price) + parseFloat(alert.making_charges || 0);
        const formattedPrice = formatPrice(price);

        // Get product image
        let productImage = '';
        if (alert.images) {
          try {
            const images = JSON.parse(alert.images);
            productImage = images[0] || '';
          } catch {
            productImage = alert.images;
          }
        }

        console.log(`[STOCK ALERT] Sending to ${alert.email} for ${alert.product_name}`);

        // Send email
        await sendBackInStockEmail(alert.email, {
          productName: alert.product_name,
          productImage,
          productPrice: formattedPrice,
          productId
        });

        // Create in-app notification
        await createNotification(
          alert.user_id,
          'back_in_stock',
          `${alert.product_name} is back in stock!`,
          `Great news! The item you were waiting for is now available.`,
          productImage,
          `/products/${productId}`
        );

        // Mark alert as notified
        await pool.query(
          'UPDATE product_alerts SET is_notified = TRUE, notified_at = NOW() WHERE id = ?',
          [alert.alert_id]
        );

        notifiedCount++;
        console.log(`✅ Back in stock notification sent to ${alert.email} for product ${productId}`);
      } catch (error) {
        console.error(`Failed to notify user ${alert.user_id}:`, error.message);
      }
    }

    return { notified: notifiedCount };
  } catch (error) {
    console.error('Error processing stock alerts:', error);
    return { notified: 0, error: error.message };
  }
};

/**
 * Process price drop alerts when a product's price is reduced
 * Call this when admin updates product price
 */
const processPriceDropAlerts = async (productId, newPrice, oldPrice) => {
  console.log(`[PRICE DROP] Processing for product ${productId}, oldPrice: ${oldPrice}, newPrice: ${newPrice}`);
  
  // Only trigger if price actually dropped
  if (newPrice >= oldPrice) {
    console.log(`[PRICE DROP] Skipped - price didn't drop`);
    return { notified: 0 };
  }

  const discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  console.log(`[PRICE DROP] Discount: ${discountPercent}%`);
  
  // Only notify if discount is at least 5%
  if (discountPercent < 5) {
    console.log(`[PRICE DROP] Skipped - discount < 5%`);
    return { notified: 0 };
  }

  try {
    // Get all users subscribed to price_drop for this product
    const [alerts] = await pool.query(`
      SELECT 
        a.id as alert_id,
        a.user_id,
        a.original_price,
        u.email,
        u.name as user_name,
        p.name as product_name,
        p.images
      FROM product_alerts a
      JOIN users u ON a.user_id = u.id
      JOIN products p ON a.product_id = p.id
      WHERE a.product_id = ? 
        AND a.alert_type = 'price_drop' 
        AND a.is_notified = FALSE
    `, [productId]);

    console.log(`[PRICE DROP] Found ${alerts.length} subscribers`);

    if (alerts.length === 0) {
      return { notified: 0 };
    }

    let notifiedCount = 0;

    for (const alert of alerts) {
      try {
        // Calculate user's original price (when they subscribed)
        const userOriginalPrice = parseFloat(alert.original_price) || oldPrice;
        const userDiscount = Math.round(((userOriginalPrice - newPrice) / userOriginalPrice) * 100);
        
        console.log(`[PRICE DROP] User ${alert.email}: original ${userOriginalPrice}, discount ${userDiscount}%`);
        
        // Only notify if there's a meaningful discount from their subscribe price
        if (userDiscount < 5) {
          console.log(`[PRICE DROP] Skipped user - discount < 5%`);
          continue;
        }

        // Get product image
        let productImage = '';
        if (alert.images) {
          try {
            const images = JSON.parse(alert.images);
            productImage = images[0] || '';
          } catch {
            productImage = alert.images;
          }
        }

        console.log(`[PRICE DROP] Sending to ${alert.email} for ${alert.product_name}`);

        // Send email
        await sendPriceDropEmail(alert.email, {
          productName: alert.product_name,
          productImage,
          originalPrice: formatPrice(userOriginalPrice),
          newPrice: formatPrice(newPrice),
          discountPercent: userDiscount,
          productId
        });

        // Create in-app notification
        await createNotification(
          alert.user_id,
          'price_drop',
          `${userDiscount}% OFF on ${alert.product_name}!`,
          `Price dropped from ${formatPrice(userOriginalPrice)} to ${formatPrice(newPrice)}`,
          productImage,
          `/products/${productId}`
        );

        // Mark alert as notified
        await pool.query(
          'UPDATE product_alerts SET is_notified = TRUE, notified_at = NOW() WHERE id = ?',
          [alert.alert_id]
        );

        notifiedCount++;
        console.log(`✅ Price drop notification sent to ${alert.email} for product ${productId} (${userDiscount}% off)`);
      } catch (error) {
        console.error(`Failed to notify user ${alert.user_id}:`, error.message);
      }
    }

    return { notified: notifiedCount, discountPercent };
  } catch (error) {
    console.error('Error processing price drop alerts:', error);
    return { notified: 0, error: error.message };
  }
};

/**
 * Check and process alerts after product update
 * Call this from admin product update endpoint
 */
const checkAndTriggerAlerts = async (productId, oldData, newData) => {
  console.log(`[ALERT TRIGGER] Checking alerts for product ${productId}`);
  console.log(`[ALERT TRIGGER] Old data:`, oldData);
  console.log(`[ALERT TRIGGER] New data stock:`, newData.stock, `metal_price:`, newData.metal_price);
  
  const results = { stock: null, price: null };

  // Check for stock replenishment (was 0 or null, now > 0)
  const oldStock = parseInt(oldData.stock) || 0;
  const newStock = parseInt(newData.stock) || 0;
  
  console.log(`[ALERT TRIGGER] Stock: old=${oldStock}, new=${newStock}`);
  
  if (oldStock === 0 && newStock > 0) {
    console.log(`🔔 Stock replenished for product ${productId}, processing alerts...`);
    results.stock = await processStockAlerts(productId, newStock);
  }

  // Check for price drop - only if metal_price is in the new data
  if (newData.metal_price !== undefined) {
    const oldPrice = parseFloat(oldData.metal_price) + parseFloat(oldData.making_charges || 0);
    const newPrice = parseFloat(newData.metal_price) + parseFloat(newData.making_charges || 0);
    
    console.log(`[ALERT TRIGGER] Price: old=${oldPrice}, new=${newPrice}`);
    
    if (newPrice < oldPrice) {
      console.log(`📉 Price dropped for product ${productId}, processing alerts...`);
      results.price = await processPriceDropAlerts(productId, newPrice, oldPrice);
    }
  }

  return results;
};

module.exports = {
  processStockAlerts,
  processPriceDropAlerts,
  checkAndTriggerAlerts
};

