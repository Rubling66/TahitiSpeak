import { createClient } from '@supabase/supabase-js';
import {
  EmailEventTracker as IEmailEventTracker,
  EmailEvent,
  WebhookEvent,
  EventFilter,
  EventStats
} from '../../types/email';

export class EmailEventTracker implements IEmailEventTracker {
  private supabase: any;
  private analytics: any;

  constructor(supabaseUrl: string, supabaseKey: string, analytics?: any) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.analytics = analytics;
  }

  async trackEvent(event: EmailEvent): Promise<void> {
    try {
      // Validate event data
      if (!this.validateEvent(event)) {
        console.error('Invalid event data:', event);
        return;
      }

      // Insert event into database
      const { error } = await this.supabase
        .from('email_events')
        .insert({
          email_id: event.emailId,
          event_type: event.eventType,
          timestamp: event.timestamp.toISOString(),
          recipient_email: event.recipientEmail,
          user_agent: event.userAgent,
          ip_address: event.ipAddress,
          location: event.location,
          device_type: event.deviceType,
          provider_event_id: event.providerEventId,
          provider_name: event.providerName,
          metadata: event.metadata
        });

      if (error) {
        console.error('Failed to track email event:', error);
        return;
      }

      // Forward to analytics if available
      if (this.analytics) {
        await this.analytics.trackEvent(event);
      }

      // Handle specific event types
      await this.handleSpecificEvent(event);

      console.log(`Successfully tracked ${event.eventType} event for email ${event.emailId}`);
    } catch (error) {
      console.error('Failed to track email event:', error);
    }
  }

  private validateEvent(event: EmailEvent): boolean {
    if (!event.emailId || !event.eventType || !event.timestamp || !event.recipientEmail) {
      return false;
    }

    const validEventTypes = [
      'sent', 'delivered', 'opened', 'clicked', 'bounced', 
      'failed', 'complained', 'unsubscribed', 'deferred'
    ];

    return validEventTypes.includes(event.eventType);
  }

  private async handleSpecificEvent(event: EmailEvent): Promise<void> {
    try {
      switch (event.eventType) {
        case 'bounced':
          await this.handleBounceEvent(event);
          break;
        case 'complained':
          await this.handleComplaintEvent(event);
          break;
        case 'unsubscribed':
          await this.handleUnsubscribeEvent(event);
          break;
        case 'clicked':
          await this.handleClickEvent(event);
          break;
        case 'opened':
          await this.handleOpenEvent(event);
          break;
      }
    } catch (error) {
      console.error(`Failed to handle ${event.eventType} event:`, error);
    }
  }

  private async handleBounceEvent(event: EmailEvent): Promise<void> {
    // Update user preferences to mark as bounced
    const bounceType = event.metadata?.bounce_type || 'unknown';
    
    if (bounceType === 'permanent') {
      // Mark email as permanently bounced
      await this.supabase
        .from('email_preferences')
        .update({
          is_bounced: true,
          bounce_count: this.supabase.raw('bounce_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('user_email', event.recipientEmail);
    } else {
      // Increment bounce count for temporary bounces
      await this.supabase
        .from('email_preferences')
        .update({
          bounce_count: this.supabase.raw('bounce_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('user_email', event.recipientEmail);
    }
  }

  private async handleComplaintEvent(event: EmailEvent): Promise<void> {
    // Mark user as complained and unsubscribe them
    await this.supabase
      .from('email_preferences')
      .update({
        is_subscribed: false,
        complaint_count: this.supabase.raw('complaint_count + 1'),
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: 'complaint',
        updated_at: new Date().toISOString()
      })
      .eq('user_email', event.recipientEmail);

    // Log the unsubscribe
    await this.supabase
      .from('unsubscribe_log')
      .insert({
        user_email: event.recipientEmail,
        reason: 'complaint',
        source: 'email_complaint',
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        created_at: new Date().toISOString()
      });
  }

  private async handleUnsubscribeEvent(event: EmailEvent): Promise<void> {
    // Update user preferences
    await this.supabase
      .from('email_preferences')
      .update({
        is_subscribed: false,
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: 'user_request',
        updated_at: new Date().toISOString()
      })
      .eq('user_email', event.recipientEmail);

    // Log the unsubscribe
    await this.supabase
      .from('unsubscribe_log')
      .insert({
        user_email: event.recipientEmail,
        reason: 'user_request',
        source: 'email_unsubscribe',
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        created_at: new Date().toISOString()
      });
  }

  private async handleClickEvent(event: EmailEvent): Promise<void> {
    // Extract click URL from metadata
    const clickUrl = event.metadata?.url || event.metadata?.click_url;
    
    if (clickUrl) {
      // You could track specific URL clicks here
      console.log(`User ${event.recipientEmail} clicked: ${clickUrl}`);
    }

    // Update last engagement time
    await this.updateLastEngagement(event.recipientEmail, 'clicked');
  }

  private async handleOpenEvent(event: EmailEvent): Promise<void> {
    // Update last engagement time
    await this.updateLastEngagement(event.recipientEmail, 'opened');
  }

  private async updateLastEngagement(email: string, eventType: string): Promise<void> {
    try {
      await this.supabase
        .from('email_preferences')
        .update({
          last_engagement_at: new Date().toISOString(),
          last_engagement_type: eventType,
          updated_at: new Date().toISOString()
        })
        .eq('user_email', email);
    } catch (error) {
      console.error('Failed to update last engagement:', error);
    }
  }

  async getEvents(filter: EventFilter): Promise<EmailEvent[]> {
    try {
      let query = this.supabase
        .from('email_events')
        .select('*');

      // Apply filters
      if (filter.emailId) {
        query = query.eq('email_id', filter.emailId);
      }
      if (filter.recipientEmail) {
        query = query.eq('recipient_email', filter.recipientEmail);
      }
      if (filter.eventType) {
        query = query.eq('event_type', filter.eventType);
      }
      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate.toISOString());
      }
      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate.toISOString());
      }
      if (filter.providerName) {
        query = query.eq('provider_name', filter.providerName);
      }

      // Apply pagination
      const limit = filter.limit || 100;
      const offset = filter.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Apply ordering
      query = query.order('timestamp', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get events: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseEventToEmailEvent);
    } catch (error) {
      console.error('Failed to get events:', error);
      throw error;
    }
  }

  async getEventStats(filter: EventFilter): Promise<EventStats> {
    try {
      let query = this.supabase
        .from('email_events')
        .select('event_type');

      // Apply filters (same as getEvents)
      if (filter.emailId) {
        query = query.eq('email_id', filter.emailId);
      }
      if (filter.recipientEmail) {
        query = query.eq('recipient_email', filter.recipientEmail);
      }
      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate.toISOString());
      }
      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate.toISOString());
      }
      if (filter.providerName) {
        query = query.eq('provider_name', filter.providerName);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get event stats: ${error.message}`);
      }

      // Count events by type
      const eventCounts = (data || []).reduce((acc: any, row: any) => {
        acc[row.event_type] = (acc[row.event_type] || 0) + 1;
        return acc;
      }, {});

      return {
        totalEvents: data?.length || 0,
        sent: eventCounts.sent || 0,
        delivered: eventCounts.delivered || 0,
        opened: eventCounts.opened || 0,
        clicked: eventCounts.clicked || 0,
        bounced: eventCounts.bounced || 0,
        failed: eventCounts.failed || 0,
        complained: eventCounts.complained || 0,
        unsubscribed: eventCounts.unsubscribed || 0,
        deferred: eventCounts.deferred || 0
      };
    } catch (error) {
      console.error('Failed to get event stats:', error);
      throw error;
    }
  }

  async handleWebhook(webhookEvent: WebhookEvent): Promise<void> {
    try {
      console.log(`Processing webhook from ${webhookEvent.provider}:`, webhookEvent.eventType);

      // Parse webhook based on provider
      const emailEvents = await this.parseWebhookEvent(webhookEvent);

      // Track each event
      for (const event of emailEvents) {
        await this.trackEvent(event);
      }

      console.log(`Successfully processed ${emailEvents.length} events from webhook`);
    } catch (error) {
      console.error('Failed to handle webhook:', error);
      throw error;
    }
  }

  private async parseWebhookEvent(webhookEvent: WebhookEvent): Promise<EmailEvent[]> {
    const events: EmailEvent[] = [];

    try {
      switch (webhookEvent.provider) {
        case 'sendgrid':
          events.push(...this.parseSendGridWebhook(webhookEvent));
          break;
        case 'resend':
          events.push(...this.parseResendWebhook(webhookEvent));
          break;
        default:
          console.warn(`Unknown webhook provider: ${webhookEvent.provider}`);
      }
    } catch (error) {
      console.error(`Failed to parse ${webhookEvent.provider} webhook:`, error);
    }

    return events;
  }

  private parseSendGridWebhook(webhookEvent: WebhookEvent): EmailEvent[] {
    const events: EmailEvent[] = [];

    try {
      // SendGrid sends an array of events
      const webhookEvents = Array.isArray(webhookEvent.data) ? webhookEvent.data : [webhookEvent.data];

      for (const sgEvent of webhookEvents) {
        // Map SendGrid event to our EmailEvent format
        const event: EmailEvent = {
          emailId: sgEvent.sg_message_id || sgEvent['smtp-id'] || '',
          eventType: this.mapSendGridEventType(sgEvent.event),
          timestamp: new Date(sgEvent.timestamp * 1000), // SendGrid uses Unix timestamp
          recipientEmail: sgEvent.email,
          userAgent: sgEvent.useragent,
          ipAddress: sgEvent.ip,
          location: sgEvent.geo ? {
            country: sgEvent.geo.country,
            region: sgEvent.geo.region,
            city: sgEvent.geo.city
          } : undefined,
          deviceType: this.detectDeviceType(sgEvent.useragent),
          providerEventId: sgEvent.sg_event_id,
          providerName: 'sendgrid',
          metadata: {
            reason: sgEvent.reason,
            bounce_type: sgEvent.type,
            url: sgEvent.url,
            category: sgEvent.category,
            asm_group_id: sgEvent.asm_group_id,
            newsletter: sgEvent.newsletter,
            ...sgEvent
          }
        };

        events.push(event);
      }
    } catch (error) {
      console.error('Failed to parse SendGrid webhook:', error);
    }

    return events;
  }

  private parseResendWebhook(webhookEvent: WebhookEvent): EmailEvent[] {
    const events: EmailEvent[] = [];

    try {
      const resendEvent = webhookEvent.data;

      const event: EmailEvent = {
        emailId: resendEvent.email_id || '',
        eventType: this.mapResendEventType(webhookEvent.eventType),
        timestamp: new Date(resendEvent.created_at),
        recipientEmail: resendEvent.to?.[0] || resendEvent.email,
        userAgent: resendEvent.user_agent,
        ipAddress: resendEvent.ip_address,
        location: resendEvent.location,
        deviceType: this.detectDeviceType(resendEvent.user_agent),
        providerEventId: resendEvent.id,
        providerName: 'resend',
        metadata: {
          ...resendEvent
        }
      };

      events.push(event);
    } catch (error) {
      console.error('Failed to parse Resend webhook:', error);
    }

    return events;
  }

  private mapSendGridEventType(sgEventType: string): string {
    const eventMap: Record<string, string> = {
      'processed': 'sent',
      'delivered': 'delivered',
      'open': 'opened',
      'click': 'clicked',
      'bounce': 'bounced',
      'dropped': 'failed',
      'spamreport': 'complained',
      'unsubscribe': 'unsubscribed',
      'group_unsubscribe': 'unsubscribed',
      'deferred': 'deferred'
    };

    return eventMap[sgEventType] || sgEventType;
  }

  private mapResendEventType(resendEventType: string): string {
    const eventMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.delivery_delayed': 'deferred'
    };

    return eventMap[resendEventType] || resendEventType;
  }

  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';

    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  private mapDatabaseEventToEmailEvent(dbEvent: any): EmailEvent {
    return {
      emailId: dbEvent.email_id,
      eventType: dbEvent.event_type,
      timestamp: new Date(dbEvent.timestamp),
      recipientEmail: dbEvent.recipient_email,
      userAgent: dbEvent.user_agent,
      ipAddress: dbEvent.ip_address,
      location: dbEvent.location,
      deviceType: dbEvent.device_type,
      providerEventId: dbEvent.provider_event_id,
      providerName: dbEvent.provider_name,
      metadata: dbEvent.metadata
    };
  }

  async deleteOldEvents(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await this.supabase
        .from('email_events')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to delete old events: ${error.message}`);
      }

      const deletedCount = data?.length || 0;
      console.log(`Deleted ${deletedCount} events older than ${olderThanDays} days`);
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to delete old events:', error);
      throw error;
    }
  }

  async getEventTimeline(emailId: string): Promise<EmailEvent[]> {
    try {
      const { data, error } = await this.supabase
        .from('email_events')
        .select('*')
        .eq('email_id', emailId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Failed to get event timeline: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseEventToEmailEvent);
    } catch (error) {
      console.error('Failed to get event timeline:', error);
      throw error;
    }
  }
}