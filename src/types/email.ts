// Email Service Types and Interfaces

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  htmlContent: string;
  textContent?: string;
  templateVariables: Record<string, string>;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface EmailLog {
  id: string;
  userId?: string;
  templateName: string;
  recipientEmail: string;
  subject: string;
  status: EmailStatus;
  provider: EmailProvider;
  providerMessageId?: string;
  templateData: Record<string, any>;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferences {
  id: string;
  userId: string;
  welcomeEmails: boolean;
  lessonReminders: boolean;
  progressUpdates: boolean;
  achievementNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  frequency: EmailFrequency;
  timezone: string;
  preferredTime: string;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueuedEmail {
  id: string;
  userId?: string;
  templateName: string;
  recipientEmail: string;
  templateData: Record<string, any>;
  priority: number;
  scheduledAt: Date;
  attempts: number;
  maxAttempts: number;
  status: QueueStatus;
  errorMessage?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailEvent {
  id: string;
  emailLogId: string;
  eventType: EmailEventType;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  linkUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface EmailAnalyticsSummary {
  id: string;
  date: Date;
  templateName?: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  uniqueOpens: number;
  uniqueClicks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnsubscribeLog {
  id: string;
  userId?: string;
  email: string;
  unsubscribeToken: string;
  category?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Enums
export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
export type EmailProvider = 'sendgrid' | 'resend';
export type EmailFrequency = 'immediate' | 'daily' | 'weekly' | 'never';
export type QueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
export type EmailEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';

// Service Interfaces
export interface EmailService {
  // Template management
  getTemplate(name: string): Promise<EmailTemplate | null>;
  createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate>;
  updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate>;
  deleteTemplate(id: string): Promise<void>;
  listTemplates(filters?: TemplateFilters): Promise<EmailTemplate[]>;
  
  // Email sending
  sendEmail(request: SendEmailRequest): Promise<SendEmailResult>;
  sendBulkEmail(requests: SendEmailRequest[]): Promise<SendEmailResult[]>;
  scheduleEmail(request: ScheduleEmailRequest): Promise<QueuedEmail>;
  
  // Queue management
  getQueueStatus(): Promise<QueueStats>;
  retryFailedEmails(maxAttempts?: number): Promise<void>;
  cancelQueuedEmail(id: string): Promise<void>;
  
  // Analytics
  getEmailAnalytics(filters: AnalyticsFilters): Promise<EmailAnalytics>;
  getTemplatePerformance(templateName?: string): Promise<TemplatePerformance[]>;
  
  // User preferences
  getUserPreferences(userId: string): Promise<EmailPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences>;
  unsubscribe(token: string): Promise<UnsubscribeResult>;
}

export interface TemplateEngine {
  // Template compilation
  compileTemplate(template: EmailTemplate, data: Record<string, any>): Promise<CompiledTemplate>;
  validateTemplate(template: EmailTemplate): Promise<ValidationResult>;
  previewTemplate(template: EmailTemplate, data: Record<string, any>): Promise<TemplatePreview>;
  
  // Template utilities
  extractVariables(content: string): string[];
  validateVariables(template: EmailTemplate, data: Record<string, any>): ValidationResult;
}

export interface EmailProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  sendEmail(email: CompiledEmail): Promise<ProviderResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
  handleWebhook(payload: any): Promise<WebhookResult>;
}

export interface ProviderManager {
  // Provider management
  addProvider(provider: EmailProvider): void;
  removeProvider(name: string): void;
  getProvider(name: string): EmailProvider | null;
  
  // Load balancing and failover
  selectProvider(): Promise<EmailProvider>;
  markProviderUnavailable(name: string, duration?: number): void;
  getProviderHealth(): Promise<ProviderHealthStatus[]>;
}

// Request/Response Types
export interface SendEmailRequest {
  templateName: string;
  recipientEmail: string;
  templateData: Record<string, any>;
  userId?: string;
  priority?: number;
  scheduledAt?: Date;
}

export interface ScheduleEmailRequest extends SendEmailRequest {
  scheduledAt: Date;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  emailLogId?: string;
}

export interface CompiledTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface CompiledEmail extends CompiledTemplate {
  recipientEmail: string;
  templateName: string;
  templateData: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface TemplatePreview {
  subject: string;
  htmlContent: string;
  textContent?: string;
  missingVariables: string[];
}

export interface ProviderResult {
  success: boolean;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DeliveryStatus {
  status: EmailStatus;
  timestamp?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WebhookResult {
  processed: boolean;
  events: EmailEvent[];
  error?: string;
}

export interface ProviderHealthStatus {
  name: string;
  isHealthy: boolean;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

// Filter Types
export interface TemplateFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  templateName?: string;
  userId?: string;
  provider?: EmailProvider;
}

// Analytics Types
export interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  trends: EngagementTrend[];
}

export interface EngagementTrend {
  date: Date;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface TemplatePerformance {
  templateName: string;
  sent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  avgEngagementTime: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  totalToday: number;
  averageProcessingTime: number;
}

export interface UnsubscribeResult {
  success: boolean;
  userId?: string;
  previousPreferences?: EmailPreferences;
  error?: string;
}

// Configuration Types
export interface EmailServiceConfig {
  providers: {
    sendgrid?: {
      apiKey: string;
      fromEmail: string;
      fromName: string;
    };
    resend?: {
      apiKey: string;
      fromEmail: string;
      fromName: string;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queue: {
    concurrency: number;
    retryAttempts: number;
    retryDelay: number;
    cleanupInterval: number;
  };
  rateLimit: {
    sendgrid: {
      dailyLimit: number;
      hourlyLimit: number;
    };
    resend: {
      dailyLimit: number;
      hourlyLimit: number;
    };
  };
  webhooks: {
    sendgridSecret?: string;
    resendSecret?: string;
  };
}

// Event Types
export interface EmailServiceEvents {
  'email:sent': { emailLogId: string; messageId: string };
  'email:delivered': { emailLogId: string; timestamp: Date };
  'email:opened': { emailLogId: string; timestamp: Date };
  'email:clicked': { emailLogId: string; linkUrl: string; timestamp: Date };
  'email:bounced': { emailLogId: string; reason: string; timestamp: Date };
  'email:failed': { emailLogId: string; error: string };
  'queue:processed': { processed: number; failed: number };
  'provider:unavailable': { provider: string; error: string };
  'provider:recovered': { provider: string };
}