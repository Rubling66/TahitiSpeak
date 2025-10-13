import { createClient } from '@supabase/supabase-js';
import {
  PreferenceService as IPreferenceService,
  EmailPreferences,
  PreferenceUpdate,
  UnsubscribeResult,
  PreferenceFilter
} from '../../types/email';

export class PreferenceService implements IPreferenceService {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getPreferences(userEmail: string): Promise<EmailPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_preferences')
        .select('*')
        .eq('user_email', userEmail)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          return await this.createDefaultPreferences(userEmail);
        }
        throw new Error(`Failed to get preferences: ${error.message}`);
      }

      return this.mapDatabasePreferencesToEmailPreferences(data);
    } catch (error) {
      console.error('Failed to get email preferences:', error);
      throw error;
    }
  }

  async updatePreferences(userEmail: string, updates: PreferenceUpdate): Promise<EmailPreferences> {
    try {
      // Get existing preferences or create default ones
      let existingPreferences = await this.getPreferences(userEmail);
      
      if (!existingPreferences) {
        existingPreferences = await this.createDefaultPreferences(userEmail);
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Apply updates
      if (updates.isSubscribed !== undefined) {
        updateData.is_subscribed = updates.isSubscribed;
        if (!updates.isSubscribed) {
          updateData.unsubscribed_at = new Date().toISOString();
          updateData.unsubscribe_reason = updates.unsubscribeReason || 'user_request';
        } else {
          updateData.unsubscribed_at = null;
          updateData.unsubscribe_reason = null;
        }
      }

      if (updates.emailTypes !== undefined) {
        updateData.email_types = updates.emailTypes;
      }

      if (updates.frequency !== undefined) {
        updateData.frequency = updates.frequency;
      }

      if (updates.language !== undefined) {
        updateData.language = updates.language;
      }

      if (updates.timezone !== undefined) {
        updateData.timezone = updates.timezone;
      }

      if (updates.marketingEmails !== undefined) {
        updateData.marketing_emails = updates.marketingEmails;
      }

      if (updates.notificationEmails !== undefined) {
        updateData.notification_emails = updates.notificationEmails;
      }

      if (updates.lessonReminders !== undefined) {
        updateData.lesson_reminders = updates.lessonReminders;
      }

      if (updates.achievementAlerts !== undefined) {
        updateData.achievement_alerts = updates.achievementAlerts;
      }

      if (updates.weeklyDigest !== undefined) {
        updateData.weekly_digest = updates.weeklyDigest;
      }

      // Update in database
      const { data, error } = await this.supabase
        .from('email_preferences')
        .update(updateData)
        .eq('user_email', userEmail)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update preferences: ${error.message}`);
      }

      return this.mapDatabasePreferencesToEmailPreferences(data);
    } catch (error) {
      console.error('Failed to update email preferences:', error);
      throw error;
    }
  }

  async unsubscribe(userEmail: string, reason?: string, source?: string): Promise<UnsubscribeResult> {
    try {
      // Update preferences to unsubscribe
      const preferences = await this.updatePreferences(userEmail, {
        isSubscribed: false,
        unsubscribeReason: reason || 'user_request'
      });

      // Log the unsubscribe
      await this.logUnsubscribe(userEmail, reason || 'user_request', source || 'preference_center');

      return {
        success: true,
        message: 'Successfully unsubscribed from all emails',
        preferences
      };
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
      return {
        success: false,
        message: `Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        preferences: null
      };
    }
  }

  async resubscribe(userEmail: string): Promise<UnsubscribeResult> {
    try {
      // Update preferences to resubscribe
      const preferences = await this.updatePreferences(userEmail, {
        isSubscribed: true
      });

      return {
        success: true,
        message: 'Successfully resubscribed to emails',
        preferences
      };
    } catch (error) {
      console.error('Failed to resubscribe user:', error);
      return {
        success: false,
        message: `Failed to resubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        preferences: null
      };
    }
  }

  async bulkUpdatePreferences(updates: Array<{ userEmail: string; preferences: PreferenceUpdate }>): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        await this.updatePreferences(update.userEmail, update.preferences);
        success++;
      } catch (error) {
        failed++;
        errors.push(`${update.userEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success, failed, errors };
  }

  async getPreferencesList(filter: PreferenceFilter): Promise<{ preferences: EmailPreferences[]; total: number }> {
    try {
      let query = this.supabase
        .from('email_preferences')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter.isSubscribed !== undefined) {
        query = query.eq('is_subscribed', filter.isSubscribed);
      }

      if (filter.emailTypes && filter.emailTypes.length > 0) {
        query = query.contains('email_types', filter.emailTypes);
      }

      if (filter.frequency) {
        query = query.eq('frequency', filter.frequency);
      }

      if (filter.language) {
        query = query.eq('language', filter.language);
      }

      if (filter.createdAfter) {
        query = query.gte('created_at', filter.createdAfter.toISOString());
      }

      if (filter.createdBefore) {
        query = query.lte('created_at', filter.createdBefore.toISOString());
      }

      if (filter.lastEngagementAfter) {
        query = query.gte('last_engagement_at', filter.lastEngagementAfter.toISOString());
      }

      if (filter.lastEngagementBefore) {
        query = query.lte('last_engagement_at', filter.lastEngagementBefore.toISOString());
      }

      // Apply pagination
      const limit = filter.limit || 100;
      const offset = filter.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Apply ordering
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get preferences list: ${error.message}`);
      }

      const preferences = (data || []).map(this.mapDatabasePreferencesToEmailPreferences);

      return {
        preferences,
        total: count || 0
      };
    } catch (error) {
      console.error('Failed to get preferences list:', error);
      throw error;
    }
  }

  async getUnsubscribeStats(): Promise<{
    totalUnsubscribed: number;
    unsubscribesByReason: Array<{ reason: string; count: number }>;
    unsubscribesBySource: Array<{ source: string; count: number }>;
    recentUnsubscribes: Array<{ userEmail: string; reason: string; timestamp: Date }>;
  }> {
    try {
      // Get total unsubscribed count
      const { count: totalUnsubscribed } = await this.supabase
        .from('email_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('is_subscribed', false);

      // Get unsubscribes by reason
      const { data: reasonData } = await this.supabase
        .from('unsubscribe_log')
        .select('reason')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      const reasonCounts: Record<string, number> = {};
      (reasonData || []).forEach((row: any) => {
        reasonCounts[row.reason] = (reasonCounts[row.reason] || 0) + 1;
      });

      const unsubscribesByReason = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      // Get unsubscribes by source
      const { data: sourceData } = await this.supabase
        .from('unsubscribe_log')
        .select('source')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      const sourceCounts: Record<string, number> = {};
      (sourceData || []).forEach((row: any) => {
        sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1;
      });

      const unsubscribesBySource = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      // Get recent unsubscribes
      const { data: recentData } = await this.supabase
        .from('unsubscribe_log')
        .select('user_email, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const recentUnsubscribes = (recentData || []).map((row: any) => ({
        userEmail: row.user_email,
        reason: row.reason,
        timestamp: new Date(row.created_at)
      }));

      return {
        totalUnsubscribed: totalUnsubscribed || 0,
        unsubscribesByReason,
        unsubscribesBySource,
        recentUnsubscribes
      };
    } catch (error) {
      console.error('Failed to get unsubscribe stats:', error);
      throw error;
    }
  }

  async validateUnsubscribeToken(token: string): Promise<{ valid: boolean; userEmail?: string }> {
    try {
      // In a real implementation, you would decode/verify the token
      // For now, we'll assume the token contains the email in a simple format
      // In production, use JWT or similar secure token format
      
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userEmail, timestamp] = decoded.split('|');
      
      if (!userEmail || !timestamp) {
        return { valid: false };
      }

      // Check if token is not too old (e.g., 30 days)
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      if (currentTime - tokenTime > maxAge) {
        return { valid: false };
      }

      return { valid: true, userEmail };
    } catch (error) {
      console.error('Failed to validate unsubscribe token:', error);
      return { valid: false };
    }
  }

  async generateUnsubscribeToken(userEmail: string): Promise<string> {
    try {
      // In production, use a more secure token generation method
      const timestamp = Date.now().toString();
      const tokenData = `${userEmail}|${timestamp}`;
      return Buffer.from(tokenData).toString('base64');
    } catch (error) {
      console.error('Failed to generate unsubscribe token:', error);
      throw error;
    }
  }

  private async createDefaultPreferences(userEmail: string): Promise<EmailPreferences> {
    try {
      const defaultPreferences = {
        user_email: userEmail,
        is_subscribed: true,
        email_types: ['welcome', 'lesson_reminder', 'achievement'],
        frequency: 'immediate',
        language: 'en',
        timezone: 'UTC',
        marketing_emails: true,
        notification_emails: true,
        lesson_reminders: true,
        achievement_alerts: true,
        weekly_digest: true,
        bounce_count: 0,
        complaint_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('email_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create default preferences: ${error.message}`);
      }

      return this.mapDatabasePreferencesToEmailPreferences(data);
    } catch (error) {
      console.error('Failed to create default preferences:', error);
      throw error;
    }
  }

  private async logUnsubscribe(userEmail: string, reason: string, source: string): Promise<void> {
    try {
      await this.supabase
        .from('unsubscribe_log')
        .insert({
          user_email: userEmail,
          reason,
          source,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log unsubscribe:', error);
      // Don't throw error here as it's not critical
    }
  }

  private mapDatabasePreferencesToEmailPreferences(data: any): EmailPreferences {
    return {
      userEmail: data.user_email,
      isSubscribed: data.is_subscribed,
      emailTypes: data.email_types || [],
      frequency: data.frequency,
      language: data.language,
      timezone: data.timezone,
      marketingEmails: data.marketing_emails,
      notificationEmails: data.notification_emails,
      lessonReminders: data.lesson_reminders,
      achievementAlerts: data.achievement_alerts,
      weeklyDigest: data.weekly_digest,
      unsubscribedAt: data.unsubscribed_at ? new Date(data.unsubscribed_at) : undefined,
      unsubscribeReason: data.unsubscribe_reason,
      bounceCount: data.bounce_count || 0,
      complaintCount: data.complaint_count || 0,
      lastEngagementAt: data.last_engagement_at ? new Date(data.last_engagement_at) : undefined,
      lastEngagementType: data.last_engagement_type,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async cleanupOldPreferences(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Only delete preferences for users who have been unsubscribed for a long time
      const { data, error } = await this.supabase
        .from('email_preferences')
        .delete()
        .eq('is_subscribed', false)
        .lt('unsubscribed_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to cleanup old preferences: ${error.message}`);
      }

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} old email preferences`);
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old preferences:', error);
      throw error;
    }
  }

  async exportPreferences(filter?: PreferenceFilter): Promise<EmailPreferences[]> {
    try {
      const { preferences } = await this.getPreferencesList({
        ...filter,
        limit: 10000, // Large limit for export
        offset: 0
      });

      return preferences;
    } catch (error) {
      console.error('Failed to export preferences:', error);
      throw error;
    }
  }
}