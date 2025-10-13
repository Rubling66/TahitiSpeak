// Email Provider Interfaces and Implementations

export interface EmailMessage {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface SendResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  provider: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<SendResult>;
  verify(): Promise<boolean>;
  getQuota(): Promise<{ used: number; remaining: number; resetTime?: Date }>;
}

// SendGrid Provider Implementation
export class SendGridProvider implements EmailProvider {
  name = 'sendgrid';
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string, fromEmail: string, fromName: string = 'French Tahitian App') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const sgMail = await this.getSendGridClient();
    
    const msg = {
      to: Array.isArray(message.to) ? message.to : [message.to],
      from: {
        email: message.from || this.fromEmail,
        name: this.fromName
      },
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
        type: att.contentType,
        disposition: att.disposition,
        content_id: att.contentId
      })),
      custom_args: {
        provider: 'sendgrid',
        timestamp: new Date().toISOString()
      },
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
        subscription_tracking: { enable: false }
      }
    };

    try {
      const response = await sgMail.send(msg);
      
      return {
        messageId: response[0].headers['x-message-id'] || 'unknown',
        status: 'sent',
        provider: this.name,
        timestamp: new Date(),
        metadata: {
          statusCode: response[0].statusCode,
          headers: response[0].headers
        }
      };
    } catch (error: any) {
      throw new Error(`SendGrid error: ${error.message}`);
    }
  }

  async verify(): Promise<boolean> {
    try {
      const sgMail = await this.getSendGridClient();
      // SendGrid doesn't have a direct verify endpoint, so we'll check API key format
      return this.apiKey.startsWith('SG.') && this.apiKey.length > 20;
    } catch {
      return false;
    }
  }

  async getQuota(): Promise<{ used: number; remaining: number; resetTime?: Date }> {
    try {
      // SendGrid quota check would require additional API calls
      // For now, return a mock response
      return {
        used: 0,
        remaining: 100000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    } catch {
      return { used: 0, remaining: 0 };
    }
  }

  private async getSendGridClient() {
    // Dynamic import to avoid bundling issues
    const sgMail = (await import('@sendgrid/mail')).default;
    sgMail.setApiKey(this.apiKey);
    return sgMail;
  }
}

// Resend Provider Implementation
export class ResendProvider implements EmailProvider {
  name = 'resend';
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string, fromEmail: string, fromName: string = 'French Tahitian App') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const resend = await this.getResendClient();
    
    try {
      const response = await resend.emails.send({
        from: `${this.fromName} <${message.from || this.fromEmail}>`,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType,
          disposition: att.disposition
        })),
        headers: message.headers,
        tags: [
          { name: 'provider', value: 'resend' },
          { name: 'timestamp', value: new Date().toISOString() }
        ]
      });

      return {
        messageId: response.data?.id || 'unknown',
        status: 'sent',
        provider: this.name,
        timestamp: new Date(),
        metadata: response
      };
    } catch (error: any) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }

  async verify(): Promise<boolean> {
    try {
      const resend = await this.getResendClient();
      // Try to get API key info
      await resend.apiKeys.list();
      return true;
    } catch {
      return false;
    }
  }

  async getQuota(): Promise<{ used: number; remaining: number; resetTime?: Date }> {
    try {
      // Resend quota would need to be checked via their API
      // For now, return a mock response
      return {
        used: 0,
        remaining: 3000, // Resend free tier
        resetTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
    } catch {
      return { used: 0, remaining: 0 };
    }
  }

  private async getResendClient() {
    // Dynamic import to avoid bundling issues
    const { Resend } = await import('resend');
    return new Resend(this.apiKey);
  }
}

// Mock Provider for Development/Testing
export class MockEmailProvider implements EmailProvider {
  name = 'mock';
  private logs: Array<{ message: EmailMessage; timestamp: Date }> = [];

  async send(message: EmailMessage): Promise<SendResult> {
    this.logs.push({ message, timestamp: new Date() });
    
    console.log('📧 Mock Email Sent:', {
      to: message.to,
      subject: message.subject,
      timestamp: new Date().toISOString()
    });

    return {
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      provider: this.name,
      timestamp: new Date(),
      metadata: { mock: true }
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }

  async getQuota(): Promise<{ used: number; remaining: number }> {
    return {
      used: this.logs.length,
      remaining: 999999
    };
  }

  getLogs(): Array<{ message: EmailMessage; timestamp: Date }> {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Provider Manager for Failover and Load Balancing
export class EmailProviderManager {
  private providers: EmailProvider[] = [];
  private currentProviderIndex = 0;
  private failoverEnabled = true;
  private maxRetries = 3;

  addProvider(provider: EmailProvider): void {
    this.providers.push(provider);
  }

  removeProvider(providerName: string): void {
    this.providers = this.providers.filter(p => p.name !== providerName);
  }

  setFailoverEnabled(enabled: boolean): void {
    this.failoverEnabled = enabled;
  }

  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  async send(message: EmailMessage, preferredProvider?: string): Promise<SendResult> {
    if (this.providers.length === 0) {
      throw new Error('No email providers configured');
    }

    let startIndex = 0;
    
    // If preferred provider is specified, try it first
    if (preferredProvider) {
      const providerIndex = this.providers.findIndex(p => p.name === preferredProvider);
      if (providerIndex !== -1) {
        startIndex = providerIndex;
      }
    } else {
      startIndex = this.currentProviderIndex;
    }

    let lastError: Error | null = null;
    let attempts = 0;

    for (let i = 0; i < this.providers.length && attempts < this.maxRetries; i++) {
      const providerIndex = (startIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];

      try {
        const result = await provider.send(message);
        
        // Update current provider index for round-robin
        this.currentProviderIndex = (providerIndex + 1) % this.providers.length;
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        attempts++;
        
        console.warn(`Provider ${provider.name} failed:`, lastError.message);
        
        if (!this.failoverEnabled) {
          throw lastError;
        }
      }
    }

    throw new Error(`All email providers failed. Last error: ${lastError?.message}`);
  }

  async verifyProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const provider of this.providers) {
      try {
        results[provider.name] = await provider.verify();
      } catch {
        results[provider.name] = false;
      }
    }
    
    return results;
  }

  async getProvidersQuota(): Promise<Record<string, { used: number; remaining: number; resetTime?: Date }>> {
    const results: Record<string, { used: number; remaining: number; resetTime?: Date }> = {};
    
    for (const provider of this.providers) {
      try {
        results[provider.name] = await provider.getQuota();
      } catch {
        results[provider.name] = { used: 0, remaining: 0 };
      }
    }
    
    return results;
  }

  getProviders(): EmailProvider[] {
    return [...this.providers];
  }

  getProviderByName(name: string): EmailProvider | undefined {
    return this.providers.find(p => p.name === name);
  }
}

// Factory function to create providers
export const createEmailProvider = (
  type: 'sendgrid' | 'resend' | 'mock',
  config: {
    apiKey?: string;
    fromEmail?: string;
    fromName?: string;
  }
): EmailProvider => {
  switch (type) {
    case 'sendgrid':
      if (!config.apiKey || !config.fromEmail) {
        throw new Error('SendGrid requires apiKey and fromEmail');
      }
      return new SendGridProvider(config.apiKey, config.fromEmail, config.fromName);
    
    case 'resend':
      if (!config.apiKey || !config.fromEmail) {
        throw new Error('Resend requires apiKey and fromEmail');
      }
      return new ResendProvider(config.apiKey, config.fromEmail, config.fromName);
    
    case 'mock':
      return new MockEmailProvider();
    
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
};