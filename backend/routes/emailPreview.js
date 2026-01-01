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
router.get('/preview/back-in-stock', (req, res) => {
  const html = emailService.getBackInStockTemplate('test@example.com', {
    productName: 'Royal Diamond Solitaire Ring',
    productImage: '/uploads/products/diamond-ring.jpg',
    productPrice: '₹85,000',
    productId: 1
  });
  res.send(html);
});

// Preview Price Drop Email
router.get('/preview/price-drop', (req, res) => {
  const html = emailService.getPriceDropTemplate('test@example.com', {
    productName: 'Traditional Gold Necklace Set',
    productImage: '/uploads/products/gold-necklace.jpg',
    originalPrice: '₹1,50,000',
    newPrice: '₹1,27,500',
    discountPercent: 15,
    productId: 2
  });
  res.send(html);
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

