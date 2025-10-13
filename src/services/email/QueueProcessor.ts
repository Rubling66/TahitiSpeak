import Bull, { Queue, Job, JobOptions } from 'bull';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import {
  QueueProcessor as IQueueProcessor,
  QueuedEmail,
  EmailStatus,
  QueueStats,
  EmailRequest,
  EmailResponse,
  EmailPriority
} from '../../types/email';
import { ProviderManager } from './ProviderManager';
import { TemplateEngine } from './TemplateEngine';
import { createClient } from '@supabase/supabase-js';

interface QueueJobData {
  queuedEmail: QueuedEmail;
  emailRequest: EmailRequest;
  retryCount?: number;
}

export class QueueProcessor extends EventEmitter implements IQueueProcessor {
  private emailQueue: Queue<QueueJobData>;
  private redis: Redis;
  private providerManager: ProviderManager;
  private templateEngine: TemplateEngine;
  private supabase: any;
  private isProcessing = false;
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    redisConfig: { host: string; port: number; password?: string },
    providerManager: ProviderManager,
    templateEngine: TemplateEngine,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    super();
    
    this.providerManager = providerManager;
    this.templateEngine = templateEngine;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize Redis connection
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Initialize Bull queue
    this.emailQueue = new Bull('email-queue', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.setupQueueProcessors();
    this.setupEventHandlers();
  }

  private setupQueueProcessors(): void {
    // Process high priority emails
    this.emailQueue.process('high-priority', 5, async (job: Job<QueueJobData>) => {
      return this.processEmailJob(job);
    });

    // Process normal priority emails
    this.emailQueue.process('normal-priority', 3, async (job: Job<QueueJobData>) => {
      return this.processEmailJob(job);
    });

    // Process low priority emails
    this.emailQueue.process('low-priority', 1, async (job: Job<QueueJobData>) => {
      return this.processEmailJob(job);
    });

    // Process scheduled emails
    this.emailQueue.process('scheduled', 2, async (job: Job<QueueJobData>) => {
      return this.processEmailJob(job);
    });
  }

  private setupEventHandlers(): void {
    this.emailQueue.on('completed', async (job: Job<QueueJobData>, result: EmailResponse) => {
      console.log(`Email job ${job.id} completed successfully`);
      await this.updateEmailStatus(job.data.queuedEmail.id, 'sent', result);
      this.emit('email:sent', { queuedEmail: job.data.queuedEmail, result });
    });

    this.emailQueue.on('failed', async (job: Job<QueueJobData>, error: Error) => {
      console.error(`Email job ${job.id} failed:`, error);
      await this.updateEmailStatus(job.data.queuedEmail.id, 'failed', null, error.message);
      this.emit('email:failed', { queuedEmail: job.data.queuedEmail, error });
    });

    this.emailQueue.on('stalled', async (job: Job<QueueJobData>) => {
      console.warn(`Email job ${job.id} stalled`);
      this.emit('email:stalled', { queuedEmail: job.data.queuedEmail });
    });

    this.emailQueue.on('progress', async (job: Job<QueueJobData>, progress: number) => {
      console.log(`Email job ${job.id} progress: ${progress}%`);
      this.emit('email:progress', { queuedEmail: job.data.queuedEmail, progress });
    });

    // Redis connection events
    this.redis.on('connect', () => {
      console.log('Redis connected for email queue');
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
      this.emit('queue:error', { error });
    });
  }

  private async processEmailJob(job: Job<QueueJobData>): Promise<EmailResponse> {
    const { queuedEmail, emailRequest } = job.data;
    
    try {
      // Update job progress
      await job.progress(10);

      // Check rate limits
      const canSend = await this.checkRateLimit(queuedEmail.userId);
      if (!canSend) {
        throw new Error('Rate limit exceeded for user');
      }

      await job.progress(20);

      // Update email status to processing
      await this.updateEmailStatus(queuedEmail.id, 'processing');

      await job.progress(30);

      // Send email using provider manager with failover
      const result = await this.providerManager.sendWithFailover(emailRequest);

      await job.progress(80);

      // Update rate limit counter
      await this.updateRateLimit(queuedEmail.userId);

      await job.progress(100);

      return result;
    } catch (error) {
      console.error(`Failed to process email job ${job.id}:`, error);
      
      // Increment retry count
      const retryCount = (job.data.retryCount || 0) + 1;
      job.data.retryCount = retryCount;

      // Update email status
      await this.updateEmailStatus(
        queuedEmail.id, 
        retryCount >= 3 ? 'failed' : 'pending',
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  async addToQueue(queuedEmail: QueuedEmail, emailRequest: EmailRequest): Promise<string> {
    try {
      const jobOptions: JobOptions = {
        priority: this.getPriorityValue(queuedEmail.priority),
        delay: queuedEmail.scheduledAt ? 
          Math.max(0, new Date(queuedEmail.scheduledAt).getTime() - Date.now()) : 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      };

      const jobType = queuedEmail.scheduledAt ? 'scheduled' : `${queuedEmail.priority}-priority`;
      
      const job = await this.emailQueue.add(
        jobType,
        { queuedEmail, emailRequest },
        jobOptions
      );

      console.log(`Added email to queue: ${job.id} (${jobType})`);
      this.emit('email:queued', { queuedEmail, jobId: job.id });

      return job.id?.toString() || 'unknown';
    } catch (error) {
      console.error('Failed to add email to queue:', error);
      throw new Error('Failed to queue email');
    }
  }

  async addBulkToQueue(emails: Array<{ queuedEmail: QueuedEmail; emailRequest: EmailRequest }>): Promise<string[]> {
    try {
      const jobs = emails.map(({ queuedEmail, emailRequest }) => {
        const jobOptions: JobOptions = {
          priority: this.getPriorityValue(queuedEmail.priority),
          delay: queuedEmail.scheduledAt ? 
            Math.max(0, new Date(queuedEmail.scheduledAt).getTime() - Date.now()) : 0,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        };

        const jobType = queuedEmail.scheduledAt ? 'scheduled' : `${queuedEmail.priority}-priority`;

        return {
          name: jobType,
          data: { queuedEmail, emailRequest },
          opts: jobOptions
        };
      });

      const addedJobs = await this.emailQueue.addBulk(jobs);
      const jobIds = addedJobs.map(job => job.id?.toString() || 'unknown');

      console.log(`Added ${jobIds.length} emails to queue`);
      this.emit('emails:bulk_queued', { count: jobIds.length, jobIds });

      return jobIds;
    } catch (error) {
      console.error('Failed to add bulk emails to queue:', error);
      throw new Error('Failed to queue bulk emails');
    }
  }

  private getPriorityValue(priority: EmailPriority): number {
    const priorityMap: Record<EmailPriority, number> = {
      high: 1,
      normal: 5,
      low: 10
    };
    return priorityMap[priority] || 5;
  }

  async pauseQueue(): Promise<void> {
    await this.emailQueue.pause();
    console.log('Email queue paused');
    this.emit('queue:paused');
  }

  async resumeQueue(): Promise<void> {
    await this.emailQueue.resume();
    console.log('Email queue resumed');
    this.emit('queue:resumed');
  }

  async retryJob(jobId: string): Promise<void> {
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (job) {
        await job.retry();
        console.log(`Retrying job: ${jobId}`);
        this.emit('job:retried', { jobId });
      } else {
        throw new Error(`Job ${jobId} not found`);
      }
    } catch (error) {
      console.error(`Failed to retry job ${jobId}:`, error);
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (job) {
        await job.remove();
        console.log(`Cancelled job: ${jobId}`);
        this.emit('job:cancelled', { jobId });
      } else {
        throw new Error(`Job ${jobId} not found`);
      }
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      throw error;
    }
  }

  async getQueueStats(): Promise<QueueStats> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(),
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed(),
        this.emailQueue.getDelayed()
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0
      };
    }
  }

  async getJobStatus(jobId: string): Promise<{ status: string; progress: number; result?: any; error?: string }> {
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      const state = await job.getState();
      const progress = job.progress();
      
      return {
        status: state,
        progress: typeof progress === 'number' ? progress : 0,
        result: job.returnvalue,
        error: job.failedReason
      };
    } catch (error) {
      console.error(`Failed to get job status for ${jobId}:`, error);
      throw error;
    }
  }

  // Rate limiting methods
  private async checkRateLimit(userId: string): Promise<boolean> {
    const key = `rate_limit:${userId}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour window
    const maxEmails = 100; // Max 100 emails per hour per user

    try {
      const current = this.rateLimiters.get(key);
      
      if (!current || now > current.resetTime) {
        // Reset or initialize rate limit
        this.rateLimiters.set(key, { count: 0, resetTime: now + windowMs });
        return true;
      }

      return current.count < maxEmails;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow on error
    }
  }

  private async updateRateLimit(userId: string): Promise<void> {
    const key = `rate_limit:${userId}`;
    const current = this.rateLimiters.get(key);
    
    if (current) {
      current.count += 1;
      this.rateLimiters.set(key, current);
    }
  }

  // Database operations
  private async updateEmailStatus(
    emailId: string, 
    status: EmailStatus, 
    result?: EmailResponse | null,
    error?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (result) {
        updateData.provider_message_id = result.messageId;
        updateData.provider_name = result.provider;
        updateData.provider_response = result.metadata;
      }

      if (error) {
        updateData.error_message = error;
        updateData.attempts = updateData.attempts ? updateData.attempts + 1 : 1;
      }

      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      }

      await this.supabase
        .from('email_queue')
        .update(updateData)
        .eq('id', emailId);

      console.log(`Updated email ${emailId} status to ${status}`);
    } catch (error) {
      console.error(`Failed to update email status for ${emailId}:`, error);
    }
  }

  // Monitoring and cleanup
  async cleanupCompletedJobs(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      const completed = await this.emailQueue.getCompleted();
      
      let cleaned = 0;
      for (const job of completed) {
        if (job.timestamp < cutoffTime) {
          await job.remove();
          cleaned++;
        }
      }

      console.log(`Cleaned up ${cleaned} completed jobs older than ${olderThanHours} hours`);
      return cleaned;
    } catch (error) {
      console.error('Failed to cleanup completed jobs:', error);
      return 0;
    }
  }

  async cleanupFailedJobs(olderThanHours: number = 72): Promise<number> {
    try {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      const failed = await this.emailQueue.getFailed();
      
      let cleaned = 0;
      for (const job of failed) {
        if (job.timestamp < cutoffTime) {
          await job.remove();
          cleaned++;
        }
      }

      console.log(`Cleaned up ${cleaned} failed jobs older than ${olderThanHours} hours`);
      return cleaned;
    } catch (error) {
      console.error('Failed to cleanup failed jobs:', error);
      return 0;
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Check Redis connection
      await this.redis.ping();
      
      // Check queue status
      const stats = await this.getQueueStats();
      
      // Consider unhealthy if too many failed jobs
      const failureRate = stats.total > 0 ? stats.failed / stats.total : 0;
      
      return failureRate < 0.1; // Less than 10% failure rate
    } catch (error) {
      console.error('Queue health check failed:', error);
      return false;
    }
  }

  // Shutdown
  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down email queue processor...');
      
      // Close the queue
      await this.emailQueue.close();
      
      // Close Redis connection
      this.redis.disconnect();
      
      // Clear rate limiters
      this.rateLimiters.clear();
      
      // Remove all listeners
      this.removeAllListeners();
      
      console.log('Email queue processor shutdown complete');
    } catch (error) {
      console.error('Error during queue processor shutdown:', error);
    }
  }
}