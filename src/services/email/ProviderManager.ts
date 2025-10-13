import { EventEmitter } from 'events';
import {
  ProviderManager as IProviderManager,
  EmailProvider,
  ProviderHealthStatus,
  EmailServiceConfig
} from '../../types/email';
import { SendGridProvider } from './providers/SendGridProvider';
import { ResendProvider } from './providers/ResendProvider';

export class ProviderManager extends EventEmitter implements IProviderManager {
  private providers: Map<string, EmailProvider> = new Map();
  private unavailableProviders: Map<string, Date> = new Map();
  private config: EmailServiceConfig;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: EmailServiceConfig) {
    super();
    this.config = config;
    this.initializeProviders();
    this.startHealthChecks();
  }

  private initializeProviders(): void {
    // Initialize SendGrid provider if configured
    if (this.config.providers.sendgrid) {
      const sendGridProvider = new SendGridProvider(this.config.providers.sendgrid);
      this.addProvider(sendGridProvider);
    }

    // Initialize Resend provider if configured
    if (this.config.providers.resend) {
      const resendProvider = new ResendProvider(this.config.providers.resend);
      this.addProvider(resendProvider);
    }

    if (this.providers.size === 0) {
      throw new Error('No email providers configured');
    }
  }

  private startHealthChecks(): void {
    // Check provider health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 5 * 60 * 1000);
  }

  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        const isAvailable = await provider.isAvailable();
        const wasUnavailable = this.unavailableProviders.has(provider.name);

        if (isAvailable && wasUnavailable) {
          // Provider recovered
          this.unavailableProviders.delete(provider.name);
          this.emit('provider:recovered', { provider: provider.name });
          console.log(`Email provider ${provider.name} recovered`);
        } else if (!isAvailable && !wasUnavailable) {
          // Provider became unavailable
          this.markProviderUnavailable(provider.name);
          this.emit('provider:unavailable', { 
            provider: provider.name, 
            error: 'Health check failed' 
          });
          console.warn(`Email provider ${provider.name} became unavailable`);
        }
      } catch (error) {
        console.error(`Health check failed for provider ${provider.name}:`, error);
        this.markProviderUnavailable(provider.name);
        this.emit('provider:unavailable', { 
          provider: provider.name, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    await Promise.allSettled(healthPromises);
  }

  addProvider(provider: EmailProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`Added email provider: ${provider.name}`);
  }

  removeProvider(name: string): void {
    this.providers.delete(name);
    this.unavailableProviders.delete(name);
    console.log(`Removed email provider: ${name}`);
  }

  getProvider(name: string): EmailProvider | null {
    return this.providers.get(name) || null;
  }

  async selectProvider(): Promise<EmailProvider> {
    const availableProviders = await this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No email providers available');
    }

    // Simple round-robin selection for now
    // In production, you might want more sophisticated load balancing
    const selectedProvider = availableProviders[0];
    
    console.log(`Selected email provider: ${selectedProvider.name}`);
    return selectedProvider;
  }

  private async getAvailableProviders(): Promise<EmailProvider[]> {
    const availableProviders: EmailProvider[] = [];
    
    for (const [name, provider] of this.providers) {
      // Skip providers that are marked as unavailable and still in cooldown
      if (this.isProviderInCooldown(name)) {
        continue;
      }

      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          availableProviders.push(provider);
        } else {
          this.markProviderUnavailable(name);
        }
      } catch (error) {
        console.error(`Provider ${name} availability check failed:`, error);
        this.markProviderUnavailable(name);
      }
    }

    return availableProviders;
  }

  private isProviderInCooldown(name: string): boolean {
    const unavailableTime = this.unavailableProviders.get(name);
    if (!unavailableTime) return false;

    // Default cooldown period: 5 minutes
    const cooldownPeriod = 5 * 60 * 1000;
    return Date.now() - unavailableTime.getTime() < cooldownPeriod;
  }

  markProviderUnavailable(name: string, duration?: number): void {
    this.unavailableProviders.set(name, new Date());
    
    if (duration) {
      // Remove from unavailable list after specified duration
      setTimeout(() => {
        this.unavailableProviders.delete(name);
        console.log(`Provider ${name} cooldown period ended`);
      }, duration);
    }
    
    console.warn(`Marked email provider ${name} as unavailable`);
  }

  async getProviderHealth(): Promise<ProviderHealthStatus[]> {
    const healthStatuses: ProviderHealthStatus[] = [];
    
    for (const [name, provider] of this.providers) {
      const startTime = Date.now();
      let isHealthy = false;
      let error: string | undefined;
      
      try {
        isHealthy = await provider.isAvailable();
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
      }
      
      const responseTime = Date.now() - startTime;
      
      healthStatuses.push({
        name,
        isHealthy,
        lastChecked: new Date(),
        responseTime,
        error
      });
    }
    
    return healthStatuses;
  }

  // Rate limiting helpers
  async checkRateLimit(providerName: string): Promise<boolean> {
    const provider = this.getProvider(providerName);
    if (!provider) return false;

    // This would typically check against a rate limiting store (Redis)
    // For now, we'll assume rate limits are handled by the providers themselves
    return true;
  }

  async updateRateLimit(providerName: string, sent: number): Promise<void> {
    // Update rate limiting counters
    // This would typically update Redis counters
    console.log(`Updated rate limit for ${providerName}: ${sent} emails sent`);
  }

  // Failover logic
  async sendWithFailover(emailData: any): Promise<any> {
    const availableProviders = await this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No email providers available for failover');
    }

    let lastError: Error | null = null;

    for (const provider of availableProviders) {
      try {
        // Check rate limit before attempting to send
        const canSend = await this.checkRateLimit(provider.name);
        if (!canSend) {
          console.warn(`Rate limit exceeded for provider ${provider.name}, trying next provider`);
          continue;
        }

        const result = await provider.sendEmail(emailData);
        
        if (result.success) {
          // Update rate limit counter
          await this.updateRateLimit(provider.name, 1);
          return result;
        } else {
          lastError = new Error(result.error || 'Unknown provider error');
          console.warn(`Provider ${provider.name} failed to send email:`, result.error);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Provider ${provider.name} threw error:`, error);
        
        // Mark provider as temporarily unavailable
        this.markProviderUnavailable(provider.name, 60000); // 1 minute cooldown
      }
    }

    // All providers failed
    throw lastError || new Error('All email providers failed');
  }

  // Load balancing strategies
  async selectProviderByLoad(): Promise<EmailProvider> {
    const availableProviders = await this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No email providers available');
    }

    // For now, just return the first available provider
    // In production, you might implement more sophisticated load balancing:
    // - Weighted round-robin based on provider capacity
    // - Least connections
    // - Response time based selection
    return availableProviders[0];
  }

  async selectProviderByPriority(templateCategory?: string): Promise<EmailProvider> {
    const availableProviders = await this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No email providers available');
    }

    // Provider priority based on template category
    const providerPriority: Record<string, string[]> = {
      'transactional': ['sendgrid', 'resend'],
      'marketing': ['resend', 'sendgrid'],
      'notification': ['sendgrid', 'resend'],
      'default': ['sendgrid', 'resend']
    };

    const priority = providerPriority[templateCategory || 'default'] || providerPriority.default;
    
    for (const providerName of priority) {
      const provider = availableProviders.find(p => p.name === providerName);
      if (provider) {
        return provider;
      }
    }

    // Fallback to first available provider
    return availableProviders[0];
  }

  // Cleanup
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.providers.clear();
    this.unavailableProviders.clear();
    this.removeAllListeners();
    
    console.log('ProviderManager shutdown complete');
  }
}