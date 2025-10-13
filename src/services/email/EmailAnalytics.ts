import { createClient } from '@supabase/supabase-js';
import {
  EmailAnalytics as IEmailAnalytics,
  EmailEvent,
  EmailAnalyticsData,
  EmailMetrics,
  TemplatePerformance,
  CampaignAnalytics,
  DeliveryMetrics,
  EngagementMetrics,
  AnalyticsFilter,
  AnalyticsTimeRange
} from '../../types/email';

export class EmailAnalytics implements IEmailAnalytics {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async trackEvent(event: EmailEvent): Promise<void> {
    try {
      // Insert event into email_events table
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

      // Update email log status if it's a delivery event
      if (['delivered', 'bounced', 'failed'].includes(event.eventType)) {
        await this.updateEmailLogStatus(event.emailId, event.eventType, event.timestamp);
      }

      // Update analytics summary
      await this.updateAnalyticsSummary(event);

      console.log(`Tracked email event: ${event.eventType} for email ${event.emailId}`);
    } catch (error) {
      console.error('Failed to track email event:', error);
    }
  }

  private async updateEmailLogStatus(emailId: string, status: string, timestamp: Date): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: timestamp.toISOString()
      };

      if (status === 'delivered') {
        updateData.delivered_at = timestamp.toISOString();
      } else if (status === 'bounced' || status === 'failed') {
        updateData.failed_at = timestamp.toISOString();
      }

      await this.supabase
        .from('email_logs')
        .update(updateData)
        .eq('id', emailId);
    } catch (error) {
      console.error('Failed to update email log status:', error);
    }
  }

  private async updateAnalyticsSummary(event: EmailEvent): Promise<void> {
    try {
      const date = event.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get existing summary for the date
      const { data: existing } = await this.supabase
        .from('email_analytics_summary')
        .select('*')
        .eq('date', date)
        .eq('template_id', event.templateId || 'unknown')
        .single();

      const updateData: any = {
        date,
        template_id: event.templateId || 'unknown',
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing summary
        switch (event.eventType) {
          case 'sent':
            updateData.total_sent = (existing.total_sent || 0) + 1;
            break;
          case 'delivered':
            updateData.total_delivered = (existing.total_delivered || 0) + 1;
            break;
          case 'opened':
            updateData.total_opened = (existing.total_opened || 0) + 1;
            if (!existing.unique_opens?.includes(event.recipientEmail)) {
              updateData.unique_opens = [...(existing.unique_opens || []), event.recipientEmail];
            }
            break;
          case 'clicked':
            updateData.total_clicked = (existing.total_clicked || 0) + 1;
            if (!existing.unique_clicks?.includes(event.recipientEmail)) {
              updateData.unique_clicks = [...(existing.unique_clicks || []), event.recipientEmail];
            }
            break;
          case 'bounced':
            updateData.total_bounced = (existing.total_bounced || 0) + 1;
            break;
          case 'complained':
            updateData.total_complained = (existing.total_complained || 0) + 1;
            break;
          case 'unsubscribed':
            updateData.total_unsubscribed = (existing.total_unsubscribed || 0) + 1;
            break;
        }

        await this.supabase
          .from('email_analytics_summary')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        // Create new summary
        const newSummary = {
          date,
          template_id: event.templateId || 'unknown',
          total_sent: event.eventType === 'sent' ? 1 : 0,
          total_delivered: event.eventType === 'delivered' ? 1 : 0,
          total_opened: event.eventType === 'opened' ? 1 : 0,
          total_clicked: event.eventType === 'clicked' ? 1 : 0,
          total_bounced: event.eventType === 'bounced' ? 1 : 0,
          total_complained: event.eventType === 'complained' ? 1 : 0,
          total_unsubscribed: event.eventType === 'unsubscribed' ? 1 : 0,
          unique_opens: event.eventType === 'opened' ? [event.recipientEmail] : [],
          unique_clicks: event.eventType === 'clicked' ? [event.recipientEmail] : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await this.supabase
          .from('email_analytics_summary')
          .insert(newSummary);
      }
    } catch (error) {
      console.error('Failed to update analytics summary:', error);
    }
  }

  async getEmailMetrics(filter: AnalyticsFilter): Promise<EmailMetrics> {
    try {
      const { startDate, endDate, templateId, userId } = filter;
      
      let query = this.supabase
        .from('email_analytics_summary')
        .select('*');

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }
      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get email metrics: ${error.message}`);
      }

      // Aggregate the data
      const metrics = data.reduce((acc: any, row: any) => {
        acc.totalSent += row.total_sent || 0;
        acc.totalDelivered += row.total_delivered || 0;
        acc.totalOpened += row.total_opened || 0;
        acc.totalClicked += row.total_clicked || 0;
        acc.totalBounced += row.total_bounced || 0;
        acc.totalComplained += row.total_complained || 0;
        acc.totalUnsubscribed += row.total_unsubscribed || 0;
        
        // Merge unique arrays
        acc.uniqueOpens = [...new Set([...acc.uniqueOpens, ...(row.unique_opens || [])])];
        acc.uniqueClicks = [...new Set([...acc.uniqueClicks, ...(row.unique_clicks || [])])];
        
        return acc;
      }, {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        totalComplained: 0,
        totalUnsubscribed: 0,
        uniqueOpens: [],
        uniqueClicks: []
      });

      // Calculate rates
      const deliveryRate = metrics.totalSent > 0 ? (metrics.totalDelivered / metrics.totalSent) * 100 : 0;
      const openRate = metrics.totalDelivered > 0 ? (metrics.uniqueOpens.length / metrics.totalDelivered) * 100 : 0;
      const clickRate = metrics.totalDelivered > 0 ? (metrics.uniqueClicks.length / metrics.totalDelivered) * 100 : 0;
      const bounceRate = metrics.totalSent > 0 ? (metrics.totalBounced / metrics.totalSent) * 100 : 0;
      const complaintRate = metrics.totalDelivered > 0 ? (metrics.totalComplained / metrics.totalDelivered) * 100 : 0;
      const unsubscribeRate = metrics.totalDelivered > 0 ? (metrics.totalUnsubscribed / metrics.totalDelivered) * 100 : 0;

      return {
        totalSent: metrics.totalSent,
        totalDelivered: metrics.totalDelivered,
        totalOpened: metrics.totalOpened,
        totalClicked: metrics.totalClicked,
        totalBounced: metrics.totalBounced,
        totalComplained: metrics.totalComplained,
        totalUnsubscribed: metrics.totalUnsubscribed,
        uniqueOpens: metrics.uniqueOpens.length,
        uniqueClicks: metrics.uniqueClicks.length,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        complaintRate: Math.round(complaintRate * 100) / 100,
        unsubscribeRate: Math.round(unsubscribeRate * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get email metrics:', error);
      throw error;
    }
  }

  async getTemplatePerformance(templateId: string, timeRange: AnalyticsTimeRange): Promise<TemplatePerformance> {
    try {
      const { startDate, endDate } = this.getTimeRangeDates(timeRange);
      
      const { data, error } = await this.supabase
        .from('email_analytics_summary')
        .select('*')
        .eq('template_id', templateId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        throw new Error(`Failed to get template performance: ${error.message}`);
      }

      // Get template info
      const { data: templateData } = await this.supabase
        .from('email_templates')
        .select('name, subject')
        .eq('id', templateId)
        .single();

      const metrics = await this.getEmailMetrics({ 
        startDate, 
        endDate, 
        templateId 
      });

      const dailyMetrics = data.map((row: any) => ({
        date: new Date(row.date),
        sent: row.total_sent || 0,
        delivered: row.total_delivered || 0,
        opened: row.total_opened || 0,
        clicked: row.total_clicked || 0,
        bounced: row.total_bounced || 0
      }));

      return {
        templateId,
        templateName: templateData?.name || 'Unknown',
        templateSubject: templateData?.subject || 'Unknown',
        timeRange,
        metrics,
        dailyMetrics,
        trends: this.calculateTrends(dailyMetrics)
      };
    } catch (error) {
      console.error('Failed to get template performance:', error);
      throw error;
    }
  }

  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    try {
      // Get campaign emails
      const { data: campaignEmails, error } = await this.supabase
        .from('email_logs')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) {
        throw new Error(`Failed to get campaign analytics: ${error.message}`);
      }

      if (!campaignEmails || campaignEmails.length === 0) {
        throw new Error('Campaign not found or has no emails');
      }

      const emailIds = campaignEmails.map((email: any) => email.id);
      
      // Get events for campaign emails
      const { data: events } = await this.supabase
        .from('email_events')
        .select('*')
        .in('email_id', emailIds);

      // Calculate metrics
      const metrics = this.calculateCampaignMetrics(campaignEmails, events || []);
      
      // Get timeline
      const timeline = this.buildCampaignTimeline(events || []);

      return {
        campaignId,
        totalEmails: campaignEmails.length,
        metrics,
        timeline,
        topPerformingEmails: this.getTopPerformingEmails(campaignEmails, events || []),
        geographicDistribution: this.getGeographicDistribution(events || []),
        deviceBreakdown: this.getDeviceBreakdown(events || [])
      };
    } catch (error) {
      console.error('Failed to get campaign analytics:', error);
      throw error;
    }
  }

  async getDeliveryMetrics(filter: AnalyticsFilter): Promise<DeliveryMetrics> {
    try {
      const metrics = await this.getEmailMetrics(filter);
      
      // Get provider breakdown
      const { data: providerData } = await this.supabase
        .from('email_logs')
        .select('provider_name, status')
        .gte('created_at', filter.startDate?.toISOString())
        .lte('created_at', filter.endDate?.toISOString());

      const providerBreakdown = this.calculateProviderBreakdown(providerData || []);
      
      // Get bounce reasons
      const { data: bounceData } = await this.supabase
        .from('email_events')
        .select('metadata')
        .eq('event_type', 'bounced')
        .gte('timestamp', filter.startDate?.toISOString())
        .lte('timestamp', filter.endDate?.toISOString());

      const bounceReasons = this.extractBounceReasons(bounceData || []);

      return {
        deliveryRate: metrics.deliveryRate,
        bounceRate: metrics.bounceRate,
        totalSent: metrics.totalSent,
        totalDelivered: metrics.totalDelivered,
        totalBounced: metrics.totalBounced,
        providerBreakdown,
        bounceReasons,
        deliveryTrends: await this.getDeliveryTrends(filter)
      };
    } catch (error) {
      console.error('Failed to get delivery metrics:', error);
      throw error;
    }
  }

  async getEngagementMetrics(filter: AnalyticsFilter): Promise<EngagementMetrics> {
    try {
      const metrics = await this.getEmailMetrics(filter);
      
      // Get engagement timeline
      const { data: engagementData } = await this.supabase
        .from('email_events')
        .select('event_type, timestamp, recipient_email')
        .in('event_type', ['opened', 'clicked'])
        .gte('timestamp', filter.startDate?.toISOString())
        .lte('timestamp', filter.endDate?.toISOString())
        .order('timestamp', { ascending: true });

      const engagementTimeline = this.buildEngagementTimeline(engagementData || []);
      const topEngagedUsers = this.getTopEngagedUsers(engagementData || []);

      return {
        openRate: metrics.openRate,
        clickRate: metrics.clickRate,
        totalOpened: metrics.totalOpened,
        totalClicked: metrics.totalClicked,
        uniqueOpens: metrics.uniqueOpens,
        uniqueClicks: metrics.uniqueClicks,
        engagementTimeline,
        topEngagedUsers,
        averageTimeToOpen: await this.getAverageTimeToOpen(filter),
        averageTimeToClick: await this.getAverageTimeToClick(filter)
      };
    } catch (error) {
      console.error('Failed to get engagement metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private getTimeRangeDates(timeRange: AnalyticsTimeRange): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'last_7_days':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90_days':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last_year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  private calculateTrends(dailyMetrics: any[]): any {
    if (dailyMetrics.length < 2) {
      return { openRate: 0, clickRate: 0, deliveryRate: 0 };
    }

    const recent = dailyMetrics.slice(-7); // Last 7 days
    const previous = dailyMetrics.slice(-14, -7); // Previous 7 days

    const recentAvg = this.calculateAverageRates(recent);
    const previousAvg = this.calculateAverageRates(previous);

    return {
      openRate: recentAvg.openRate - previousAvg.openRate,
      clickRate: recentAvg.clickRate - previousAvg.clickRate,
      deliveryRate: recentAvg.deliveryRate - previousAvg.deliveryRate
    };
  }

  private calculateAverageRates(metrics: any[]): any {
    if (metrics.length === 0) {
      return { openRate: 0, clickRate: 0, deliveryRate: 0 };
    }

    const totals = metrics.reduce((acc, metric) => ({
      sent: acc.sent + metric.sent,
      delivered: acc.delivered + metric.delivered,
      opened: acc.opened + metric.opened,
      clicked: acc.clicked + metric.clicked
    }), { sent: 0, delivered: 0, opened: 0, clicked: 0 });

    return {
      openRate: totals.delivered > 0 ? (totals.opened / totals.delivered) * 100 : 0,
      clickRate: totals.delivered > 0 ? (totals.clicked / totals.delivered) * 100 : 0,
      deliveryRate: totals.sent > 0 ? (totals.delivered / totals.sent) * 100 : 0
    };
  }

  private calculateCampaignMetrics(emails: any[], events: any[]): EmailMetrics {
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    const totalSent = emails.length;
    const totalDelivered = eventCounts.delivered || 0;
    const totalOpened = eventCounts.opened || 0;
    const totalClicked = eventCounts.clicked || 0;
    const totalBounced = eventCounts.bounced || 0;
    const totalComplained = eventCounts.complained || 0;
    const totalUnsubscribed = eventCounts.unsubscribed || 0;

    const uniqueOpens = new Set(events.filter(e => e.event_type === 'opened').map(e => e.recipient_email)).size;
    const uniqueClicks = new Set(events.filter(e => e.event_type === 'clicked').map(e => e.recipient_email)).size;

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalComplained,
      totalUnsubscribed,
      uniqueOpens,
      uniqueClicks,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      openRate: totalDelivered > 0 ? (uniqueOpens / totalDelivered) * 100 : 0,
      clickRate: totalDelivered > 0 ? (uniqueClicks / totalDelivered) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      complaintRate: totalDelivered > 0 ? (totalComplained / totalDelivered) * 100 : 0,
      unsubscribeRate: totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0
    };
  }

  private buildCampaignTimeline(events: any[]): any[] {
    const timeline = events
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(event => ({
        timestamp: new Date(event.timestamp),
        eventType: event.event_type,
        recipientEmail: event.recipient_email,
        metadata: event.metadata
      }));

    return timeline;
  }

  private getTopPerformingEmails(emails: any[], events: any[]): any[] {
    const emailPerformance = emails.map(email => {
      const emailEvents = events.filter(event => event.email_id === email.id);
      const opens = emailEvents.filter(event => event.event_type === 'opened').length;
      const clicks = emailEvents.filter(event => event.event_type === 'clicked').length;
      
      return {
        emailId: email.id,
        recipientEmail: email.recipient_email,
        subject: email.subject,
        opens,
        clicks,
        score: opens + (clicks * 2) // Weight clicks more heavily
      };
    });

    return emailPerformance
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private getGeographicDistribution(events: any[]): any[] {
    const locationCounts: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.location) {
        const location = typeof event.location === 'string' ? event.location : event.location.country || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });

    return Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getDeviceBreakdown(events: any[]): any[] {
    const deviceCounts: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.device_type) {
        deviceCounts[event.device_type] = (deviceCounts[event.device_type] || 0) + 1;
      }
    });

    return Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateProviderBreakdown(providerData: any[]): any[] {
    const providerCounts: Record<string, { sent: number; delivered: number }> = {};
    
    providerData.forEach(row => {
      const provider = row.provider_name || 'unknown';
      if (!providerCounts[provider]) {
        providerCounts[provider] = { sent: 0, delivered: 0 };
      }
      
      providerCounts[provider].sent += 1;
      if (row.status === 'delivered') {
        providerCounts[provider].delivered += 1;
      }
    });

    return Object.entries(providerCounts)
      .map(([provider, counts]) => ({
        provider,
        sent: counts.sent,
        delivered: counts.delivered,
        deliveryRate: counts.sent > 0 ? (counts.delivered / counts.sent) * 100 : 0
      }))
      .sort((a, b) => b.sent - a.sent);
  }

  private extractBounceReasons(bounceData: any[]): any[] {
    const reasonCounts: Record<string, number> = {};
    
    bounceData.forEach(row => {
      const reason = row.metadata?.reason || row.metadata?.bounce_reason || 'Unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }

  private async getDeliveryTrends(filter: AnalyticsFilter): Promise<any[]> {
    // Implementation for delivery trends over time
    return [];
  }

  private buildEngagementTimeline(engagementData: any[]): any[] {
    // Group events by hour
    const hourlyEngagement: Record<string, { opens: number; clicks: number }> = {};
    
    engagementData.forEach(event => {
      const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      if (!hourlyEngagement[hour]) {
        hourlyEngagement[hour] = { opens: 0, clicks: 0 };
      }
      
      if (event.event_type === 'opened') {
        hourlyEngagement[hour].opens += 1;
      } else if (event.event_type === 'clicked') {
        hourlyEngagement[hour].clicks += 1;
      }
    });

    return Object.entries(hourlyEngagement)
      .map(([timestamp, counts]) => ({
        timestamp: new Date(timestamp),
        opens: counts.opens,
        clicks: counts.clicks
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getTopEngagedUsers(engagementData: any[]): any[] {
    const userEngagement: Record<string, { opens: number; clicks: number }> = {};
    
    engagementData.forEach(event => {
      const email = event.recipient_email;
      if (!userEngagement[email]) {
        userEngagement[email] = { opens: 0, clicks: 0 };
      }
      
      if (event.event_type === 'opened') {
        userEngagement[email].opens += 1;
      } else if (event.event_type === 'clicked') {
        userEngagement[email].clicks += 1;
      }
    });

    return Object.entries(userEngagement)
      .map(([email, engagement]) => ({
        email,
        opens: engagement.opens,
        clicks: engagement.clicks,
        score: engagement.opens + (engagement.clicks * 2)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private async getAverageTimeToOpen(filter: AnalyticsFilter): Promise<number> {
    // Implementation for average time to open calculation
    return 0;
  }

  private async getAverageTimeToClick(filter: AnalyticsFilter): Promise<number> {
    // Implementation for average time to click calculation
    return 0;
  }
}