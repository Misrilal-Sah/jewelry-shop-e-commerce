const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const wishlistRoutes = require('./routes/wishlist');
const adminRoutes = require('./routes/admin');
const newsletterRoutes = require('./routes/newsletter');
const emailPreferencesRoutes = require('./routes/emailPreferences');
const emailPreviewRoutes = require('./routes/emailPreview');
const emailManagementRoutes = require('./routes/emailManagement');
const paymentRoutes = require('./routes/payment');
const preferencesRoutes = require('./routes/preferences');
const savedRoutes = require('./routes/saved');
const alertRoutes = require('./routes/alerts');
const notificationRoutes = require('./routes/notifications');
const flashSalesRoutes = require('./routes/flashSales');
const testimonialsRoutes = require('./routes/testimonials');
const faqsRoutes = require('./routes/faqs');
const questionsRoutes = require('./routes/questions');
const blogRoutes = require('./routes/blog');
const bulkOrderRoutes = require('./routes/bulkOrders');
const logsRoutes = require('./routes/logs');
const chatbotRoutes = require('./routes/chatbot');
const commonDetailsRoutes = require('./routes/commonDetails');
const rolesRoutes = require('./routes/roles');
const backgroundsRoutes = require('./routes/backgrounds');
const requestLogger = require('./middleware/requestLogger');
const { startCampaignScheduler } = require('./scheduler/campaignScheduler');
const { startSegmentationScheduler } = require('./scheduler/segmentationScheduler');
const { startBirthdayScheduler } = require('./scheduler/birthdayScheduler');
const runPermissionTemplatesMigration = require('./migrations/runPermissionTemplates');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/email', emailPreferencesRoutes);
app.use('/api/email', emailPreviewRoutes);
app.use('/api/admin/email', emailManagementRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/flash-sales', flashSalesRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api', questionsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/common', commonDetailsRoutes);
app.use('/api/admin/roles', rolesRoutes);
app.use('/api/backgrounds', backgroundsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Jewelry Shop API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start schedulers
  startCampaignScheduler();
  startSegmentationScheduler();
  startBirthdayScheduler();
  
  // Run migrations
  runPermissionTemplatesMigration();
});

module.exports = app;
