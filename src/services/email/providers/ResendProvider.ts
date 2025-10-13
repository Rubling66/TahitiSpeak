import { Resend } from 'resend';
import { EmailProvider, EmailRequest, EmailResponse, ResendConfig } from '../../../types/email';

export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  private resend: Resend;
  private config: ResendConfig;
  private isInitialized = false;

  constructor(config: ResendConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    try {
      this.resend = new Resend(this.config.apiKey);
      this.isInitialized = true;
      console.log('Resend provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Resend provider:', error);
      throw new Error('Resend initialization failed');
    }
  }

  async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Resend provider not initialized'
      };
    }

    try {
      const emailData = this.buildResendMessage(request);
      
      const response = await this.resend.emails.send(emailData);
      
      if (response.error) {
        return {
          success: false,
          error: response.error.message,
          provider: this.name,
          metadata: {
            errorCode: response.error.name
          }
        };
      }

      return {
        success: true,
        messageId: response.data?.id || 'unknown',
        provider: this.name,
        metadata: {
          resendId: response.data?.id
        }
      };
    } catch (error) {
      console.error('Resend send error:', error);
      
      let errorMessage = 'Unknown Resend error';
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        provider: this.name,
        metadata: {
          originalError: error
        }
      };
    }
  }

  async sendBulkEmail(requests: EmailRequest[]): Promise<EmailResponse[]> {
    if (!this.isInitialized) {
      return requests.map(() => ({
        success: false,
        error: 'Resend provider not initialized'
      }));
    }

    // Resend doesn't have native bulk send, so we'll send emails individually
    // In production, you might want to implement batching with rate limiting
    const results: EmailResponse[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.sendEmail(request);
        results.push(result);
        
        // Add small delay to respect rate limits
        await this.delay(100); // 100ms delay between emails
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Bulk send failed',
          provider: this.name
        });
      }
    }

    return results;
  }

  private buildResendMessage(request: EmailRequest): any {
    const message: any = {
      from: `${request.from.name} <${request.from.email}>`,
      to: [`${request.to.name} <${request.to.email}>`],
      subject: request.subject,
      html: request.html
    };

    // Add optional fields
    if (request.text) {
      message.text = request.text;
    }

    if (request.replyTo) {
      message.reply_to = [`${request.replyTo.name} <${request.replyTo.email}>`];
    }

    if (request.cc && request.cc.length > 0) {
      message.cc = request.cc.map(recipient => 
        `${recipient.name} <${recipient.email}>`
      );
    }

    if (request.bcc && request.bcc.length > 0) {
      message.bcc = request.bcc.map(recipient => 
        `${recipient.name} <${recipient.email}>`
      );
    }

    if (request.attachments && request.attachments.length > 0) {
      message.attachments = request.attachments.map(attachment => ({
        content: attachment.content,
        filename: attachment.filename,
        content_type: attachment.contentType
      }));
    }

    // Add tags for analytics
    if (request.tags && request.tags.length > 0) {
      message.tags = request.tags.map(tag => ({ name: tag }));
    }

    // Add custom headers for tracking
    if (request.metadata) {
      message.headers = {
        ...request.metadata,
        'X-Provider': this.name
      };
    }

    return message;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Test the API by attempting to get domains (lightweight operation)
      await this.resend.domains.list();
      return true;
    } catch (error) {
      console.error('Resend availability check failed:', error);
      return false;
    }
  }

  async getQuota(): Promise<{ sent: number; remaining: number; resetTime: Date }> {
    try {
      // Resend doesn't provide quota information through their SDK
      // You would need to track this separately or use their API directly
      // For now, return default values based on Resend's free tier
      return {
        sent: 0,
        remaining: 3000, // Free tier limit
        resetTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Reset in 30 days
      };
    } catch (error) {
      console.error('Failed to get Resend quota:', error);
      throw new Error('Unable to retrieve quota information');
    }
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        console.error('Resend API key is missing');
        return false;
      }

      if (!this.config.apiKey.startsWith('re_')) {
        console.error('Resend API key format is invalid');
        return false;
      }

      // Test the API key by attempting to list domains
      const testResend = new Resend(this.config.apiKey);
      await testResend.domains.list();
      
      return true;
    } catch (error) {
      console.error('Resend configuration validation failed:', error);
      return false;
    }
  }

  // Webhook handling for Resend events
  static parseWebhookEvent(payload: any): any[] {
    try {
      // Resend webhook payload structure
      const event = {
        messageId: payload.data?.email_id,
        event: payload.type,
        email: payload.data?.to?.[0],
        timestamp: new Date(payload.created_at),
        provider: 'resend',
        raw: payload
      };

      // Map Resend event types to standard format
      const eventTypeMap: Record<string, string> = {
        'email.sent': 'sent',
        'email.delivered': 'delivered',
        'email.delivery_delayed': 'deferred',
        'email.complained': 'complaint',
        'email.bounced': 'bounced',
        'email.opened': 'opened',
        'email.clicked': 'clicked'
      };

      event.event = eventTypeMap[payload.type] || payload.type;

      return [event];
    } catch (error) {
      console.error('Failed to parse Resend webhook event:', error);
      return [];
    }
  }

  // Template management using Resend
  async createTemplate(name: string, subject: string, htmlContent: string): Promise<string> {
    try {
      // Resend doesn't have traditional templates like SendGrid
      // Instead, you would typically use React Email components
      // For now, we'll simulate template creation
      const templateId = `resend_template_${Date.now()}`;
      console.log(`Created Resend template: ${name} with ID: ${templateId}`);
      return templateId;
    } catch (error) {
      console.error('Failed to create Resend template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId: string, subject: string, htmlContent: string): Promise<void> {
    try {
      // Simulate template update
      console.log(`Updated Resend template: ${templateId}`);
    } catch (error) {
      console.error('Failed to update Resend template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      // Simulate template deletion
      console.log(`Deleted Resend template: ${templateId}`);
    } catch (error) {
      console.error('Failed to delete Resend template:', error);
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
  getProviderConfig(): ResendConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ResendConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.apiKey) {
      this.initialize();
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Domain management
  async getDomains(): Promise<any[]> {
    try {
      const response = await this.resend.domains.list();
      return response.data || [];
    } catch (error) {
      console.error('Failed to get Resend domains:', error);
      return [];
    }
  }

  async addDomain(domain: string): Promise<any> {
    try {
      const response = await this.resend.domains.create({
        name: domain
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add Resend domain:', error);
      throw error;
    }
  }

  async verifyDomain(domainId: string): Promise<any> {
    try {
      const response = await this.resend.domains.verify(domainId);
      return response.data;
    } catch (error) {
      console.error('Failed to verify Resend domain:', error);
      throw error;
    }
  }

  // API key management
  async createApiKey(name: string, permission: 'full_access' | 'sending_access' = 'sending_access'): Promise<any> {
    try {
      const response = await this.resend.apiKeys.create({
        name,
        permission
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create Resend API key:', error);
      throw error;
    }
  }

  async listApiKeys(): Promise<any[]> {
    try {
      const response = await this.resend.apiKeys.list();
      return response.data || [];
    } catch (error) {
      console.error('Failed to list Resend API keys:', error);
      return [];
    }
  }
}