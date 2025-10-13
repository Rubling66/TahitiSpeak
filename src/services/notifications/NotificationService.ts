import { SupabaseClient } from '@supabase/supabase-js';
import { PushNotificationHandler } from './PushNotificationHandler';
import { EmailNotificationHandler } from './EmailNotificationHandler';
import { InAppNotificationHandler } from './InAppNotificationHandler';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'push' | 'email' | 'in_app';
  subject?: string;
  title?: string;
  body: string;
  htmlBody?: string;
  variables?: string[];
  isActive: boolean;
}

export interface UserNotificationPreferences {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  lessonReminders: boolean;
  achievementNotifications: boolean;
  socialNotifications: boolean;
  marketingEmails: boolean;
  weeklyProgress: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
}

export interface NotificationHistory {
  id: string;
  userId: string;
  templateId?: string;
  type: 'push' | 'email' | 'in_app';
  title?: string;
  body: string;
  data?: Record<string, any>;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  externalId?: string;
  createdAt: Date;
}

export interface SendNotificationParams {
  userIds: string[];
  templateName: string;
  variables?: Record<string, any>;
  scheduledFor?: Date;
  priority?: 'low' | 'normal' | 'high';
}

export interface SendImmediateParams {
  userId: string;
  type: 'push' | 'email' | 'in_app';
  title?: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private supabase: SupabaseClient;
  private pushHandler: PushNotificationHandler;
  private emailHandler: EmailNotificationHandler;
  private inAppHandler: InAppNotificationHandler;

  constructor(
    supabase: SupabaseClient,
    pushHandler: PushNotificationHandler,
    emailHandler: EmailNotificationHandler,
    inAppHandler: InAppNotificationHandler
  ) {
    this.supabase = supabase;
    this.pushHandler = pushHandler;
    this.emailHandler = emailHandler;
    this.inAppHandler = inAppHandler;
  }

  /**
   * Send notification using template
   */
  async sendNotification(params: SendNotificationParams): Promise<void> {
    const { userIds, templateName, variables = {}, scheduledFor, priority = 'normal' } = params;

    try {
      // Get template
      const template = await this.getTemplate(templateName);
      if (!template || !template.isActive) {
        throw new Error(`Template '${templateName}' not found or inactive`);
      }

      // Get user preferences for all users
      const userPreferences = await this.getUserPreferences(userIds);

      // Filter users based on preferences and quiet hours
      const eligibleUsers = await this.filterEligibleUsers(userIds, template.type, userPreferences);

      if (eligibleUsers.length === 0) {
        console.log('No eligible users for notification');
        return;
      }

      // Render template with variables
      const renderedContent = this.renderTemplate(template, variables);

      // If scheduled, add to queue
      if (scheduledFor) {
        await this.scheduleNotification({
          userIds: eligibleUsers,
          templateName,
          scheduledFor,
          variables
        });
        return;
      }

      // Send immediately based on template type
      await this.sendByType(template.type, eligibleUsers, renderedContent, template.id, priority);

    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send immediate notification without template
   */
  async sendImmediate(params: SendImmediateParams): Promise<void> {
    const { userId, type, title, body, data = {} } = params;

    try {
      // Check user preferences
      const preferences = await this.getUserPreferences([userId]);
      const userPref = preferences[0];

      if (!this.isNotificationAllowed(type, userPref)) {
        console.log(`Notification type '${type}' not allowed for user ${userId}`);
        return;
      }

      // Create notification history record
      const historyRecord = await this.createNotificationHistory({
        userId,
        type,
        title,
        body,
        data,
        status: 'pending'
      });

      // Send based on type
      let externalId: string | undefined;
      
      switch (type) {
        case 'push':
          externalId = await this.pushHandler.sendToUser(userId, { title: title || '', body, data });
          break;
        case 'email':
          if (!title) throw new Error('Email notifications require a subject/title');
          externalId = await this.emailHandler.sendToUser(userId, { subject: title, body, data });
          break;
        case 'in_app':
          externalId = await this.inAppHandler.sendToUser(userId, { title, body, data });
          break;
      }

      // Update history with external ID and sent status
      await this.updateNotificationHistory(historyRecord.id, {
        status: 'sent',
        sentAt: new Date(),
        externalId
      });

    } catch (error) {
      console.error('Error sending immediate notification:', error);
      throw error;
    }
  }

  /**
   * Schedule notification for later delivery
   */
  async scheduleNotification(params: {
    userIds: string[];
    templateName: string;
    scheduledFor: Date;
    variables?: Record<string, any>;
  }): Promise<void> {
    // This would integrate with a job queue system like Bull
    // For now, we'll store in database and process with a cron job
    
    const { userIds, templateName, scheduledFor, variables = {} } = params;

    const { error } = await this.supabase
      .from('scheduled_notifications')
      .insert({
        user_ids: userIds,
        template_name: templateName,
        scheduled_for: scheduledFor.toISOString(),
        variables,
        status: 'pending'
      });

    if (error) {
      throw new Error(`Failed to schedule notification: ${error.message}`);
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('scheduled_notifications')
      .update({ status: 'cancelled' })
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to cancel notification: ${error.message}`);
    }
  }

  /**
   * Get notification template by name
   */
  private async getTemplate(name: string): Promise<NotificationTemplate | null> {
    const { data, error } = await this.supabase
      .from('notification_templates')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      subject: data.subject,
      title: data.title,
      body: data.body,
      htmlBody: data.html_body,
      variables: data.variables,
      isActive: data.is_active
    };
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userIds: string[]): Promise<UserNotificationPreferences[]> {
    const { data, error } = await this.supabase
      .from('user_notification_preferences')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('Error fetching user preferences:', error);
      return [];
    }

    return data.map(pref => ({
      id: pref.id,
      userId: pref.user_id,
      pushEnabled: pref.push_enabled,
      emailEnabled: pref.email_enabled,
      inAppEnabled: pref.in_app_enabled,
      lessonReminders: pref.lesson_reminders,
      achievementNotifications: pref.achievement_notifications,
      socialNotifications: pref.social_notifications,
      marketingEmails: pref.marketing_emails,
      weeklyProgress: pref.weekly_progress,
      quietHoursStart: pref.quiet_hours_start,
      quietHoursEnd: pref.quiet_hours_end,
      timezone: pref.timezone
    }));
  }

  /**
   * Filter users based on preferences and quiet hours
   */
  private async filterEligibleUsers(
    userIds: string[],
    notificationType: string,
    preferences: UserNotificationPreferences[]
  ): Promise<string[]> {
    const eligibleUsers: string[] = [];

    for (const userId of userIds) {
      const userPref = preferences.find(p => p.userId === userId);
      
      if (!userPref) {
        // If no preferences found, create default and allow
        await this.createDefaultPreferences(userId);
        eligibleUsers.push(userId);
        continue;
      }

      if (this.isNotificationAllowed(notificationType, userPref) && 
          !this.isInQuietHours(userPref)) {
        eligibleUsers.push(userId);
      }
    }

    return eligibleUsers;
  }

  /**
   * Check if notification type is allowed for user
   */
  private isNotificationAllowed(type: string, preferences: UserNotificationPreferences): boolean {
    switch (type) {
      case 'push':
        return preferences.pushEnabled;
      case 'email':
        return preferences.emailEnabled;
      case 'in_app':
        return preferences.inAppEnabled;
      default:
        return false;
    }
  }

  /**
   * Check if user is in quiet hours
   */
  private isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: preferences.timezone }));
    const currentTime = userTime.getHours() * 60 + userTime.getMinutes();

    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: NotificationTemplate, variables: Record<string, any>): {
    title?: string;
    body: string;
    subject?: string;
    htmlBody?: string;
  } {
    const renderText = (text: string) => {
      return text.replace(/\{(\w+)\}/g, (match, key) => {
        return variables[key] || match;
      });
    };

    return {
      title: template.title ? renderText(template.title) : undefined,
      body: renderText(template.body),
      subject: template.subject ? renderText(template.subject) : undefined,
      htmlBody: template.htmlBody ? renderText(template.htmlBody) : undefined
    };
  }

  /**
   * Send notification by type
   */
  private async sendByType(
    type: string,
    userIds: string[],
    content: { title?: string; body: string; subject?: string; htmlBody?: string },
    templateId: string,
    priority: string
  ): Promise<void> {
    const promises = userIds.map(async (userId) => {
      try {
        // Create history record
        const historyRecord = await this.createNotificationHistory({
          userId,
          templateId,
          type,
          title: content.title,
          body: content.body,
          status: 'pending'
        });

        let externalId: string | undefined;

        switch (type) {
          case 'push':
            externalId = await this.pushHandler.sendToUser(userId, {
              title: content.title || '',
              body: content.body,
              data: { priority }
            });
            break;
          case 'email':
            externalId = await this.emailHandler.sendToUser(userId, {
              subject: content.subject || content.title || '',
              body: content.body,
              htmlContent: content.htmlBody
            });
            break;
          case 'in_app':
            externalId = await this.inAppHandler.sendToUser(userId, {
              title: content.title,
              body: content.body,
              data: { priority }
            });
            break;
        }

        // Update history
        await this.updateNotificationHistory(historyRecord.id, {
          status: 'sent',
          sentAt: new Date(),
          externalId
        });

      } catch (error) {
        console.error(`Error sending ${type} notification to user ${userId}:`, error);
        
        // Update history with error
        await this.updateNotificationHistory(historyRecord.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Create notification history record
   */
  private async createNotificationHistory(data: {
    userId: string;
    templateId?: string;
    type: string;
    title?: string;
    body: string;
    data?: Record<string, any>;
    status: string;
  }): Promise<{ id: string }> {
    const { data: result, error } = await this.supabase
      .from('notification_history')
      .insert({
        user_id: data.userId,
        template_id: data.templateId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
        status: data.status
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create notification history: ${error.message}`);
    }

    return { id: result.id };
  }

  /**
   * Update notification history record
   */
  private async updateNotificationHistory(
    id: string,
    updates: {
      status?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      readAt?: Date;
      errorMessage?: string;
      externalId?: string;
    }
  ): Promise<void> {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.sentAt) updateData.sent_at = updates.sentAt.toISOString();
    if (updates.deliveredAt) updateData.delivered_at = updates.deliveredAt.toISOString();
    if (updates.readAt) updateData.read_at = updates.readAt.toISOString();
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;
    if (updates.externalId) updateData.external_id = updates.externalId;

    const { error } = await this.supabase
      .from('notification_history')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating notification history:', error);
    }
  }

  /**
   * Create default preferences for new user
   */
  private async createDefaultPreferences(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_notification_preferences')
      .insert({
        user_id: userId,
        push_enabled: true,
        email_enabled: true,
        in_app_enabled: true,
        lesson_reminders: true,
        achievement_notifications: true,
        social_notifications: true,
        marketing_emails: false,
        weekly_progress: true,
        timezone: 'UTC'
      });

    if (error) {
      console.error('Error creating default preferences:', error);
    }
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
    } = {}
  ): Promise<{ notifications: NotificationHistory[]; total: number }> {
    const { page = 1, limit = 20, type, status } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('notification_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get notification history: ${error.message}`);
    }

    const notifications = (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      templateId: item.template_id,
      type: item.type,
      title: item.title,
      body: item.body,
      data: item.data,
      status: item.status,
      sentAt: item.sent_at ? new Date(item.sent_at) : undefined,
      deliveredAt: item.delivered_at ? new Date(item.delivered_at) : undefined,
      readAt: item.read_at ? new Date(item.read_at) : undefined,
      errorMessage: item.error_message,
      externalId: item.external_id,
      createdAt: new Date(item.created_at)
    }));

    return {
      notifications,
      total: count || 0
    };
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('notification_history')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .in('id', notificationIds);

    if (error) {
      throw new Error(`Failed to mark notifications as read: ${error.message}`);
    }
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notification_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'read');

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }
}