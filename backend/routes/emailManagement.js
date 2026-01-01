const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const campaignController = require('../controllers/emailCampaignController');
const templateController = require('../controllers/emailTemplateController');

// All routes require admin auth
router.use(authMiddleware);
router.use(adminMiddleware);

// Email Stats & Dashboard
router.get('/stats', campaignController.getEmailStats);

// Campaign Routes
router.get('/campaigns', campaignController.getCampaigns);
router.get('/campaigns/:id', campaignController.getCampaignById);
router.post('/campaigns', campaignController.createCampaign);
router.put('/campaigns/:id', campaignController.updateCampaign);
router.delete('/campaigns/:id', campaignController.deleteCampaign);
router.post('/campaigns/:id/send', campaignController.sendCampaign);
router.post('/campaigns/:id/schedule', campaignController.scheduleCampaign);
router.post('/campaigns/:id/cancel', campaignController.cancelScheduled);

// Template Routes
router.get('/templates', templateController.getTemplates);
router.get('/templates/:id', templateController.getTemplateById);
router.post('/templates', templateController.createTemplate);
router.put('/templates/:id', templateController.updateTemplate);
router.delete('/templates/:id', templateController.deleteTemplate);
router.post('/templates/:id/preview', templateController.previewTemplate);
router.post('/templates/preview-by-type', templateController.previewByType);

// Subscriber Routes
router.get('/subscribers', campaignController.getSubscribers);
router.delete('/subscribers/:id', campaignController.deleteSubscriber);

module.exports = router;
