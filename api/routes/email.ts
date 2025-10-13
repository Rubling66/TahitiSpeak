import express from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { EmailService } from '../../src/services/EmailService';
import { initializeEmailTemplates } from '../../src/services/email/EmailTemplates';

const router = express.Router();
const emailService = new EmailService();

// Validation schemas
const sendEmailSchema = z.object({
  templateName: z.string().min(1),
  recipient: z.string().email(),
  templateData: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
});

const bulkEmailSchema = z.object({
  templateName: z.string().min(1),
  recipients: z.array(z.object({
    email: z.string().email(),
    templateData: z.record(z.any()).optional()
  })),
  scheduledFor: z.string().datetime().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
});

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional()
});

const preferencesSchema = z.object({
  welcomeEmails: z.boolean().optional(),
  lessonReminders: z.boolean().optional(),
  progressUpdates: z.boolean().optional(),
  achievementNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
  timezone: z.string().optional(),
  preferredTime: z.string().optional()
});

// Middleware for authentication
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Email sending endpoints
router.post('/send', requireAuth, async (req, res) => {
  try {
    const validatedData = sendEmailSchema.parse(req.body);
    
    const result = await emailService.sendEmail(
      validatedData.templateName,
      validatedData.recipient,
      validatedData.templateData || {},
      {
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
        priority: validatedData.priority || 'normal'
      }
    );

    if (result.success) {
      res.json({ 
        success: true, 
        messageId: result.messageId,
        queueId: result.queueId 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Send email error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to send email' });
  }
});

router.post('/send/bulk', requireAuth, async (req, res) => {
  try {
    const validatedData = bulkEmailSchema.parse(req.body);
    
    const results = await emailService.sendBulkEmail(
      validatedData.templateName,
      validatedData.recipients,
      {
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
        priority: validatedData.priority || 'normal'
      }
    );

    res.json({ 
      success: true, 
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Bulk send email error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to send bulk emails' });
  }
});

// Template management endpoints
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const templates = await emailService.getTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/templates/:name', requireAuth, async (req, res) => {
  try {
    const template = await emailService.getTemplate(req.params.name);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.post('/templates', requireAuth, async (req, res) => {
  try {
    const validatedData = templateSchema.parse(req.body);
    
    const template = await emailService.createTemplate(validatedData);
    res.status(201).json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid template data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/templates/:name', requireAuth, async (req, res) => {
  try {
    const validatedData = templateSchema.partial().parse(req.body);
    
    const template = await emailService.updateTemplate(req.params.name, validatedData);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (error) {
    console.error('Update template error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid template data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update template' });
  }
});

router.delete('/templates/:name', requireAuth, async (req, res) => {
  try {
    const success = await emailService.deleteTemplate(req.params.name);
    if (!success) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Queue management endpoints
router.get('/queue', requireAuth, async (req, res) => {
  try {
    const { status, priority, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data: queuedEmails, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ queuedEmails });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ error: 'Failed to fetch email queue' });
  }
});

router.post('/queue/:id/retry', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: queuedEmail, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !queuedEmail) {
      return res.status(404).json({ error: 'Queued email not found' });
    }

    if (queuedEmail.status !== 'failed') {
      return res.status(400).json({ error: 'Can only retry failed emails' });
    }

    const { error: updateError } = await supabase
      .from('email_queue')
      .update({
        status: 'pending',
        attempts: queuedEmail.attempts + 1,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Retry email error:', error);
    res.status(500).json({ error: 'Failed to retry email' });
  }
});

router.delete('/queue/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('email_queue')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete queued email error:', error);
    res.status(500).json({ error: 'Failed to delete queued email' });
  }
});

// User preferences endpoints
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const preferences = await emailService.getUserPreferences(req.user.id);
    res.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch email preferences' });
  }
});

router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const validatedData = preferencesSchema.parse(req.body);
    
    const preferences = await emailService.updateUserPreferences(req.user.id, validatedData);
    res.json({ preferences });
  } catch (error) {
    console.error('Update preferences error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid preferences data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update email preferences' });
  }
});

router.post('/preferences/unsubscribe', requireAuth, async (req, res) => {
  try {
    const success = await emailService.unsubscribeUser(req.user.id);
    res.json({ success });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe user' });
  }
});

router.post('/preferences/resubscribe', requireAuth, async (req, res) => {
  try {
    const preferences = await emailService.updateUserPreferences(req.user.id, { isUnsubscribed: false });
    res.json({ preferences });
  } catch (error) {
    console.error('Resubscribe error:', error);
    res.status(500).json({ error: 'Failed to resubscribe user' });
  }
});

// Analytics endpoints
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const analytics = await emailService.getAnalytics(timeRange as string);
    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch email analytics' });
  }
});

router.post('/analytics/track', async (req, res) => {
  try {
    const { eventType, emailId, userId, metadata } = req.body;
    
    if (!eventType || !emailId) {
      return res.status(400).json({ error: 'Event type and email ID are required' });
    }

    await emailService.trackEvent(eventType, emailId, userId, metadata);
    res.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Webhook endpoints for email providers
router.post('/webhooks/sendgrid', async (req, res) => {
  try {
    const events = req.body;
    
    for (const event of events) {
      await emailService.trackEvent(
        event.event,
        event.sg_message_id,
        event.userId,
        {
          timestamp: event.timestamp,
          reason: event.reason,
          url: event.url
        }
      );
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/webhooks/resend', async (req, res) => {
  try {
    const event = req.body;
    
    await emailService.trackEvent(
      event.type,
      event.data.email_id,
      event.data.userId,
      {
        timestamp: event.created_at,
        ...event.data
      }
    );
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Resend webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Initialize default templates
router.post('/templates/initialize', requireAuth, async (req, res) => {
  try {
    await initializeEmailTemplates();
    res.json({ success: true, message: 'Default templates initialized' });
  } catch (error) {
    console.error('Initialize templates error:', error);
    res.status(500).json({ error: 'Failed to initialize templates' });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('email_templates')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});