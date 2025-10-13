import { EventEmitter } from 'events';
import { createClient } from '@supabase/supabase-js';
import {
  EmailService as IEmailService,
  EmailTemplate,
  EmailLog,
  EmailPreferences,
  QueuedEmail,
  SendEmailRequest,
  ScheduleEmailRequest,
  SendEmailResult,
  TemplateFilters,
  AnalyticsFilters,
  EmailAnalytics,
  TemplatePerformance,
  QueueStats,
  UnsubscribeResult,
  EmailServiceConfig,
  EmailServiceEvents,
  EmailStatus,
  QueueStatus
} from '../../types/email';
import { ProviderManager } from './ProviderManager';
import { TemplateEngine } from './TemplateEngine';
import { QueueProcessor } from './QueueProcessor';
import { EmailAnalyticsService } from './EmailAnalyticsService';

export class EmailService extends EventEmitter implements IEmailService {
  private supabase;
  private providerManager: ProviderManager;
  private templateEngine: TemplateEngine;
  private queueProcessor: QueueProcessor;
  private analyticsService: EmailAnalyticsService;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    super();
    this.config = config;
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize services
    this.providerManager = new ProviderManager(config);
    this.templateEngine = new TemplateEngine();
    this.queueProcessor = new QueueProcessor(config, this.providerManager, this.templateEngine);
    this.analyticsService = new EmailAnalyticsService(this.supabase);

    // Set up event forwarding
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    // Forward events from queue processor
    this.queueProcessor.on('email:sent', (data) => this.emit('email:sent', data));
    this.queueProcessor.on('email:failed', (data) => this.emit('email:failed', data));
    this.queueProcessor.on('queue:processed', (data) => this.emit('queue:processed', data));

    // Forward events from provider manager
    this.providerManager.on('provider:unavailable', (data) => this.emit('provider:unavailable', data));
    this.providerManager.on('provider:recovered', (data) => this.emit('provider:recovered', data));
  }

  // Template Management
  async getTemplate(name: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_templates')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapDbTemplateToEmailTemplate(data);
    } catch (error) {
      console.error('Error getting template:', error);
      throw new Error(`Failed to get template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    try {
      // Validate template
      const validation = await this.templateEngine.validateTemplate(template as EmailTemplate);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
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
          version: template.version,
          created_by: template.createdBy,
          updated_by: template.updatedBy
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDbTemplateToEmailTemplate(data);
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.subject) updateData.subject = updates.subject;
      if (updates.category) updateData.category = updates.category;
      if (updates.htmlContent) updateData.html_content = updates.htmlContent;
      if (updates.textContent !== undefined) updateData.text_content = updates.textContent;
      if (updates.templateVariables) updateData.template_variables = updates.templateVariables;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.version) updateData.version = updates.version;
      if (updates.updatedBy) updateData.updated_by = updates.updatedBy;

      const { data, error } = await this.supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapDbTemplateToEmailTemplate(data);
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listTemplates(filters: TemplateFilters = {}): Promise<EmailTemplate[]> {
    try {
      let query = this.supabase.from('email_templates').select('*');

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data.map(this.mapDbTemplateToEmailTemplate);
    } catch (error) {
      console.error('Error listing templates:', error);
      throw new Error(`Failed to list templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Email Sending
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResult> {
    try {
      // Check user preferences
      if (request.userId) {
        const preferences = await this.getUserPreferences(request.userId);
        if (!this.shouldSendEmail(request.templateName, preferences)) {
          return {
            success: false,
            error: 'User has opted out of this email type'
          };
        }
      }

      // Get template
      const template = await this.getTemplate(request.templateName);
      if (!template) {
        return {
          success: false,
          error: `Template '${request.templateName}' not found`
        };
      }

      // Compile template
      const compiledTemplate = await this.templateEngine.compileTemplate(template, request.templateData);

      // Create email log entry
      const emailLog = await this.createEmailLog({
        userId: request.userId,
        templateName: request.templateName,
        recipientEmail: request.recipientEmail,
        subject: compiledTemplate.subject,
        status: 'pending' as EmailStatus,
        provider: 'sendgrid', // Will be updated when sent
        templateData: request.templateData
      });

      // Send immediately or queue
      if (request.scheduledAt && request.scheduledAt > new Date()) {
        // Schedule for later
        const queuedEmail = await this.scheduleEmail(request);
        return {
          success: true,
          emailLogId: emailLog.id,
          messageId: queuedEmail.id
        };
      } else {
        // Send immediately
        const provider = await this.providerManager.selectProvider();
        const result = await provider.sendEmail({
          ...compiledTemplate,
          recipientEmail: request.recipientEmail,
          templateName: request.templateName,
          templateData: request.templateData
        });

        // Update email log
        await this.updateEmailLog(emailLog.id, {
          status: result.success ? 'sent' : 'failed',
          provider: provider.name as any,
          providerMessageId: result.messageId,
          errorMessage: result.error,
          sentAt: result.success ? new Date() : undefined
        });

        this.emit('email:sent', { emailLogId: emailLog.id, messageId: result.messageId || '' });

        return {
          success: result.success,
          messageId: result.messageId,
          provider: provider.name,
          error: result.error,
          emailLogId: emailLog.id
        };
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendBulkEmail(requests: SendEmailRequest[]): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.sendEmail(request));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
          });
        }
      });

      // Small delay between batches
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  async scheduleEmail(request: ScheduleEmailRequest): Promise<QueuedEmail> {
    try {
      const { data, error } = await this.supabase
        .from('email_queue')
        .insert({
          user_id: request.userId,
          template_name: request.templateName,
          recipient_email: request.recipientEmail,
          template_data: request.templateData,
          priority: request.priority || 5,
          scheduled_at: request.scheduledAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDbQueueToQueuedEmail(data);
    } catch (error) {
      console.error('Error scheduling email:', error);
      throw new Error(`Failed to schedule email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Queue Management
  async getQueueStatus(): Promise<QueueStats> {
    try {
      const { data, error } = await this.supabase
        .from('email_queue')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = data.reduce((acc, item) => {
        acc[item.status as QueueStatus] = (acc[item.status as QueueStatus] || 0) + 1;
        return acc;
      }, {} as Record<QueueStatus, number>);

      return {
        pending: stats.pending || 0,
        processing: stats.processing || 0,
        sent: stats.sent || 0,
        failed: stats.failed || 0,
        totalToday: data.length,
        averageProcessingTime: 0 // TODO: Calculate from processing times
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      throw new Error(`Failed to get queue status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async retryFailedEmails(maxAttempts: number = 3): Promise<void> {
    try {
      await this.queueProcessor.retryFailed(maxAttempts);
    } catch (error) {
      console.error('Error retrying failed emails:', error);
      throw new Error(`Failed to retry failed emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelQueuedEmail(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_queue')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling queued email:', error);
      throw new Error(`Failed to cancel queued email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analytics
  async getEmailAnalytics(filters: AnalyticsFilters): Promise<EmailAnalytics> {
    return this.analyticsService.getEmailAnalytics(filters);
  }

  async getTemplatePerformance(templateName?: string): Promise<TemplatePerformance[]> {
    return this.analyticsService.getTemplatePerformance(templateName);
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<EmailPreferences> {
    try {
      const { data, error } = await this.supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Create default preferences if not found
          return this.createDefaultPreferences(userId);
        }
        throw error;
      }

      return this.mapDbPreferencesToEmailPreferences(data);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw new Error(`Failed to get user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences> {
    try {
      const updateData: any = {};
      
      if (preferences.welcomeEmails !== undefined) updateData.welcome_emails = preferences.welcomeEmails;
      if (preferences.lessonReminders !== undefined) updateData.lesson_reminders = preferences.lessonReminders;
      if (preferences.progressUpdates !== undefined) updateData.progress_updates = preferences.progressUpdates;
      if (preferences.achievementNotifications !== undefined) updateData.achievement_notifications = preferences.achievementNotifications;
      if (preferences.weeklyDigest !== undefined) updateData.weekly_digest = preferences.weeklyDigest;
      if (preferences.marketingEmails !== undefined) updateData.marketing_emails = preferences.marketingEmails;
      if (preferences.frequency) updateData.frequency = preferences.frequency;
      if (preferences.timezone) updateData.timezone = preferences.timezone;
      if (preferences.preferredTime) updateData.preferred_time = preferences.preferredTime;

      const { data, error } = await this.supabase
        .from('email_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.mapDbPreferencesToEmailPreferences(data);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error(`Failed to update user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async unsubscribe(token: string): Promise<UnsubscribeResult> {
    try {
      // Get user preferences by token
      const { data: preferencesData, error: preferencesError } = await this.supabase
        .from('email_preferences')
        .select('*')
        .eq('unsubscribe_token', token)
        .single();

      if (preferencesError) {
        return {
          success: false,
          error: 'Invalid unsubscribe token'
        };
      }

      const previousPreferences = this.mapDbPreferencesToEmailPreferences(preferencesData);

      // Update preferences to unsubscribe from all emails
      const { error: updateError } = await this.supabase
        .from('email_preferences')
        .update({
          welcome_emails: false,
          lesson_reminders: false,
          progress_updates: false,
          achievement_notifications: false,
          weekly_digest: false,
          marketing_emails: false,
          frequency: 'never'
        })
        .eq('unsubscribe_token', token);

      if (updateError) throw updateError;

      // Log unsubscribe
      await this.supabase
        .from('unsubscribe_log')
        .insert({
          user_id: previousPreferences.userId,
          email: 'unknown', // We don't have email in preferences table
          unsubscribe_token: token,
          reason: 'Unsubscribed via email link'
        });

      return {
        success: true,
        userId: previousPreferences.userId,
        previousPreferences
      };
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper Methods
  private shouldSendEmail(templateName: string, preferences: EmailPreferences): boolean {
    if (preferences.frequency === 'never') return false;

    switch (templateName) {
      case 'welcome_email':
        return preferences.welcomeEmails;
      case 'lesson_reminder':
        return preferences.lessonReminders;
      case 'progress_update':
        return preferences.progressUpdates;
      case 'achievement_unlocked':
        return preferences.achievementNotifications;
      case 'weekly_digest':
        return preferences.weeklyDigest;
      default:
        return preferences.marketingEmails;
    }
  }

  private async createDefaultPreferences(userId: string): Promise<EmailPreferences> {
    const token = this.generateUnsubscribeToken();
    
    const { data, error } = await this.supabase
      .from('email_preferences')
      .insert({
        user_id: userId,
        unsubscribe_token: token
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapDbPreferencesToEmailPreferences(data);
  }

  private generateUnsubscribeToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async createEmailLog(logData: Partial<EmailLog>): Promise<EmailLog> {
    const { data, error } = await this.supabase
      .from('email_logs')
      .insert({
        user_id: logData.userId,
        template_name: logData.templateName,
        recipient_email: logData.recipientEmail,
        subject: logData.subject,
        status: logData.status,
        provider: logData.provider,
        provider_message_id: logData.providerMessageId,
        template_data: logData.templateData,
        error_message: logData.errorMessage,
        sent_at: logData.sentAt?.toISOString(),
        delivered_at: logData.deliveredAt?.toISOString(),
        opened_at: logData.openedAt?.toISOString(),
        clicked_at: logData.clickedAt?.toISOString(),
        bounced_at: logData.bouncedAt?.toISOString(),
        bounce_reason: logData.bounceReason
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapDbLogToEmailLog(data);
  }

  private async updateEmailLog(id: string, updates: Partial<EmailLog>): Promise<void> {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.provider) updateData.provider = updates.provider;
    if (updates.providerMessageId) updateData.provider_message_id = updates.providerMessageId;
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
    if (updates.sentAt) updateData.sent_at = updates.sentAt.toISOString();
    if (updates.deliveredAt) updateData.delivered_at = updates.deliveredAt.toISOString();
    if (updates.openedAt) updateData.opened_at = updates.openedAt.toISOString();
    if (updates.clickedAt) updateData.clicked_at = updates.clickedAt.toISOString();
    if (updates.bouncedAt) updateData.bounced_at = updates.bouncedAt.toISOString();
    if (updates.bounceReason) updateData.bounce_reason = updates.bounceReason;

    const { error } = await this.supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  // Mapping functions
  private mapDbTemplateToEmailTemplate(data: any): EmailTemplate {
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      updatedBy: data.updated_by
    };
  }

  private mapDbLogToEmailLog(data: any): EmailLog {
    return {
      id: data.id,
      userId: data.user_id,
      templateName: data.template_name,
      recipientEmail: data.recipient_email,
      subject: data.subject,
      status: data.status,
      provider: data.provider,
      providerMessageId: data.provider_message_id,
      templateData: data.template_data,
      errorMessage: data.error_message,
      sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
      deliveredAt: data.delivered_at ? new Date(data.delivered_at) : undefined,
      openedAt: data.opened_at ? new Date(data.opened_at) : undefined,
      clickedAt: data.clicked_at ? new Date(data.clicked_at) : undefined,
      bouncedAt: data.bounced_at ? new Date(data.bounced_at) : undefined,
      bounceReason: data.bounce_reason,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapDbPreferencesToEmailPreferences(data: any): EmailPreferences {
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapDbQueueToQueuedEmail(data: any): QueuedEmail {
    return {
      id: data.id,
      userId: data.user_id,
      templateName: data.template_name,
      recipientEmail: data.recipient_email,
      templateData: data.template_data,
      priority: data.priority,
      scheduledAt: new Date(data.scheduled_at),
      attempts: data.attempts,
      maxAttempts: data.max_attempts,
      status: data.status,
      errorMessage: data.error_message,
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Cleanup and shutdown
  async shutdown(): Promise<void> {
    await this.queueProcessor.shutdown();
  }
}