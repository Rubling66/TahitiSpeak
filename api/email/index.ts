import { Router } from 'express';
import * as sendRoutes from './send';
import * as templateRoutes from './templates';
import * as webhookRoutes from './webhooks';
import * as analyticsRoutes from './analytics';
import * as preferencesRoutes from './preferences';
import * as monitoringRoutes from './monitoring';

const router = Router();

// Email sending routes
router.post('/send', sendRoutes.sendEmail);
router.post('/send/bulk', sendRoutes.sendBulkEmail);
router.post('/send/scheduled', sendRoutes.scheduleEmail);
router.get('/send/:emailId/status', sendRoutes.getEmailStatus);
router.delete('/send/:emailId/cancel', sendRoutes.cancelScheduledEmail);

// Template management routes
router.get('/templates', templateRoutes.getTemplates);
router.get('/templates/:templateId', templateRoutes.getTemplate);
router.post('/templates', templateRoutes.createTemplate);
router.put('/templates/:templateId', templateRoutes.updateTemplate);
router.delete('/templates/:templateId', templateRoutes.deleteTemplate);
router.post('/templates/:templateId/preview', templateRoutes.previewTemplate);
router.post('/templates/:templateId/validate', templateRoutes.validateTemplate);
router.get('/templates/:templateId/analytics', templateRoutes.getTemplateAnalytics);

// Webhook routes
router.post('/webhooks/sendgrid', webhookRoutes.handleSendGridWebhook);
router.post('/webhooks/resend', webhookRoutes.handleResendWebhook);
router.post('/webhooks/generic', webhookRoutes.handleGenericWebhook);
router.get('/webhooks/setup', webhookRoutes.getWebhookSetup);
router.post('/webhooks/test', webhookRoutes.testWebhook);
router.get('/webhooks/events', webhookRoutes.getWebhookEvents);
router.get('/webhooks/stats', webhookRoutes.getWebhookStats);

// Analytics routes
router.get('/analytics/summary', analyticsRoutes.getAnalyticsSummary);
router.get('/analytics/delivery', analyticsRoutes.getDeliveryMetrics);
router.get('/analytics/engagement', analyticsRoutes.getEngagementMetrics);
router.get('/analytics/templates', analyticsRoutes.getTemplatePerformance);
router.get('/analytics/campaigns', analyticsRoutes.getCampaignAnalytics);
router.get('/analytics/realtime', analyticsRoutes.getRealtimeAnalytics);
router.get('/analytics/bounces', analyticsRoutes.getBounceAnalysis);
router.get('/analytics/users', analyticsRoutes.getUserEngagement);
router.get('/analytics/export', analyticsRoutes.exportAnalytics);

// Preferences routes
router.get('/preferences/:userId', preferencesRoutes.getUserPreferences);
router.put('/preferences/:userId', preferencesRoutes.updateUserPreferences);
router.post('/preferences/bulk', preferencesRoutes.bulkUpdatePreferences);
router.get('/preferences', preferencesRoutes.getAllPreferences);
router.post('/preferences/:userId/unsubscribe', preferencesRoutes.unsubscribeUser);
router.post('/preferences/:userId/resubscribe', preferencesRoutes.resubscribeUser);
router.get('/preferences/:userId/unsubscribe-link', preferencesRoutes.generateUnsubscribeLink);
router.get('/preferences/:userId/preference-center', preferencesRoutes.generatePreferenceCenterLink);
router.get('/preferences/stats/unsubscribe', preferencesRoutes.getUnsubscribeStats);
router.get('/preferences/export', preferencesRoutes.exportPreferences);

// Monitoring and security routes
router.get('/monitoring/dashboard', monitoringRoutes.getMonitoringDashboard);
router.get('/monitoring/alerts', monitoringRoutes.getActiveAlerts);
router.post('/monitoring/alerts/:alertId/resolve', monitoringRoutes.resolveAlert);
router.get('/monitoring/quota', monitoringRoutes.getQuotaUsage);
router.get('/monitoring/health', monitoringRoutes.checkProviderHealth);
router.post('/monitoring/check', monitoringRoutes.runMonitoringCheck);

// GDPR compliance routes
router.post('/gdpr/consent', monitoringRoutes.recordConsent);
router.post('/gdpr/consent/withdraw', monitoringRoutes.withdrawConsent);
router.get('/gdpr/consent/:userId', monitoringRoutes.getUserConsentHistory);
router.post('/gdpr/export', monitoringRoutes.requestDataExport);
router.post('/gdpr/delete', monitoringRoutes.requestDataDeletion);
router.get('/gdpr/report', monitoringRoutes.getComplianceReport);
router.get('/gdpr/audit', monitoringRoutes.getAuditLogs);
router.post('/gdpr/validate', monitoringRoutes.validateEmailCompliance);

export default router;