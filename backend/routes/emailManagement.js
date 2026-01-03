const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const campaignController = require('../controllers/emailCampaignController');
const templateController = require('../controllers/emailTemplateController');

// All routes require admin auth
router.use(authMiddleware);
router.use(adminMiddleware);

// Email Stats & Dashboard
router.get('/stats', requirePermission('email', 'view'), campaignController.getEmailStats);

// Campaign Routes
router.get('/campaigns', requirePermission('email', 'view'), campaignController.getCampaigns);
router.get('/campaigns/:id', requirePermission('email', 'view'), campaignController.getCampaignById);
router.post('/campaigns', requirePermission('email', 'send'), campaignController.createCampaign);
router.put('/campaigns/:id', requirePermission('email', 'send'), campaignController.updateCampaign);
router.delete('/campaigns/:id', requirePermission('email', 'send'), campaignController.deleteCampaign);
router.post('/campaigns/:id/send', requirePermission('email', 'send'), campaignController.sendCampaign);
router.post('/campaigns/:id/schedule', requirePermission('email', 'send'), campaignController.scheduleCampaign);
router.post('/campaigns/:id/cancel', requirePermission('email', 'send'), campaignController.cancelScheduled);

// Template Routes
router.get('/templates', requirePermission('email', 'view'), templateController.getTemplates);
router.get('/templates/:id', requirePermission('email', 'view'), templateController.getTemplateById);
router.post('/templates', requirePermission('email', 'send'), templateController.createTemplate);
router.put('/templates/:id', requirePermission('email', 'send'), templateController.updateTemplate);
router.delete('/templates/:id', requirePermission('email', 'send'), templateController.deleteTemplate);
router.post('/templates/:id/preview', requirePermission('email', 'view'), templateController.previewTemplate);
router.post('/templates/preview-by-type', requirePermission('email', 'view'), templateController.previewByType);

// Subscriber Routes
router.get('/subscribers', requirePermission('email', 'view'), campaignController.getSubscribers);
router.delete('/subscribers/:id', requirePermission('email', 'send'), campaignController.deleteSubscriber);

module.exports = router;

