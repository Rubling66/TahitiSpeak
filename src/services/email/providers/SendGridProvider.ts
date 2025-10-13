import sgMail from '@sendgrid/mail';
import { EmailProvider, EmailRequest, EmailResponse, SendGridConfig } from '../../../types/email';

export class SendGridProvider implements EmailProvider {
  readonly name = 'sendgrid';
  private config: SendGridConfig;
  private isInitialized = false;

  constructor(config: SendGridConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    try {
      sgMail.setApiKey(this.config.apiKey);
      this.isInitialized = true;
      console.log('SendGrid provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SendGrid provider:', error);
      throw new Error('SendGrid initialization failed');
    }
  }

  async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'SendGrid provider not initialized'
      };
    }

    try {
      const msg = this.buildSendGridMessage(request);
      
      const [response] = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'] as string || 'unknown',
        provider: this.name,
        metadata: {
          statusCode: response.statusCode,
          headers: response.headers
        }
      };
    } catch (error) {
      console.error('SendGrid send error:', error);
      
      let errorMessage = 'Unknown SendGrid error';
      let statusCode: number | undefined;
      
      if (error && typeof error === 'object' && 'response' in error) {
        const sgError = error as any;
        statusCode = sgError.response?.statusCode;
        errorMessage = sgError.response?.body?.errors?.[0]?.message || sgError.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        provider: this.name,
        metadata: {
          statusCode,
          originalError: error
        }
      };
    }
  }

  async sendBulkEmail(requests: EmailRequest[]): Promise<EmailResponse[]> {
    if (!this.isInitialized) {
      return requests.map(() => ({
        success: false,
        error: 'SendGrid provider not initialized'
      }));
    }

    try {
      const messages = requests.map(request => this.buildSendGridMessage(request));
      
      // SendGrid supports sending multiple emails in a single API call
      const responses = await sgMail.send(messages);
      
      return responses.map((response, index) => ({
        success: true,
        messageId: response.headers['x-message-id'] as string || `bulk-${index}`,
        provider: this.name,
        metadata: {
          statusCode: response.statusCode,
          headers: response.headers
        }
      }));
    } catch (error) {
      console.error('SendGrid bulk send error:', error);
      
      // If bulk send fails, return error for all emails
      const errorMessage = error instanceof Error ? error.message : 'Bulk send failed';
      return requests.map(() => ({
        success: false,
        error: errorMessage,
        provider: this.name
      }));
    }
  }

  private buildSendGridMessage(request: EmailRequest): sgMail.MailDataRequired {
    const message: sgMail.MailDataRequired = {
      to: {
        email: request.to.email,
        name: request.to.name
      },
      from: {
        email: request.from.email,
        name: request.from.name
      },
      subject: request.subject,
      html: request.html
    };

    // Add optional fields
    if (request.text) {
      message.text = request.text;
    }

    if (request.replyTo) {
      message.replyTo = {
        email: request.replyTo.email,
        name: request.replyTo.name
      };
    }

    if (request.cc && request.cc.length > 0) {
      message.cc = request.cc.map(recipient => ({
        email: recipient.email,
        name: recipient.name
      }));
    }

    if (request.bcc && request.bcc.length > 0) {
      message.bcc = request.bcc.map(recipient => ({
        email: recipient.email,
        name: recipient.name
      }));
    }

    if (request.attachments && request.attachments.length > 0) {
      message.attachments = request.attachments.map(attachment => ({
        content: attachment.content,
        filename: attachment.filename,
        type: attachment.contentType,
        disposition: 'attachment'
      }));
    }

    // Add tracking settings
    message.trackingSettings = {
      clickTracking: {
        enable: true,
        enableText: false
      },
      openTracking: {
        enable: true,
        substitutionTag: '%open_tracking_pixel%'
      },
      subscriptionTracking: {
        enable: false
      }
    };

    // Add custom headers for tracking
    if (request.metadata) {
      message.customArgs = {
        ...request.metadata,
        provider: this.name
      };
    }

    // Add categories for analytics
    if (request.tags && request.tags.length > 0) {
      message.categories = request.tags;
    }

    return message;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // SendGrid doesn't have a dedicated health check endpoint
      // We'll use a simple API key validation by attempting to get account info
      // This is a lightweight operation that verifies the API key is valid
      
      // For now, we'll assume the provider is available if initialized
      // In production, you might want to implement a more robust health check
      return true;
    } catch (error) {
      console.error('SendGrid availability check failed:', error);
      return false;
    }
  }

  async getQuota(): Promise<{ sent: number; remaining: number; resetTime: Date }> {
    try {
      // SendGrid doesn't provide quota information through their Node.js SDK
      // You would need to use their Web API v3 directly for this
      // For now, return default values
      return {
        sent: 0,
        remaining: 100000, // Default daily limit for most SendGrid plans
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Reset in 24 hours
      };
    } catch (error) {
      console.error('Failed to get SendGrid quota:', error);
      throw new Error('Unable to retrieve quota information');
    }
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        console.error('SendGrid API key is missing');
        return false;
      }

      if (!this.config.apiKey.startsWith('SG.')) {
        console.error('SendGrid API key format is invalid');
        return false;
      }

      // Test the API key by attempting to initialize
      const testSgMail = require('@sendgrid/mail');
      testSgMail.setApiKey(this.config.apiKey);
      
      return true;
    } catch (error) {
      console.error('SendGrid configuration validation failed:', error);
      return false;
    }
  }

  // Webhook handling for SendGrid events
  static parseWebhookEvent(payload: any): any[] {
    try {
      // SendGrid sends events as an array
      if (Array.isArray(payload)) {
        return payload.map(event => ({
          messageId: event.sg_message_id,
          event: event.event,
          email: event.email,
          timestamp: new Date(event.timestamp * 1000),
          reason: event.reason,
          status: event.status,
          response: event.response,
          attempt: event.attempt,
          url: event.url,
          userAgent: event.useragent,
          ip: event.ip,
          provider: 'sendgrid',
          raw: event
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Failed to parse SendGrid webhook event:', error);
      return [];
    }
  }

  // Template management (if using SendGrid Dynamic Templates)
  async createTemplate(name: string, subject: string, htmlContent: string): Promise<string> {
    try {
      // This would require using SendGrid's Web API v3 directly
      // The Node.js SDK doesn't support template management
      throw new Error('Template management not implemented for SendGrid provider');
    } catch (error) {
      console.error('Failed to create SendGrid template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId: string, subject: string, htmlContent: string): Promise<void> {
    try {
      // This would require using SendGrid's Web API v3 directly
      throw new Error('Template management not implemented for SendGrid provider');
    } catch (error) {
      console.error('Failed to update SendGrid template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      // This would require using SendGrid's Web API v3 directly
      throw new Error('Template management not implemented for SendGrid provider');
    } catch (error) {
      console.error('Failed to delete SendGrid template:', error);
      throw error;
    }
  }

  // Rate limiting information
  getRateLimits(): { requestsPerSecond: number; requestsPerMinute: number; requestsPerHour: number } {
    return {
      requestsPerSecond: 10,
      requestsPerMinute: 600,
      requestsPerHour: 36000
    };
  }

  // Provider-specific configuration
  getProviderConfig(): SendGridConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SendGridConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.apiKey) {
      this.initialize();
    }
  }
}