import { SupabaseClient } from '@supabase/supabase-js';

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  deviceInfo?: {
    model?: string;
    os?: string;
    appVersion?: string;
  };
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionButtons?: Array<{
    id: string;
    title: string;
    action: string;
  }>;
}

export interface FCMMessage {
  token?: string;
  topic?: string;
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data?: Record<string, string>;
  webpush?: {
    headers?: Record<string, string>;
    data?: Record<string, string>;
    notification?: {
      title: string;
      body: string;
      icon?: string;
      image?: string;
      badge?: string;
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
      requireInteraction?: boolean;
      silent?: boolean;
      tag?: string;
      timestamp?: number;
    };
    fcm_options?: {
      link?: string;
    };
  };
  android?: {
    priority?: 'normal' | 'high';
    notification?: {
      title?: string;
      body?: string;
      icon?: string;
      color?: string;
      sound?: string;
      tag?: string;
      click_action?: string;
      body_loc_key?: string;
      body_loc_args?: string[];
      title_loc_key?: string;
      title_loc_args?: string[];
      channel_id?: string;
    };
    data?: Record<string, string>;
  };
  apns?: {
    headers?: Record<string, string>;
    payload?: {
      aps?: {
        alert?: {
          title?: string;
          body?: string;
          'title-loc-key'?: string;
          'title-loc-args'?: string[];
          'action-loc-key'?: string;
          'loc-key'?: string;
          'loc-args'?: string[];
          'launch-image'?: string;
        };
        badge?: number;
        sound?: string;
        'content-available'?: number;
        'mutable-content'?: number;
        category?: string;
        'thread-id'?: string;
      };
    };
  };
}

export class PushNotificationHandler {
  private supabase: SupabaseClient;
  private fcmServerKey: string;
  private fcmProjectId: string;

  constructor(supabase: SupabaseClient, fcmServerKey: string, fcmProjectId: string) {
    this.supabase = supabase;
    this.fcmServerKey = fcmServerKey;
    this.fcmProjectId = fcmProjectId;
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<string> {
    try {
      // Get user's active device tokens
      const deviceTokens = await this.getUserDeviceTokens(userId);
      
      if (deviceTokens.length === 0) {
        throw new Error(`No active device tokens found for user ${userId}`);
      }

      // Send to all user's devices
      const results = await Promise.allSettled(
        deviceTokens.map(device => this.sendToDevice(device.token, payload, device.platform))
      );

      // Check for failed tokens and mark them as inactive
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
          console.error(`Failed to send to device ${deviceTokens[i].token}:`, result.reason);
          await this.markTokenInactive(deviceTokens[i].token);
        }
      }

      // Return the first successful message ID
      const successfulResult = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<string>;
      return successfulResult?.value || 'no_successful_delivery';

    } catch (error) {
      console.error('Error sending push notification to user:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a specific device token
   */
  async sendToDevice(token: string, payload: PushNotificationPayload, platform: string = 'web'): Promise<string> {
    try {
      const message = this.buildFCMMessage(token, payload, platform);
      const messageId = await this.sendFCMMessage(message);
      
      // Update token last used
      await this.updateTokenLastUsed(token);
      
      return messageId;
    } catch (error) {
      console.error('Error sending to device:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a topic
   */
  async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<string> {
    try {
      const message = this.buildFCMMessage(undefined, payload, 'web', topic);
      return await this.sendFCMMessage(message);
    } catch (error) {
      console.error('Error sending to topic:', error);
      throw error;
    }
  }

  /**
   * Subscribe device token to a topic
   */
  async subscribeToTopic(token: string, topic: string): Promise<void> {
    try {
      const response = await fetch(`https://iid.googleapis.com/iid/v1/${token}/rel/topics/${topic}`, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.fcmServerKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to subscribe to topic: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe device token from a topic
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<void> {
    try {
      const response = await fetch(`https://iid.googleapis.com/iid/v1/${token}/rel/topics/${topic}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `key=${this.fcmServerKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to unsubscribe from topic: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  /**
   * Register a new device token
   */
  async registerDeviceToken(params: {
    userId: string;
    token: string;
    platform: 'web' | 'ios' | 'android';
    deviceInfo?: {
      model?: string;
      os?: string;
      appVersion?: string;
    };
  }): Promise<void> {
    try {
      const { userId, token, platform, deviceInfo } = params;

      // Check if token already exists
      const { data: existingToken } = await this.supabase
        .from('user_device_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('token', token)
        .single();

      if (existingToken) {
        // Update existing token
        await this.supabase
          .from('user_device_tokens')
          .update({
            is_active: true,
            last_used: new Date().toISOString(),
            device_info: deviceInfo
          })
          .eq('id', existingToken.id);
      } else {
        // Insert new token
        await this.supabase
          .from('user_device_tokens')
          .insert({
            user_id: userId,
            token,
            platform,
            device_info: deviceInfo,
            is_active: true,
            last_used: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterDeviceToken(token: string): Promise<void> {
    try {
      await this.supabase
        .from('user_device_tokens')
        .update({ is_active: false })
        .eq('token', token);
    } catch (error) {
      console.error('Error unregistering device token:', error);
      throw error;
    }
  }

  /**
   * Get user's active device tokens
   */
  private async getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
    const { data, error } = await this.supabase
      .from('user_device_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching device tokens:', error);
      return [];
    }

    return (data || []).map(token => ({
      id: token.id,
      userId: token.user_id,
      token: token.token,
      platform: token.platform,
      deviceInfo: token.device_info,
      isActive: token.is_active,
      lastUsed: new Date(token.last_used),
      createdAt: new Date(token.created_at)
    }));
  }

  /**
   * Build FCM message object
   */
  private buildFCMMessage(
    token?: string,
    payload?: PushNotificationPayload,
    platform: string = 'web',
    topic?: string
  ): FCMMessage {
    if (!payload) {
      throw new Error('Payload is required');
    }

    const message: FCMMessage = {
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.imageUrl
      },
      data: payload.data ? this.convertDataToStrings(payload.data) : undefined
    };

    if (token) {
      message.token = token;
    } else if (topic) {
      message.topic = topic;
    } else {
      throw new Error('Either token or topic must be provided');
    }

    // Platform-specific configurations
    switch (platform) {
      case 'web':
        message.webpush = {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icons/icon-192x192.png',
            image: payload.imageUrl,
            badge: '/icons/badge-72x72.png',
            requireInteraction: true,
            actions: payload.actionButtons?.map(button => ({
              action: button.action,
              title: button.title,
              icon: '/icons/action-icon.png'
            })),
            tag: 'tahiti-speak-notification',
            timestamp: Date.now()
          },
          fcm_options: {
            link: payload.data?.url || '/'
          }
        };
        break;

      case 'android':
        message.android = {
          priority: 'high',
          notification: {
            title: payload.title,
            body: payload.body,
            icon: 'ic_notification',
            color: '#4F46E5',
            sound: 'default',
            channel_id: 'tahiti_speak_notifications',
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          data: payload.data ? this.convertDataToStrings(payload.data) : undefined
        };
        break;

      case 'ios':
        message.apns = {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body
              },
              badge: 1,
              sound: 'default',
              'content-available': 1,
              'mutable-content': 1
            }
          }
        };
        break;
    }

    return message;
  }

  /**
   * Send FCM message
   */
  private async sendFCMMessage(message: FCMMessage): Promise<string> {
    try {
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${this.fcmProjectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`FCM API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      return result.name; // FCM message ID
    } catch (error) {
      console.error('Error sending FCM message:', error);
      throw error;
    }
  }

  /**
   * Get OAuth2 access token for FCM
   */
  private async getAccessToken(): Promise<string> {
    // In a real implementation, you would use Google's OAuth2 library
    // For now, we'll use the server key (legacy method)
    // Note: This should be replaced with proper OAuth2 implementation
    return this.fcmServerKey;
  }

  /**
   * Convert data object to strings (FCM requirement)
   */
  private convertDataToStrings(data: Record<string, any>): Record<string, string> {
    const stringData: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return stringData;
  }

  /**
   * Mark device token as inactive
   */
  private async markTokenInactive(token: string): Promise<void> {
    try {
      await this.supabase
        .from('user_device_tokens')
        .update({ is_active: false })
        .eq('token', token);
    } catch (error) {
      console.error('Error marking token inactive:', error);
    }
  }

  /**
   * Update token last used timestamp
   */
  private async updateTokenLastUsed(token: string): Promise<void> {
    try {
      await this.supabase
        .from('user_device_tokens')
        .update({ last_used: new Date().toISOString() })
        .eq('token', token);
    } catch (error) {
      console.error('Error updating token last used:', error);
    }
  }

  /**
   * Clean up inactive tokens (should be run periodically)
   */
  async cleanupInactiveTokens(daysInactive: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      await this.supabase
        .from('user_device_tokens')
        .delete()
        .eq('is_active', false)
        .lt('last_used', cutoffDate.toISOString());
    } catch (error) {
      console.error('Error cleaning up inactive tokens:', error);
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId?: string): Promise<{
    totalTokens: number;
    activeTokens: number;
    platformBreakdown: Record<string, number>;
  }> {
    try {
      let query = this.supabase
        .from('user_device_tokens')
        .select('platform, is_active');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const stats = {
        totalTokens: data?.length || 0,
        activeTokens: data?.filter(t => t.is_active).length || 0,
        platformBreakdown: {} as Record<string, number>
      };

      // Calculate platform breakdown
      data?.forEach(token => {
        stats.platformBreakdown[token.platform] = (stats.platformBreakdown[token.platform] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalTokens: 0,
        activeTokens: 0,
        platformBreakdown: {}
      };
    }
  }
}