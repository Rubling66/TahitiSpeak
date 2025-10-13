import { createClient } from '@supabase/supabase-js';

// Types and Interfaces
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
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface EmailLog {
  id: string;
  userId?: string;
  templateName: string;
  recipientEmail: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  provider?: string;
  providerMessageId?: string;
  templateData: Record<string, any>;
  metadata: Record<string, any>;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
  errorMessage?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
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
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  timezone: string;
  preferredTime: string;
  unsubscribeToken: string;
  isUnsubscribed: boolean;
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedEmail {
  id: string;
  userId?: string;
  templateName: string;
  recipientEmail: string;
  templateData: Record<string, any>;
  priority: number;
  scheduledAt: string;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailEvent {
  id: string;
  emailLogId: string;
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  linkUrl?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface EmailAnalytics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface SendEmailOptions {
  templateName: string;
  recipientEmail: string;
  templateData?: Record<string, any>;
  userId?: string;
  priority?: number;
  scheduledAt?: Date;
  provider?: string;
}

export interface BulkEmailOptions {
  templateName: string;
  recipients: Array<{
    email: string;
    templateData?: Record<string, any>;
    userId?: string;
  }>;
  priority?: number;
  scheduledAt?: Date;
  batchSize?: number;
}

export interface TemplateEngineOptions {
  template: EmailTemplate;
  data: Record<string, any>;
  baseUrl?: string;
}

// Template Engine Class
export class TemplateEngine {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  compile(options: TemplateEngineOptions): { html: string; text: string; subject: string } {
    const { template, data } = options;
    
    // Add helper data
    const templateData = {
      ...data,
      baseUrl: this.baseUrl,
      currentYear: new Date().getFullYear(),
      unsubscribeUrl: data.unsubscribeUrl || `${this.baseUrl}/unsubscribe?token=${data.unsubscribeToken}`,
      preferencesUrl: data.preferencesUrl || `${this.baseUrl}/email-preferences?token=${data.unsubscribeToken}`,
    };

    // Simple template compilation (replace {{variable}} with values)
    const compileText = (text: string): string => {
      return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
        const value = this.getNestedValue(templateData, path);
        return value !== undefined ? String(value) : match;
      });
    };

    // Handle conditional blocks {{#if condition}}...{{/if}}
    const compileConditionals = (text: string): string => {
      return text.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, path, content) => {
        const value = this.getNestedValue(templateData, path);
        return value ? content : '';
      });
    };

    let html = template.htmlContent;
    let subject = template.subject;
    let text = template.textContent || this.htmlToText(html);

    // Apply conditional compilation
    html = compileConditionals(html);
    text = compileConditionals(text);

    // Apply variable substitution
    html = compileText(html);
    text = compileText(text);
    subject = compileText(subject);

    return { html, text, subject };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  validate(template: EmailTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name) errors.push('Template name is required');
    if (!template.subject) errors.push('Template subject is required');
    if (!template.htmlContent) errors.push('Template HTML content is required');
    if (!template.category) errors.push('Template category is required');

    // Validate template variables
    const variablePattern = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    const usedVariables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(template.htmlContent)) !== null) {
      usedVariables.add(match[1]);
    }

    while ((match = variablePattern.exec(template.subject)) !== null) {
      usedVariables.add(match[1]);
    }

    // Check if all used variables are defined
    const definedVariables = new Set(Object.keys(template.templateVariables));
    for (const variable of usedVariables) {
      if (!definedVariables.has(variable) && !['baseUrl', 'currentYear', 'unsubscribeUrl', 'preferencesUrl'].includes(variable)) {
        errors.push(`Undefined template variable: ${variable}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  preview(template: EmailTemplate, sampleData: Record<string, any>): { html: string; text: string; subject: string } {
    return this.compile({ template, data: sampleData });
  }
}

// Main Email Service Class
export class EmailService {
  private supabase;
  private templateEngine: TemplateEngine;
  private providers: Map<string, any> = new Map();
  private defaultProvider: string = 'sendgrid';

  constructor(supabaseUrl: string, supabaseKey: string, baseUrl: string = '') {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.templateEngine = new TemplateEngine(baseUrl);
  }

  // Provider Management
  addProvider(name: string, provider: any): void {
    this.providers.set(name, provider);
  }

  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not found`);
    }
    this.defaultProvider = name;
  }

  // Template Management
  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const validation = this.templateEngine.validate(template as EmailTemplate);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    const { data, error } = await this.supabase
      .from('email_templates')
      .insert({
        name: template.name,
        subject: template.subject,
        category: template.category,
        html_content: template.htmlContent,
        text_content: template.textContent,
        template_variables: template.templateVariables,
        is_active: template.isActive,
        version: template.version
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapTemplateFromDb(data);
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const { data, error } = await this.supabase
      .from('email_templates')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.subject && { subject: updates.subject }),
        ...(updates.category && { category: updates.category }),
        ...(updates.htmlContent && { html_content: updates.htmlContent }),
        ...(updates.textContent && { text_content: updates.textContent }),
        ...(updates.templateVariables && { template_variables: updates.templateVariables }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
        ...(updates.version && { version: updates.version })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapTemplateFromDb(data);
  }

  async getTemplate(name: string): Promise<EmailTemplate | null> {
    const { data, error } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapTemplateFromDb(data);
  }

  async listTemplates(category?: string): Promise<EmailTemplate[]> {
    let query = this.supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return data.map(this.mapTemplateFromDb);
  }

  // Email Sending
  async sendEmail(options: SendEmailOptions): Promise<string> {
    const template = await this.getTemplate(options.templateName);
    if (!template) {
      throw new Error(`Template ${options.templateName} not found`);
    }

    // Check user preferences
    if (options.userId) {
      const canSend = await this.checkUserPreferences(options.userId, template.category);
      if (!canSend) {
        throw new Error('User has opted out of this email category');
      }
    }

    // Compile template
    const compiled = this.templateEngine.compile({
      template,
      data: options.templateData || {}
    });

    // Create email log
    const { data: logData, error: logError } = await this.supabase
      .from('email_logs')
      .insert({
        user_id: options.userId,
        template_name: options.templateName,
        recipient_email: options.recipientEmail,
        subject: compiled.subject,
        template_data: options.templateData || {},
        provider: options.provider || this.defaultProvider,
        status: 'pending'
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      // Send via provider
      const provider = this.providers.get(options.provider || this.defaultProvider);
      if (!provider) {
        throw new Error(`Provider ${options.provider || this.defaultProvider} not configured`);
      }

      const result = await provider.send({
        to: options.recipientEmail,
        subject: compiled.subject,
        html: compiled.html,
        text: compiled.text
      });

      // Update log with success
      await this.supabase
        .from('email_logs')
        .update({
          status: 'sent',
          provider_message_id: result.messageId,
          sent_at: new Date().toISOString()
        })
        .eq('id', logData.id);

      return logData.id;
    } catch (error) {
      // Update log with failure
      await this.supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          attempts: 1
        })
        .eq('id', logData.id);

      throw error;
    }
  }

  async sendBulkEmail(options: BulkEmailOptions): Promise<string[]> {
    const template = await this.getTemplate(options.templateName);
    if (!template) {
      throw new Error(`Template ${options.templateName} not found`);
    }

    const batchSize = options.batchSize || 100;
    const results: string[] = [];

    for (let i = 0; i < options.recipients.length; i += batchSize) {
      const batch = options.recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient =>
        this.sendEmail({
          templateName: options.templateName,
          recipientEmail: recipient.email,
          templateData: recipient.templateData,
          userId: recipient.userId,
          priority: options.priority,
          scheduledAt: options.scheduledAt
        })
      );

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to send email to ${batch[index].email}:`, result.reason);
        }
      });
    }

    return results;
  }

  async scheduleEmail(options: SendEmailOptions & { scheduledAt: Date }): Promise<string> {
    const { data, error } = await this.supabase
      .from('email_queue')
      .insert({
        user_id: options.userId,
        template_name: options.templateName,
        recipient_email: options.recipientEmail,
        template_data: options.templateData || {},
        priority: options.priority || 5,
        scheduled_at: options.scheduledAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  // Queue Management
  async processQueue(batchSize: number = 10): Promise<{ processed: number; successful: number; failed: number }> {
    const { data: queueItems, error } = await this.supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (error) throw error;

    let successful = 0;
    let failed = 0;

    for (const item of queueItems) {
      try {
        await this.sendEmail({
          templateName: item.template_name,
          recipientEmail: item.recipient_email,
          templateData: item.template_data,
          userId: item.user_id
        });

        await this.supabase
          .from('email_queue')
          .update({
            status: 'sent',
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        successful++;
      } catch (error) {
        const attempts = item.attempts + 1;
        const status = attempts >= item.max_attempts ? 'failed' : 'pending';

        await this.supabase
          .from('email_queue')
          .update({
            status,
            attempts,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', item.id);

        failed++;
      }
    }

    return {
      processed: queueItems.length,
      successful,
      failed
    };
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<EmailPreferences | null> {
    const { data, error } = await this.supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapPreferencesFromDb(data);
  }

  async updateUserPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences> {
    const { data, error } = await this.supabase
      .from('email_preferences')
      .upsert({
        user_id: userId,
        ...(preferences.welcomeEmails !== undefined && { welcome_emails: preferences.welcomeEmails }),
        ...(preferences.lessonReminders !== undefined && { lesson_reminders: preferences.lessonReminders }),
        ...(preferences.progressUpdates !== undefined && { progress_updates: preferences.progressUpdates }),
        ...(preferences.achievementNotifications !== undefined && { achievement_notifications: preferences.achievementNotifications }),
        ...(preferences.weeklyDigest !== undefined && { weekly_digest: preferences.weeklyDigest }),
        ...(preferences.marketingEmails !== undefined && { marketing_emails: preferences.marketingEmails }),
        ...(preferences.frequency && { frequency: preferences.frequency }),
        ...(preferences.timezone && { timezone: preferences.timezone }),
        ...(preferences.preferredTime && { preferred_time: preferences.preferredTime })
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapPreferencesFromDb(data);
  }

  async unsubscribe(token: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('email_preferences')
      .update({
        is_unsubscribed: true,
        unsubscribed_at: new Date().toISOString()
      })
      .eq('unsubscribe_token', token)
      .select()
      .single();

    if (error) return false;
    return !!data;
  }

  // Analytics
  async getEmailAnalytics(
    startDate?: Date,
    endDate?: Date,
    templateName?: string
  ): Promise<EmailAnalytics> {
    const { data, error } = await this.supabase
      .rpc('get_email_analytics', {
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        template_filter: templateName
      });

    if (error) throw error;
    return data;
  }

  async trackEvent(emailLogId: string, eventType: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.supabase
      .from('email_events')
      .insert({
        email_log_id: emailLogId,
        event_type: eventType,
        metadata,
        timestamp: new Date().toISOString()
      });

    // Update email log status
    await this.supabase
      .rpc('update_email_log_status', {
        log_id: emailLogId,
        new_status: eventType,
        event_data: metadata
      });
  }

  // Helper Methods
  private async checkUserPreferences(userId: string, category: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    if (!preferences || preferences.isUnsubscribed) return false;

    const categoryMap: Record<string, keyof EmailPreferences> = {
      'welcome': 'welcomeEmails',
      'engagement': 'lessonReminders',
      'progress': 'progressUpdates',
      'gamification': 'achievementNotifications',
      'digest': 'weeklyDigest',
      'marketing': 'marketingEmails'
    };

    const preferenceKey = categoryMap[category];
    return preferenceKey ? preferences[preferenceKey] as boolean : true;
  }

  private mapTemplateFromDb(data: any): EmailTemplate {
    return {
      id: data.id,
      name: data.name,
      subject: data.subject,
      category: data.category,
      htmlContent: data.html_content,
      textContent: data.text_content,
      templateVariables: data.template_variables,
      isActive: data.is_active,
      version: data.version,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by
    };
  }

  private mapPreferencesFromDb(data: any): EmailPreferences {
    return {
      id: data.id,
      userId: data.user_id,
      welcomeEmails: data.welcome_emails,
      lessonReminders: data.lesson_reminders,
      progressUpdates: data.progress_updates,
      achievementNotifications: data.achievement_notifications,
      weeklyDigest: data.weekly_digest,
      marketingEmails: data.marketing_emails,
      frequency: data.frequency,
      timezone: data.timezone,
      preferredTime: data.preferred_time,
      unsubscribeToken: data.unsubscribe_token,
      isUnsubscribed: data.is_unsubscribed,
      unsubscribedAt: data.unsubscribed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

// Default email service instance
let emailServiceInstance: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    emailServiceInstance = new EmailService(supabaseUrl, supabaseKey, baseUrl);
  }
  
  return emailServiceInstance;
};