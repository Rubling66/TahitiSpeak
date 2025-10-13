import { createClient } from '@supabase/supabase-js';
import { PreferenceService } from './PreferenceService';
import {
  UnsubscribeManager as IUnsubscribeManager,
  UnsubscribeResult,
  UnsubscribeRequest,
  EmailPreferences
} from '../../types/email';

export class UnsubscribeManager implements IUnsubscribeManager {
  private supabase: any;
  private preferenceService: PreferenceService;

  constructor(supabaseUrl: string, supabaseKey: string, preferenceService?: PreferenceService) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.preferenceService = preferenceService || new PreferenceService(supabaseUrl, supabaseKey);
  }

  async processUnsubscribe(request: UnsubscribeRequest): Promise<UnsubscribeResult> {
    try {
      // Validate the request
      const validation = await this.validateUnsubscribeRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message || 'Invalid unsubscribe request',
          preferences: null
        };
      }

      const userEmail = validation.userEmail!;

      // Process the unsubscribe based on type
      let result: UnsubscribeResult;

      switch (request.type) {
        case 'all':
          result = await this.unsubscribeFromAll(userEmail, request);
          break;
        case 'category':
          result = await this.unsubscribeFromCategory(userEmail, request);
          break;
        case 'specific':
          result = await this.unsubscribeFromSpecific(userEmail, request);
          break;
        default:
          return {
            success: false,
            message: 'Invalid unsubscribe type',
            preferences: null
          };
      }

      // Log the unsubscribe action
      await this.logUnsubscribeAction(userEmail, request);

      return result;
    } catch (error) {
      console.error('Failed to process unsubscribe:', error);
      return {
        success: false,
        message: `Failed to process unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        preferences: null
      };
    }
  }

  private async validateUnsubscribeRequest(request: UnsubscribeRequest): Promise<{ valid: boolean; userEmail?: string; message?: string }> {
    try {
      // Validate token if provided
      if (request.token) {
        const tokenValidation = await this.preferenceService.validateUnsubscribeToken(request.token);
        if (!tokenValidation.valid) {
          return { valid: false, message: 'Invalid or expired unsubscribe token' };
        }
        return { valid: true, userEmail: tokenValidation.userEmail };
      }

      // Validate email if provided
      if (request.userEmail) {
        if (!this.isValidEmail(request.userEmail)) {
          return { valid: false, message: 'Invalid email address' };
        }
        return { valid: true, userEmail: request.userEmail };
      }

      return { valid: false, message: 'Either token or email must be provided' };
    } catch (error) {
      console.error('Failed to validate unsubscribe request:', error);
      return { valid: false, message: 'Validation failed' };
    }
  }

  private async unsubscribeFromAll(userEmail: string, request: UnsubscribeRequest): Promise<UnsubscribeResult> {
    try {
      const result = await this.preferenceService.unsubscribe(
        userEmail,
        request.reason || 'user_request',
        request.source || 'unsubscribe_link'
      );

      return {
        ...result,
        message: 'You have been successfully unsubscribed from all emails.'
      };
    } catch (error) {
      console.error('Failed to unsubscribe from all:', error);
      throw error;
    }
  }

  private async unsubscribeFromCategory(userEmail: string, request: UnsubscribeRequest): Promise<UnsubscribeResult> {
    try {
      if (!request.categories || request.categories.length === 0) {
        return {
          success: false,
          message: 'No categories specified for unsubscribe',
          preferences: null
        };
      }

      // Get current preferences
      const currentPreferences = await this.preferenceService.getPreferences(userEmail);
      if (!currentPreferences) {
        return {
          success: false,
          message: 'User preferences not found',
          preferences: null
        };
      }

      // Update preferences based on categories
      const updates: any = {};

      for (const category of request.categories) {
        switch (category) {
          case 'marketing':
            updates.marketingEmails = false;
            break;
          case 'notifications':
            updates.notificationEmails = false;
            break;
          case 'lesson_reminders':
            updates.lessonReminders = false;
            break;
          case 'achievements':
            updates.achievementAlerts = false;
            break;
          case 'weekly_digest':
            updates.weeklyDigest = false;
            break;
          default:
            // Remove from email types array
            if (currentPreferences.emailTypes.includes(category)) {
              updates.emailTypes = currentPreferences.emailTypes.filter(type => type !== category);
            }
        }
      }

      const updatedPreferences = await this.preferenceService.updatePreferences(userEmail, updates);

      return {
        success: true,
        message: `You have been unsubscribed from: ${request.categories.join(', ')}`,
        preferences: updatedPreferences
      };
    } catch (error) {
      console.error('Failed to unsubscribe from category:', error);
      throw error;
    }
  }

  private async unsubscribeFromSpecific(userEmail: string, request: UnsubscribeRequest): Promise<UnsubscribeResult> {
    try {
      if (!request.emailTypes || request.emailTypes.length === 0) {
        return {
          success: false,
          message: 'No specific email types specified for unsubscribe',
          preferences: null
        };
      }

      // Get current preferences
      const currentPreferences = await this.preferenceService.getPreferences(userEmail);
      if (!currentPreferences) {
        return {
          success: false,
          message: 'User preferences not found',
          preferences: null
        };
      }

      // Remove specified email types
      const updatedEmailTypes = currentPreferences.emailTypes.filter(
        type => !request.emailTypes!.includes(type)
      );

      const updatedPreferences = await this.preferenceService.updatePreferences(userEmail, {
        emailTypes: updatedEmailTypes
      });

      return {
        success: true,
        message: `You have been unsubscribed from: ${request.emailTypes.join(', ')}`,
        preferences: updatedPreferences
      };
    } catch (error) {
      console.error('Failed to unsubscribe from specific types:', error);
      throw error;
    }
  }

  async generateUnsubscribeLink(userEmail: string, baseUrl: string, options?: {
    type?: 'all' | 'category' | 'specific';
    categories?: string[];
    emailTypes?: string[];
    source?: string;
  }): Promise<string> {
    try {
      const token = await this.preferenceService.generateUnsubscribeToken(userEmail);
      
      let url = `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
      
      if (options?.type) {
        url += `&type=${options.type}`;
      }
      
      if (options?.categories && options.categories.length > 0) {
        url += `&categories=${encodeURIComponent(options.categories.join(','))}`;
      }
      
      if (options?.emailTypes && options.emailTypes.length > 0) {
        url += `&emailTypes=${encodeURIComponent(options.emailTypes.join(','))}`;
      }
      
      if (options?.source) {
        url += `&source=${encodeURIComponent(options.source)}`;
      }

      return url;
    } catch (error) {
      console.error('Failed to generate unsubscribe link:', error);
      throw error;
    }
  }

  async generatePreferenceCenterLink(userEmail: string, baseUrl: string): Promise<string> {
    try {
      const token = await this.preferenceService.generateUnsubscribeToken(userEmail);
      return `${baseUrl}/preferences?token=${encodeURIComponent(token)}`;
    } catch (error) {
      console.error('Failed to generate preference center link:', error);
      throw error;
    }
  }

  async handleOneClickUnsubscribe(userEmail: string, listId?: string): Promise<UnsubscribeResult> {
    try {
      // RFC 8058 compliant one-click unsubscribe
      const result = await this.preferenceService.unsubscribe(
        userEmail,
        'one_click_unsubscribe',
        'list_unsubscribe_header'
      );

      // If listId is provided, you could handle list-specific unsubscribes here
      if (listId) {
        console.log(`One-click unsubscribe from list: ${listId}`);
      }

      return {
        ...result,
        message: 'You have been successfully unsubscribed via one-click unsubscribe.'
      };
    } catch (error) {
      console.error('Failed to handle one-click unsubscribe:', error);
      throw error;
    }
  }

  async resubscribe(userEmail: string, token?: string): Promise<UnsubscribeResult> {
    try {
      // Validate token if provided
      if (token) {
        const validation = await this.preferenceService.validateUnsubscribeToken(token);
        if (!validation.valid || validation.userEmail !== userEmail) {
          return {
            success: false,
            message: 'Invalid or expired token',
            preferences: null
          };
        }
      }

      const result = await this.preferenceService.resubscribe(userEmail);
      
      // Log the resubscribe action
      await this.logResubscribeAction(userEmail);

      return {
        ...result,
        message: 'You have been successfully resubscribed to emails.'
      };
    } catch (error) {
      console.error('Failed to resubscribe:', error);
      return {
        success: false,
        message: `Failed to resubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        preferences: null
      };
    }
  }

  async getUnsubscribeReasons(): Promise<Array<{ value: string; label: string; description?: string }>> {
    return [
      {
        value: 'too_frequent',
        label: 'Too many emails',
        description: 'I receive emails too frequently'
      },
      {
        value: 'not_relevant',
        label: 'Not relevant',
        description: 'The content is not relevant to me'
      },
      {
        value: 'never_signed_up',
        label: 'Never signed up',
        description: 'I never signed up for these emails'
      },
      {
        value: 'temporary',
        label: 'Temporary break',
        description: 'I want to take a temporary break'
      },
      {
        value: 'privacy_concerns',
        label: 'Privacy concerns',
        description: 'I have privacy concerns'
      },
      {
        value: 'technical_issues',
        label: 'Technical issues',
        description: 'I am experiencing technical issues'
      },
      {
        value: 'other',
        label: 'Other',
        description: 'Other reason'
      }
    ];
  }

  async getUnsubscribeStats(days: number = 30): Promise<{
    totalUnsubscribes: number;
    unsubscribeRate: number;
    topReasons: Array<{ reason: string; count: number; percentage: number }>;
    dailyUnsubscribes: Array<{ date: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get unsubscribe logs
      const { data: unsubscribeData } = await this.supabase
        .from('unsubscribe_log')
        .select('reason, created_at')
        .gte('created_at', startDate.toISOString());

      // Get total emails sent in the same period for rate calculation
      const { count: totalEmailsSent } = await this.supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      const totalUnsubscribes = unsubscribeData?.length || 0;
      const unsubscribeRate = totalEmailsSent ? (totalUnsubscribes / totalEmailsSent) * 100 : 0;

      // Calculate top reasons
      const reasonCounts: Record<string, number> = {};
      (unsubscribeData || []).forEach((row: any) => {
        reasonCounts[row.reason] = (reasonCounts[row.reason] || 0) + 1;
      });

      const topReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: totalUnsubscribes > 0 ? (count / totalUnsubscribes) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate daily unsubscribes
      const dailyCounts: Record<string, number> = {};
      (unsubscribeData || []).forEach((row: any) => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      const dailyUnsubscribes = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalUnsubscribes,
        unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
        topReasons,
        dailyUnsubscribes
      };
    } catch (error) {
      console.error('Failed to get unsubscribe stats:', error);
      throw error;
    }
  }

  private async logUnsubscribeAction(userEmail: string, request: UnsubscribeRequest): Promise<void> {
    try {
      await this.supabase
        .from('unsubscribe_log')
        .insert({
          user_email: userEmail,
          reason: request.reason || 'user_request',
          source: request.source || 'unsubscribe_link',
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          metadata: {
            type: request.type,
            categories: request.categories,
            emailTypes: request.emailTypes,
            feedback: request.feedback
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log unsubscribe action:', error);
      // Don't throw error as logging is not critical
    }
  }

  private async logResubscribeAction(userEmail: string): Promise<void> {
    try {
      await this.supabase
        .from('unsubscribe_log')
        .insert({
          user_email: userEmail,
          reason: 'resubscribe',
          source: 'preference_center',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log resubscribe action:', error);
      // Don't throw error as logging is not critical
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async bulkUnsubscribe(emails: string[], reason?: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of emails) {
      try {
        await this.preferenceService.unsubscribe(email, reason || 'bulk_unsubscribe', 'admin_action');
        success++;
      } catch (error) {
        failed++;
        errors.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success, failed, errors };
  }

  async suppressEmail(userEmail: string, reason: string): Promise<void> {
    try {
      // Add to suppression list (could be a separate table)
      await this.preferenceService.unsubscribe(userEmail, reason, 'suppression');
      
      // Mark as bounced if it's a bounce-related suppression
      if (reason.includes('bounce') || reason.includes('invalid')) {
        await this.supabase
          .from('email_preferences')
          .update({
            is_bounced: true,
            bounce_count: this.supabase.raw('bounce_count + 1'),
            updated_at: new Date().toISOString()
          })
          .eq('user_email', userEmail);
      }
    } catch (error) {
      console.error('Failed to suppress email:', error);
      throw error;
    }
  }
}