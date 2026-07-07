import { supabase } from '../../../api/config/supabase';
import { EmailProviderManager } from './EmailProviders';
import { QueuedEmail, EmailEvent } from '../EmailService';
import { isMaintenanceMode } from '../../utils/maintenance';

export interface QueueProcessorConfig {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  processingIntervalMs: number;
  maxConcurrentJobs: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  scheduled: number;
  totalProcessed: number;
  averageProcessingTime: number;
  successRate: number;
}

export class EmailQueueProcessor {
  private config: QueueProcessorConfig;
  private providerManager: EmailProviderManager;
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;
  private activeJobs: Set<string> = new Set();

  constructor(config: Partial<QueueProcessorConfig> = {}) {
    this.config = {
      batchSize: 10,
      maxRetries: 3,
      retryDelayMs: 60000, // 1 minute
      processingIntervalMs: 30000, // 30 seconds
      maxConcurrentJobs: 5,
      ...config
    };

    this.providerManager = new EmailProviderManager();
  }

  async start() {
    if (isMaintenanceMode()) {
      console.log('Maintenance mode enabled, email queue processor will not start');
      return;
    }
    if (this.isProcessing) {
      console.log('Email queue processor is already running');
      return;
    }

    console.log('Starting email queue processor...');
    this.isProcessing = true;

    // Process immediately on start
    await this.processQueue();

    // Set up recurring processing
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, this.config.processingIntervalMs);

    console.log(`Email queue processor started with ${this.config.processingIntervalMs}ms interval`);
  }

  async stop() {
    if (!this.isProcessing) {
      return;
    }

    console.log('Stopping email queue processor...');
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    // Wait for active jobs to complete
    while (this.activeJobs.size > 0) {
      console.log(`Waiting for ${this.activeJobs.size} active jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Email queue processor stopped');
  }

  async processQueue() {
    if (isMaintenanceMode()) {
      return;
    }
    if (!this.isProcessing || this.activeJobs.size >= this.config.maxConcurrentJobs) {
      return;
    }

    try {
      // Get pending emails that are ready to be sent
      const { data: queuedEmails, error } = await supabase
        .from('email_queue')
        .select('*')
        .in('status', ['pending', 'failed'])
        .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
        .lt('attempts', this.config.maxRetries)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(this.config.batchSize);

      if (error) {
        console.error('Failed to fetch queued emails:', error);
        return;
      }

      if (!queuedEmails || queuedEmails.length === 0) {
        return;
      }

      console.log(`Processing ${queuedEmails.length} queued emails`);

      // Process emails concurrently
      const processingPromises = queuedEmails.map(email => 
        this.processEmail(email)
      );

      await Promise.allSettled(processingPromises);
    } catch (error) {
      console.error('Queue processing error:', error);
    }
  }

  private async processEmail(queuedEmail: QueuedEmail): Promise<void> {
    const jobId = `${queuedEmail.id}-${Date.now()}`;
    this.activeJobs.add(jobId);

    try {
      // Mark as processing
      await this.updateEmailStatus(queuedEmail.id, 'processing');

      // Parse template data
      const templateData = typeof queuedEmail.templateData === 'string' 
        ? JSON.parse(queuedEmail.templateData) 
        : queuedEmail.templateData;

      // Get email template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', queuedEmail.templateName)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        throw new Error(`Template not found or inactive: ${queuedEmail.templateName}`);
      }

      // Compile template
      const compiledSubject = this.compileTemplate(template.subject, templateData);
      const compiledHtml = this.compileTemplate(template.html_content, templateData);
      const compiledText = template.text_content 
        ? this.compileTemplate(template.text_content, templateData)
        : undefined;

      // Send email using provider manager
      const result = await this.providerManager.sendEmail({
        to: queuedEmail.recipient,
        subject: compiledSubject,
        html: compiledHtml,
        text: compiledText,
        metadata: {
          queueId: queuedEmail.id,
          templateName: queuedEmail.templateName,
          userId: queuedEmail.userId
        }
      });

      if (result.success) {
        // Mark as sent and log success
        await this.updateEmailStatus(queuedEmail.id, 'sent', result.messageId);
        await this.logEmailEvent('sent', queuedEmail.id, queuedEmail.userId, {
          messageId: result.messageId,
          provider: result.provider
        });

        console.log(`Email sent successfully: ${queuedEmail.id} (${result.messageId})`);
      } else {
        throw new Error(result.error || 'Unknown send error');
      }
    } catch (error) {
      console.error(`Failed to process email ${queuedEmail.id}:`, error);

      const newAttempts = queuedEmail.attempts + 1;
      const shouldRetry = newAttempts < this.config.maxRetries;

      if (shouldRetry) {
        // Schedule retry with exponential backoff
        const retryDelay = this.config.retryDelayMs * Math.pow(2, newAttempts - 1);
        const scheduledFor = new Date(Date.now() + retryDelay);

        await this.updateEmailStatus(
          queuedEmail.id, 
          'failed', 
          null, 
          error.message,
          newAttempts,
          scheduledFor
        );

        console.log(`Email ${queuedEmail.id} scheduled for retry ${newAttempts}/${this.config.maxRetries} in ${retryDelay}ms`);
      } else {
        // Mark as permanently failed
        await this.updateEmailStatus(
          queuedEmail.id, 
          'failed', 
          null, 
          `Max retries exceeded: ${error.message}`,
          newAttempts
        );

        await this.logEmailEvent('failed', queuedEmail.id, queuedEmail.userId, {
          error: error.message,
          attempts: newAttempts
        });

        console.log(`Email ${queuedEmail.id} permanently failed after ${newAttempts} attempts`);
      }
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  private async updateEmailStatus(
    emailId: string,
    status: 'pending' | 'processing' | 'sent' | 'failed',
    messageId?: string,
    errorMessage?: string,
    attempts?: number,
    scheduledFor?: Date
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (messageId) updateData.message_id = messageId;
    if (errorMessage) updateData.error_message = errorMessage;
    if (attempts !== undefined) updateData.attempts = attempts;
    if (scheduledFor) updateData.scheduled_for = scheduledFor.toISOString();

    const { error } = await supabase
      .from('email_queue')
      .update(updateData)
      .eq('id', emailId);

    if (error) {
      console.error(`Failed to update email status for ${emailId}:`, error);
    }
  }

  private async logEmailEvent(
    eventType: string,
    emailId: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    try {
      await supabase
        .from('email_events')
        .insert({
          event_type: eventType,
          email_id: emailId,
          user_id: userId,
          metadata: metadata || {},
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log email event:', error);
    }
  }

  private compileTemplate(template: string, data: Record<string, any>): string {
    let compiled = template;

    // Simple template compilation - replace {{variable}} with data
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      compiled = compiled.replace(regex, String(value || ''));
    }

    // Remove any remaining unmatched variables
    compiled = compiled.replace(/{{[^}]+}}/g, '');

    return compiled;
  }

  async getQueueStats(): Promise<QueueStats> {
    try {
      // Get current queue counts
      const { data: queueCounts, error: queueError } = await supabase
        .from('email_queue')
        .select('status')
        .not('status', 'eq', 'sent'); // Exclude sent emails for current counts

      if (queueError) {
        throw queueError;
      }

      // Get historical stats for the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: historicalData, error: histError } = await supabase
        .from('email_queue')
        .select('status, created_at, updated_at')
        .gte('created_at', yesterday.toISOString());

      if (histError) {
        throw histError;
      }

      // Calculate stats
      const pending = queueCounts?.filter(q => q.status === 'pending').length || 0;
      const processing = queueCounts?.filter(q => q.status === 'processing').length || 0;
      const failed = queueCounts?.filter(q => q.status === 'failed').length || 0;
      const scheduled = queueCounts?.filter(q => q.status === 'scheduled').length || 0;

      const totalProcessed = historicalData?.length || 0;
      const sent = historicalData?.filter(q => q.status === 'sent').length || 0;
      const totalFailed = historicalData?.filter(q => q.status === 'failed').length || 0;

      // Calculate average processing time
      const processedEmails = historicalData?.filter(q => 
        q.status === 'sent' && q.created_at && q.updated_at
      ) || [];

      const averageProcessingTime = processedEmails.length > 0
        ? processedEmails.reduce((sum, email) => {
            const created = new Date(email.created_at).getTime();
            const updated = new Date(email.updated_at).getTime();
            return sum + (updated - created);
          }, 0) / processedEmails.length / 1000 // Convert to seconds
        : 0;

      const successRate = totalProcessed > 0 ? (sent / totalProcessed) * 100 : 0;

      return {
        pending,
        processing,
        sent,
        failed,
        scheduled,
        totalProcessed,
        averageProcessingTime,
        successRate
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        scheduled: 0,
        totalProcessed: 0,
        averageProcessingTime: 0,
        successRate: 0
      };
    }
  }

  async retryFailedEmails(emailIds?: string[]) {
    try {
      let query = supabase
        .from('email_queue')
        .update({
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'failed')
        .lt('attempts', this.config.maxRetries);

      if (emailIds && emailIds.length > 0) {
        query = query.in('id', emailIds);
      }

      const { data, error } = await query.select('id');

      if (error) {
        throw error;
      }

      console.log(`Retrying ${data?.length || 0} failed emails`);
      return data?.length || 0;
    } catch (error) {
      console.error('Failed to retry emails:', error);
      return 0;
    }
  }

  async clearOldEmails(olderThanDays: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('email_queue')
        .delete()
        .in('status', ['sent', 'failed'])
        .lt('updated_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      console.log(`Cleared ${data?.length || 0} old emails`);
      return data?.length || 0;
    } catch (error) {
      console.error('Failed to clear old emails:', error);
      return 0;
    }
  }

  async pauseQueue() {
    this.isProcessing = false;
    console.log('Email queue processing paused');
  }

  async resumeQueue() {
    if (!this.isProcessing) {
      this.isProcessing = true;
      await this.processQueue();
      console.log('Email queue processing resumed');
    }
  }

  getStatus() {
    return {
      isProcessing: this.isProcessing,
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.config.maxConcurrentJobs,
      config: this.config
    };
  }
}

// Export singleton instance
export const emailQueueProcessor = new EmailQueueProcessor();
