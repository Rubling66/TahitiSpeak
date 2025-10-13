import crypto from 'crypto';
import { EmailEventTracker } from '../EmailEventTracker';
import { WebhookEvent } from '../../../types/email';

export interface WebhookConfig {
  sendgridWebhookSecret?: string;
  resendWebhookSecret?: string;
}

export class WebhookHandler {
  private eventTracker: EmailEventTracker;
  private config: WebhookConfig;

  constructor(eventTracker: EmailEventTracker, config: WebhookConfig) {
    this.eventTracker = eventTracker;
    this.config = config;
  }

  async handleSendGridWebhook(
    payload: string,
    signature: string,
    timestamp: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature
      if (this.config.sendgridWebhookSecret) {
        const isValid = this.verifySendGridSignature(payload, signature, timestamp);
        if (!isValid) {
          return { success: false, message: 'Invalid webhook signature' };
        }
      }

      // Parse the payload
      const events = JSON.parse(payload);
      
      if (!Array.isArray(events)) {
        return { success: false, message: 'Invalid payload format' };
      }

      // Process each event
      const webhookEvent: WebhookEvent = {
        provider: 'sendgrid',
        eventType: 'batch', // SendGrid sends batches
        timestamp: new Date(),
        data: events,
        signature,
        headers: {
          'x-twilio-email-event-webhook-timestamp': timestamp,
          'x-twilio-email-event-webhook-signature': signature
        }
      };

      await this.eventTracker.handleWebhook(webhookEvent);

      return { 
        success: true, 
        message: `Successfully processed ${events.length} SendGrid events` 
      };
    } catch (error) {
      console.error('Failed to handle SendGrid webhook:', error);
      return { 
        success: false, 
        message: `Failed to process webhook: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async handleResendWebhook(
    payload: string,
    signature: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature
      if (this.config.resendWebhookSecret) {
        const isValid = this.verifyResendSignature(payload, signature);
        if (!isValid) {
          return { success: false, message: 'Invalid webhook signature' };
        }
      }

      // Parse the payload
      const eventData = JSON.parse(payload);
      
      // Determine event type from the payload
      const eventType = eventData.type || 'unknown';

      // Process the event
      const webhookEvent: WebhookEvent = {
        provider: 'resend',
        eventType,
        timestamp: new Date(),
        data: eventData,
        signature,
        headers: {}
      };

      await this.eventTracker.handleWebhook(webhookEvent);

      return { 
        success: true, 
        message: `Successfully processed Resend ${eventType} event` 
      };
    } catch (error) {
      console.error('Failed to handle Resend webhook:', error);
      return { 
        success: false, 
        message: `Failed to process webhook: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private verifySendGridSignature(payload: string, signature: string, timestamp: string): boolean {
    try {
      if (!this.config.sendgridWebhookSecret) {
        return false;
      }

      // SendGrid signature verification
      // The signature is in the format: t=timestamp,v1=signature
      const signatureParts = signature.split(',');
      const timestampPart = signatureParts.find(part => part.startsWith('t='));
      const signaturePart = signatureParts.find(part => part.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        return false;
      }

      const extractedTimestamp = timestampPart.split('=')[1];
      const extractedSignature = signaturePart.split('=')[1];

      // Check timestamp tolerance (5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(extractedTimestamp);
      const timeDiff = Math.abs(currentTime - webhookTime);
      
      if (timeDiff > 300) { // 5 minutes
        console.warn('Webhook timestamp is too old');
        return false;
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.config.sendgridWebhookSecret)
        .update(extractedTimestamp + payload)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(extractedSignature, 'base64'),
        Buffer.from(expectedSignature, 'base64')
      );
    } catch (error) {
      console.error('Failed to verify SendGrid signature:', error);
      return false;
    }
  }

  private verifyResendSignature(payload: string, signature: string): boolean {
    try {
      if (!this.config.resendWebhookSecret) {
        return false;
      }

      // Resend signature verification
      // The signature is typically in the format: sha256=signature
      const signaturePrefix = 'sha256=';
      if (!signature.startsWith(signaturePrefix)) {
        return false;
      }

      const extractedSignature = signature.slice(signaturePrefix.length);

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.config.resendWebhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(extractedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Failed to verify Resend signature:', error);
      return false;
    }
  }

  async handleGenericWebhook(
    provider: string,
    payload: string,
    headers: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const eventData = JSON.parse(payload);
      
      const webhookEvent: WebhookEvent = {
        provider,
        eventType: eventData.type || eventData.event || 'unknown',
        timestamp: new Date(),
        data: eventData,
        signature: headers['x-signature'] || headers['signature'] || '',
        headers
      };

      await this.eventTracker.handleWebhook(webhookEvent);

      return { 
        success: true, 
        message: `Successfully processed ${provider} webhook` 
      };
    } catch (error) {
      console.error(`Failed to handle ${provider} webhook:`, error);
      return { 
        success: false, 
        message: `Failed to process webhook: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Utility method to validate webhook payload structure
  validateWebhookPayload(payload: any, requiredFields: string[]): boolean {
    try {
      for (const field of requiredFields) {
        if (!(field in payload)) {
          console.warn(`Missing required field: ${field}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to validate webhook payload:', error);
      return false;
    }
  }

  // Method to get webhook endpoint URLs for configuration
  getWebhookEndpoints(baseUrl: string): Record<string, string> {
    return {
      sendgrid: `${baseUrl}/api/webhooks/sendgrid`,
      resend: `${baseUrl}/api/webhooks/resend`,
      generic: `${baseUrl}/api/webhooks/email`
    };
  }

  // Method to generate webhook configuration instructions
  getWebhookSetupInstructions(): Record<string, any> {
    return {
      sendgrid: {
        description: 'Configure SendGrid webhook in your SendGrid dashboard',
        steps: [
          'Go to Settings > Mail Settings > Event Webhook',
          'Enter your webhook URL',
          'Select the events you want to track',
          'Enable the webhook',
          'Set up webhook signature verification (recommended)'
        ],
        events: [
          'processed', 'delivered', 'open', 'click', 'bounce', 
          'dropped', 'spamreport', 'unsubscribe', 'group_unsubscribe'
        ]
      },
      resend: {
        description: 'Configure Resend webhook in your Resend dashboard',
        steps: [
          'Go to your Resend dashboard',
          'Navigate to Webhooks section',
          'Add a new webhook endpoint',
          'Enter your webhook URL',
          'Select the events you want to track',
          'Save the webhook configuration'
        ],
        events: [
          'email.sent', 'email.delivered', 'email.opened', 
          'email.clicked', 'email.bounced', 'email.complained'
        ]
      }
    };
  }
}