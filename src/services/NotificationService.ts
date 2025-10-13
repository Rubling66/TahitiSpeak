import { createClient } from '@supabase/supabase-js';

// Notification interfaces
export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'push' | 'email' | 'in_app';
  subject?: string;
  title?: string;
  body: string;
  html_body?: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  lesson_reminders: boolean;
  achievement_notifications: boolean;
  social_notifications: boolean;
  marketing_emails: boolean;
  weekly_progress: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  user_id: string;
  template_id?: string;
  type: 'push' | 'email' | 'in_app';
  title?: string;
  body?: string;
  data: Record<string, any>;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  external_id?: string;
  created_at: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  device_info: Record<string, any>;
  is_active: boolean;
  last_used: string;
  created_at: string;
}

export interface SendNotificationRequest {
  userIds: string[];
  templateName: string;
  variables?: Record<string, any>;
  scheduledFor?: string;
  priority?: 'low' | 'normal' | 'high';
  data?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    push: number;
    email: number;
    in_app: number;
  };
  byStatus: {
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    read: number;
  };
  recentActivity: NotificationHistory[];
}

// Notification Service Class
export class NotificationService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Template Management
  async getTemplates(type?: string): Promise<NotificationTemplate[]> {
    let query = this.supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getTemplate(name: string): Promise<NotificationTemplate | null> {
    const { data, error } = await this.supabase
      .from('notification_templates')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationTemplate> {
    const { data, error } = await this.supabase
      .from('notification_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const { data, error } = await this.supabase
      .from('notification_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notification_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await this.supabase
      .rpc('get_user_notification_preferences', { p_user_id: userId });

    if (error) throw error;
    return data[0] || this.getDefaultPreferences(userId);
  }

  async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const { data, error } = await this.supabase
      .from('user_notification_preferences')
      .upsert({ user_id: userId, ...preferences })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      id: '',
      user_id: userId,
      push_enabled: true,
      email_enabled: true,
      in_app_enabled: true,
      lesson_reminders: true,
      achievement_notifications: true,
      social_notifications: true,
      marketing_emails: false,
      weekly_progress: true,
      timezone: 'UTC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Device Token Management
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'web' | 'ios' | 'android',
    deviceInfo?: Record<string, any>
  ): Promise<DeviceToken> {
    const { data, error } = await this.supabase
      .from('user_device_tokens')
      .upsert({
        user_id: userId,
        token,
        platform,
        device_info: deviceInfo || {},
        is_active: true,
        last_used: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDeviceTokens(userId: string): Promise<DeviceToken[]> {
    const { data, error } = await this.supabase
      .from('user_device_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_used', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async removeDeviceToken(userId: string, token: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_device_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw error;
  }

  // Notification History
  async getNotificationHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: 'push' | 'email' | 'in_app';
      status?: string;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: NotificationHistory[]; total: number }> {
    const { page = 1, limit = 20, type, status, unreadOnly } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('notification_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (unreadOnly) query = query.neq('status', 'read');

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      notifications: data || [],
      total: count || 0
    };
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .rpc('track_notification_event', {
        p_notification_id: notificationId,
        p_event_type: 'read'
      });

    if (error) throw error;
  }

  async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    const promises = notificationIds.map(id => this.markNotificationAsRead(id));
    await Promise.all(promises);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_unread_notification_count', { p_user_id: userId });

    if (error) throw error;
    return data || 0;
  }

  // Send Notifications
  async sendNotification(request: SendNotificationRequest): Promise<string[]> {
    const template = await this.getTemplate(request.templateName);
    if (!template) {
      throw new Error(`Template '${request.templateName}' not found`);
    }

    const notificationIds: string[] = [];

    for (const userId of request.userIds) {
      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Check if user is in quiet hours
      const { data: inQuietHours } = await this.supabase
        .rpc('is_user_in_quiet_hours', { p_user_id: userId });

      if (inQuietHours && request.priority !== 'high') {
        continue; // Skip sending during quiet hours unless high priority
      }

      // Process template variables
      const processedTitle = this.processTemplate(template.title || '', request.variables || {});
      const processedBody = this.processTemplate(template.body, request.variables || {});

      // Create notification history entry
      const { data: notification, error } = await this.supabase
        .from('notification_history')
        .insert({
          user_id: userId,
          template_id: template.id,
          type: template.type,
          title: processedTitle,
          body: processedBody,
          data: request.data || {},
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      notificationIds.push(notification.id);

      // Send based on type and preferences
      try {
        switch (template.type) {
          case 'push':
            if (preferences.push_enabled) {
              await this.sendPushNotification(userId, processedTitle, processedBody, request.data);
              await this.trackNotificationEvent(notification.id, 'sent');
            }
            break;
          case 'email':
            if (preferences.email_enabled) {
              await this.sendEmailNotification(
                userId, 
                template.subject || processedTitle, 
                processedBody,
                template.html_body
              );
              await this.trackNotificationEvent(notification.id, 'sent');
            }
            break;
          case 'in_app':
            if (preferences.in_app_enabled) {
              await this.sendInAppNotification(userId, processedTitle, processedBody, request.data);
              await this.trackNotificationEvent(notification.id, 'sent');
            }
            break;
        }
      } catch (error) {
        await this.trackNotificationEvent(notification.id, 'failed', undefined, error.message);
      }
    }

    return notificationIds;
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      processed = processed.replace(regex, String(value));
    }
    return processed;
  }

  private async sendPushNotification(
    userId: string, 
    title: string, 
    body: string, 
    data?: Record<string, any>
  ): Promise<void> {
    // Get user's device tokens
    const tokens = await this.getDeviceTokens(userId);
    
    if (tokens.length === 0) {
      throw new Error('No device tokens found for user');
    }

    // This would integrate with FCM service
    // For now, we'll simulate the push notification
    console.log(`Sending push notification to ${tokens.length} devices:`, {
      title,
      body,
      data
    });

    // In a real implementation, you would:
    // 1. Use Firebase Admin SDK to send to FCM
    // 2. Handle token validation and cleanup
    // 3. Track delivery status
  }

  private async sendEmailNotification(
    userId: string,
    subject: string,
    body: string,
    htmlBody?: string
  ): Promise<void> {
    // Get user email from auth.users
    const { data: user, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error || !user.user?.email) {
      throw new Error('User email not found');
    }

    // This would integrate with SendGrid or similar email service
    console.log(`Sending email to ${user.user.email}:`, {
      subject,
      body,
      htmlBody
    });

    // In a real implementation, you would:
    // 1. Use SendGrid API to send email
    // 2. Handle email templates
    // 3. Track delivery status
  }

  private async sendInAppNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    // This would send via WebSocket to connected clients
    console.log(`Sending in-app notification to user ${userId}:`, {
      title,
      body,
      data
    });

    // In a real implementation, you would:
    // 1. Send via WebSocket to connected clients
    // 2. Store in real-time database for immediate delivery
    // 3. Handle offline users
  }

  private async trackNotificationEvent(
    notificationId: string,
    eventType: 'sent' | 'delivered' | 'failed' | 'read',
    externalId?: string,
    errorMessage?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .rpc('track_notification_event', {
        p_notification_id: notificationId,
        p_event_type: eventType,
        p_external_id: externalId,
        p_error_message: errorMessage
      });

    if (error) throw error;
  }

  // Analytics and Stats
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const { data: history, error } = await this.supabase
      .from('notification_history')
      .select('type, status, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const notifications = history || [];
    const total = notifications.length;
    const unread = notifications.filter(n => n.status !== 'read').length;
    const read = total - unread;

    const byType = {
      push: notifications.filter(n => n.type === 'push').length,
      email: notifications.filter(n => n.type === 'email').length,
      in_app: notifications.filter(n => n.type === 'in_app').length
    };

    const byStatus = {
      pending: notifications.filter(n => n.status === 'pending').length,
      sent: notifications.filter(n => n.status === 'sent').length,
      delivered: notifications.filter(n => n.status === 'delivered').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      read: notifications.filter(n => n.status === 'read').length
    };

    // Get recent activity
    const { data: recentActivity } = await this.supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      total,
      unread,
      read,
      byType,
      byStatus,
      recentActivity: recentActivity || []
    };
  }

  // Bulk Operations
  async bulkMarkAsRead(userId: string, notificationIds?: string[]): Promise<void> {
    let query = this.supabase
      .from('notification_history')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .neq('status', 'read');

    if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async bulkDelete(userId: string, notificationIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('notification_history')
      .delete()
      .eq('user_id', userId)
      .in('id', notificationIds);

    if (error) throw error;
  }

  // Cleanup old notifications
  async cleanupOldNotifications(daysOld: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await this.supabase
      .from('notification_history')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
  }
}

// Singleton instance
export const notificationService = new NotificationService();