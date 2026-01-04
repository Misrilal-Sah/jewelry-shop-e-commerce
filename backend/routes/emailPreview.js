const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Email preview landing page
router.get('/preview', (req, res) => {
  res.send(emailService.getEmailPreviewHTML());
});

// Preview OTP email
router.get('/preview/otp', (req, res) => {
  const html = emailService.getOTPEmailTemplate('123456', 'signup');
  res.send(html);
});

// Preview Welcome Newsletter
router.get('/preview/newsletter', (req, res) => {
  const html = emailService.getWelcomeNewsletterTemplate('test@example.com');
  res.send(html);
});

// Preview Special Offers
router.get('/preview/offers', (req, res) => {
  const html = emailService.getSpecialOffersTemplate('test@example.com', {
    discount: '25',
    code: 'SPARKLE25',
    validUntil: '31st January 2025'
  });
  res.send(html);
});

// Preview Festive Greetings
router.get('/preview/festive', (req, res) => {
  const html = emailService.getFestiveEmailTemplate('test@example.com', {
    festival: 'Diwali',
    greeting: 'May your life sparkle like diamonds and shine like gold!'
  });
  res.send(html);
});

// Preview New Arrivals
router.get('/preview/arrivals', (req, res) => {
  const html = emailService.getNewArrivalsTemplate('test@example.com', []);
  res.send(html);
});

// Preview Order Confirmation
router.get('/preview/order', (req, res) => {
  const html = emailService.getOrderConfirmationTemplate({
    orderId: 'ALK-2024-12345',
    customerName: 'Priya Sharma',
    items: [],
    total: '₹1,25,000'
  });
  res.send(html);
});

// Preview Admin Promotion Email
router.get('/preview/admin-promotion', (req, res) => {
  const html = emailService.getAdminPromotionTemplate({
    name: 'Priya Sharma',
    email: 'priya@example.com'
  });
  res.send(html);
});

// Preview Back In Stock Email
router.get('/preview/back-in-stock', async (req, res) => {
  try {
    // Fetch a real product from database for preview
    const pool = require('../config/db');
    const [products] = await pool.query('SELECT id, name, metal_price, making_charges, images FROM products WHERE is_active = TRUE LIMIT 1');
    
    let productData = {
      productName: 'Royal Diamond Solitaire Ring',
      productImage: 'https://res.cloudinary.com/dbylfhbnz/image/upload/v1/jewllery_shop/products/sample.jpg',
      productPrice: '₹85,000',
      productId: 1
    };
    
    if (products.length > 0) {
      const product = products[0];
      const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      const totalPrice = parseFloat(product.metal_price || 0) + parseFloat(product.making_charges || 0);
      productData = {
        productName: product.name,
        productImage: images?.[0] || productData.productImage,
        productPrice: `₹${totalPrice.toLocaleString('en-IN')}`,
        productId: product.id
      };
    }
    
    const html = emailService.getBackInStockTemplate('test@example.com', productData);
    res.send(html);
  } catch (error) {
    res.status(500).send('Error generating preview: ' + error.message);
  }
});

// Preview Price Drop Email
router.get('/preview/price-drop', async (req, res) => {
  try {
    // Fetch a real product from database for preview
    const pool = require('../config/db');
    const [products] = await pool.query('SELECT id, name, metal_price, making_charges, images FROM products WHERE is_active = TRUE LIMIT 1 OFFSET 1');
    
    let productData = {
      productName: 'Traditional Gold Necklace Set',
      productImage: 'https://res.cloudinary.com/dbylfhbnz/image/upload/v1/jewllery_shop/products/sample.jpg',
      originalPrice: '₹1,50,000',
      newPrice: '₹1,27,500',
      discountPercent: 15,
      productId: 2
    };
    
    if (products.length > 0) {
      const product = products[0];
      const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      const originalPrice = parseFloat(product.metal_price || 0) + parseFloat(product.making_charges || 0);
      const newPrice = Math.round(originalPrice * 0.85); // 15% discount
      productData = {
        productName: product.name,
        productImage: images?.[0] || productData.productImage,
        originalPrice: `₹${originalPrice.toLocaleString('en-IN')}`,
        newPrice: `₹${newPrice.toLocaleString('en-IN')}`,
        discountPercent: 15,
        productId: product.id
      };
    }
    
    const html = emailService.getPriceDropTemplate('test@example.com', productData);
    res.send(html);
  } catch (error) {
    res.status(500).send('Error generating preview: ' + error.message);
  }
});

// Preview Bulk Order Customer Confirmation Email
router.get('/preview/bulk-order-customer', (req, res) => {
  const html = emailService.getBulkOrderCustomerConfirmationTemplate({
    name: 'Rahul Mehta',
    email: 'rahul@company.com',
    category: 'Rings',
    quantity: 50,
    budget_range: '₹5,00,000 - ₹10,00,000',
    inquiryId: 1
  });
  res.send(html);
});

// Preview Bulk Order Admin Notification Email
router.get('/preview/bulk-order-admin', (req, res) => {
  const html = emailService.getBulkOrderAdminNotificationTemplate({
    customerName: 'Rahul Mehta',
    customerEmail: 'rahul@company.com',
    customerPhone: '+91 9876543210',
    companyName: 'Mehta Jewellers',
    category: 'Rings',
    quantity: 50,
    budgetRange: '₹5,00,000 - ₹10,00,000',
    message: 'Looking for 22K gold wedding rings with custom engraving. Need samples first before bulk order.',
    inquiryId: 1
  });
  res.send(html);
});

// Preview Birthday Email
router.get('/preview/birthday', (req, res) => {
  const html = emailService.getBirthdayEmailTemplate('test@example.com', {
    name: 'Priya Sharma',
    couponCode: 'BDAY-123-2026',
    discount: 15,
    minOrder: 1000,
    validDays: 7
  });
  res.send(html);
});

// Preview Anniversary Email
router.get('/preview/anniversary', (req, res) => {
  const html = emailService.getAnniversaryEmailTemplate('test@example.com', {
    name: 'Priya Sharma',
    couponCode: 'ANNIV-123-2026',
    discount: 10,
    minOrder: 1000,
    validDays: 7
  });
  res.send(html);
});

module.exports = router;

