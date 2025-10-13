import { Request, Response } from 'express';
import { WebhookHandler } from '../../src/services/email/webhooks/WebhookHandler';
import { EmailEventTracker } from '../../src/services/email/EmailEventTracker';
import { supabase } from '../../src/lib/supabase';

const eventTracker = new EmailEventTracker(supabase);
const webhookHandler = new WebhookHandler(eventTracker);

/**
 * Handle SendGrid webhooks
 * POST /api/email/webhooks/sendgrid
 */
export async function handleSendGridWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
    const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;
    const payload = req.body;

    // Verify webhook signature
    const isValid = await webhookHandler.verifySendGridSignature(
      JSON.stringify(payload),
      signature,
      timestamp
    );

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid webhook signature'
      });
    }

    // Process webhook events
    const results = await webhookHandler.handleSendGridWebhook(payload);

    res.status(200).json({
      success: true,
      data: {
        processed: results.length,
        events: results
      },
      message: 'SendGrid webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing SendGrid webhook:', error);
    res.status(500).json({
      error: 'Failed to process SendGrid webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle Resend webhooks
 * POST /api/email/webhooks/resend
 */
export async function handleResendWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['svix-signature'] as string;
    const payload = req.body;

    // Verify webhook signature
    const isValid = await webhookHandler.verifyResendSignature(
      JSON.stringify(payload),
      signature
    );

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid webhook signature'
      });
    }

    // Process webhook events
    const results = await webhookHandler.handleResendWebhook(payload);

    res.status(200).json({
      success: true,
      data: {
        processed: results.length,
        events: results
      },
      message: 'Resend webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    res.status(500).json({
      error: 'Failed to process Resend webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle generic webhook (auto-detect provider)
 * POST /api/email/webhooks/generic
 */
export async function handleGenericWebhook(req: Request, res: Response) {
  try {
    const userAgent = req.headers['user-agent'] as string;
    const payload = req.body;

    // Auto-detect provider based on headers or payload structure
    let provider: 'sendgrid' | 'resend' | 'unknown' = 'unknown';

    if (req.headers['x-twilio-email-event-webhook-signature']) {
      provider = 'sendgrid';
    } else if (req.headers['svix-signature']) {
      provider = 'resend';
    } else if (userAgent?.includes('SendGrid')) {
      provider = 'sendgrid';
    } else if (userAgent?.includes('Resend')) {
      provider = 'resend';
    }

    if (provider === 'unknown') {
      return res.status(400).json({
        error: 'Unable to determine webhook provider'
      });
    }

    // Route to appropriate handler
    const results = await webhookHandler.handleWebhook(payload, provider);

    res.status(200).json({
      success: true,
      data: {
        provider,
        processed: results.length,
        events: results
      },
      message: `${provider} webhook processed successfully`
    });

  } catch (error) {
    console.error('Error processing generic webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get webhook configuration instructions
 * GET /api/email/webhooks/setup
 */
export async function getWebhookSetup(req: Request, res: Response) {
  try {
    const { provider } = req.query;

    if (!provider || !['sendgrid', 'resend'].includes(provider as string)) {
      return res.status(400).json({
        error: 'Provider must be either "sendgrid" or "resend"'
      });
    }

    const setup = webhookHandler.getSetupInstructions(provider as 'sendgrid' | 'resend');

    res.status(200).json({
      success: true,
      data: setup,
      message: 'Webhook setup instructions retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting webhook setup:', error);
    res.status(500).json({
      error: 'Failed to get webhook setup instructions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Test webhook endpoint
 * POST /api/email/webhooks/test
 */
export async function testWebhook(req: Request, res: Response) {
  try {
    const { provider, eventType = 'delivered' } = req.body;

    if (!provider || !['sendgrid', 'resend'].includes(provider)) {
      return res.status(400).json({
        error: 'Provider must be either "sendgrid" or "resend"'
      });
    }

    // Create a test event
    const testEvent = {
      id: `test-${Date.now()}`,
      type: eventType,
      email: 'test@example.com',
      timestamp: new Date().toISOString(),
      messageId: `test-message-${Date.now()}`,
      provider: provider as 'sendgrid' | 'resend'
    };

    // Process test event
    await eventTracker.trackEvent(testEvent);

    res.status(200).json({
      success: true,
      data: testEvent,
      message: 'Test webhook event processed successfully'
    });

  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({
      error: 'Failed to test webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get webhook event history
 * GET /api/email/webhooks/events
 */
export async function getWebhookEvents(req: Request, res: Response) {
  try {
    const {
      page = 1,
      limit = 50,
      provider,
      eventType,
      email,
      startDate,
      endDate
    } = req.query;

    const filters = {
      provider: provider as string,
      eventType: eventType as string,
      email: email as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const events = await eventTracker.getEvents(
      Number(page),
      Number(limit),
      filters
    );

    res.status(200).json({
      success: true,
      data: events,
      message: 'Webhook events retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting webhook events:', error);
    res.status(500).json({
      error: 'Failed to get webhook events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get webhook statistics
 * GET /api/email/webhooks/stats
 */
export async function getWebhookStats(req: Request, res: Response) {
  try {
    const {
      provider,
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    const filters = {
      provider: provider as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const stats = await eventTracker.getEventStats(filters, groupBy as 'hour' | 'day' | 'week');

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Webhook statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting webhook stats:', error);
    res.status(500).json({
      error: 'Failed to get webhook statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}