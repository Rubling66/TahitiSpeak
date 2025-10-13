import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailAlert {
  id: string;
  type: 'high_bounce_rate' | 'low_delivery_rate' | 'spam_complaints' | 'quota_exceeded' | 'provider_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  provider?: string;
  templateId?: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
  metadata?: Record<string, any>;
}

export interface EmailQuota {
  provider: string;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  resetTime: Date;
  isExceeded: boolean;
}

export interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  uptime: number;
  issues?: string[];
}

export class EmailMonitoring {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Monitor email metrics and trigger alerts
   */
  async monitorMetrics(
    timeWindow: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<EmailAlert[]> {
    const alerts: EmailAlert[] = [];

    try {
      // Check bounce rate
      const bounceRateAlert = await this.checkBounceRate(timeWindow);
      if (bounceRateAlert) alerts.push(bounceRateAlert);

      // Check delivery rate
      const deliveryRateAlert = await this.checkDeliveryRate(timeWindow);
      if (deliveryRateAlert) alerts.push(deliveryRateAlert);

      // Check spam complaints
      const spamAlert = await this.checkSpamComplaints(timeWindow);
      if (spamAlert) alerts.push(spamAlert);

      // Check quota usage
      const quotaAlerts = await this.checkQuotaUsage();
      alerts.push(...quotaAlerts);

      // Save alerts to database
      for (const alert of alerts) {
        await this.saveAlert(alert);
      }

      return alerts;

    } catch (error) {
      console.error('Error monitoring email metrics:', error);
      throw error;
    }
  }

  /**
   * Check bounce rate and create alert if threshold exceeded
   */
  private async checkBounceRate(timeWindow: { start: Date; end: Date }): Promise<EmailAlert | null> {
    try {
      const { data: stats } = await this.supabase
        .from('email_logs')
        .select('status')
        .gte('created_at', timeWindow.start.toISOString())
        .lte('created_at', timeWindow.end.toISOString());

      if (!stats || stats.length === 0) return null;

      const totalEmails = stats.length;
      const bouncedEmails = stats.filter(s => s.status === 'bounced').length;
      const bounceRate = (bouncedEmails / totalEmails) * 100;

      const threshold = 5; // 5% bounce rate threshold

      if (bounceRate > threshold) {
        return {
          id: `alert_${Date.now()}`,
          type: 'high_bounce_rate',
          severity: bounceRate > 10 ? 'critical' : 'high',
          message: `High bounce rate detected: ${bounceRate.toFixed(2)}%`,
          threshold,
          currentValue: bounceRate,
          triggeredAt: new Date(),
          isResolved: false,
          metadata: {
            totalEmails,
            bouncedEmails,
            timeWindow
          }
        };
      }

      return null;

    } catch (error) {
      console.error('Error checking bounce rate:', error);
      return null;
    }
  }

  /**
   * Check delivery rate and create alert if threshold not met
   */
  private async checkDeliveryRate(timeWindow: { start: Date; end: Date }): Promise<EmailAlert | null> {
    try {
      const { data: stats } = await this.supabase
        .from('email_logs')
        .select('status')
        .gte('created_at', timeWindow.start.toISOString())
        .lte('created_at', timeWindow.end.toISOString());

      if (!stats || stats.length === 0) return null;

      const totalEmails = stats.length;
      const deliveredEmails = stats.filter(s => s.status === 'delivered').length;
      const deliveryRate = (deliveredEmails / totalEmails) * 100;

      const threshold = 95; // 95% delivery rate threshold

      if (deliveryRate < threshold) {
        return {
          id: `alert_${Date.now()}`,
          type: 'low_delivery_rate',
          severity: deliveryRate < 85 ? 'critical' : 'high',
          message: `Low delivery rate detected: ${deliveryRate.toFixed(2)}%`,
          threshold,
          currentValue: deliveryRate,
          triggeredAt: new Date(),
          isResolved: false,
          metadata: {
            totalEmails,
            deliveredEmails,
            timeWindow
          }
        };
      }

      return null;

    } catch (error) {
      console.error('Error checking delivery rate:', error);
      return null;
    }
  }

  /**
   * Check spam complaints and create alert if threshold exceeded
   */
  private async checkSpamComplaints(timeWindow: { start: Date; end: Date }): Promise<EmailAlert | null> {
    try {
      const { data: events } = await this.supabase
        .from('email_events')
        .select('event_type')
        .eq('event_type', 'spamreport')
        .gte('created_at', timeWindow.start.toISOString())
        .lte('created_at', timeWindow.end.toISOString());

      const { data: totalSent } = await this.supabase
        .from('email_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', timeWindow.start.toISOString())
        .lte('created_at', timeWindow.end.toISOString());

      if (!totalSent || totalSent.length === 0) return null;

      const complaints = events?.length || 0;
      const complaintRate = (complaints / totalSent.length) * 100;

      const threshold = 0.1; // 0.1% complaint rate threshold

      if (complaintRate > threshold) {
        return {
          id: `alert_${Date.now()}`,
          type: 'spam_complaints',
          severity: complaintRate > 0.5 ? 'critical' : 'high',
          message: `High spam complaint rate detected: ${complaintRate.toFixed(3)}%`,
          threshold,
          currentValue: complaintRate,
          triggeredAt: new Date(),
          isResolved: false,
          metadata: {
            totalSent: totalSent.length,
            complaints,
            timeWindow
          }
        };
      }

      return null;

    } catch (error) {
      console.error('Error checking spam complaints:', error);
      return null;
    }
  }

  /**
   * Check quota usage for all providers
   */
  private async checkQuotaUsage(): Promise<EmailAlert[]> {
    const alerts: EmailAlert[] = [];

    try {
      const quotas = await this.getQuotaUsage();

      for (const quota of quotas) {
        const dailyUsagePercent = (quota.dailyUsed / quota.dailyLimit) * 100;
        const monthlyUsagePercent = (quota.monthlyUsed / quota.monthlyLimit) * 100;

        // Check daily quota
        if (dailyUsagePercent > 90) {
          alerts.push({
            id: `alert_${Date.now()}_daily_${quota.provider}`,
            type: 'quota_exceeded',
            severity: dailyUsagePercent > 95 ? 'critical' : 'high',
            message: `Daily quota usage high for ${quota.provider}: ${dailyUsagePercent.toFixed(1)}%`,
            threshold: 90,
            currentValue: dailyUsagePercent,
            provider: quota.provider,
            triggeredAt: new Date(),
            isResolved: false,
            metadata: {
              quotaType: 'daily',
              used: quota.dailyUsed,
              limit: quota.dailyLimit
            }
          });
        }

        // Check monthly quota
        if (monthlyUsagePercent > 80) {
          alerts.push({
            id: `alert_${Date.now()}_monthly_${quota.provider}`,
            type: 'quota_exceeded',
            severity: monthlyUsagePercent > 90 ? 'critical' : 'medium',
            message: `Monthly quota usage high for ${quota.provider}: ${monthlyUsagePercent.toFixed(1)}%`,
            threshold: 80,
            currentValue: monthlyUsagePercent,
            provider: quota.provider,
            triggeredAt: new Date(),
            isResolved: false,
            metadata: {
              quotaType: 'monthly',
              used: quota.monthlyUsed,
              limit: quota.monthlyLimit
            }
          });
        }
      }

      return alerts;

    } catch (error) {
      console.error('Error checking quota usage:', error);
      return [];
    }
  }

  /**
   * Get quota usage for all providers
   */
  async getQuotaUsage(): Promise<EmailQuota[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: dailyUsage } = await this.supabase
        .from('email_logs')
        .select('provider')
        .gte('created_at', startOfDay.toISOString());

      const { data: monthlyUsage } = await this.supabase
        .from('email_logs')
        .select('provider')
        .gte('created_at', startOfMonth.toISOString());

      // Group by provider
      const providers = ['sendgrid', 'resend'];
      const quotas: EmailQuota[] = [];

      for (const provider of providers) {
        const dailyUsed = dailyUsage?.filter(u => u.provider === provider).length || 0;
        const monthlyUsed = monthlyUsage?.filter(u => u.provider === provider).length || 0;

        // These would typically come from provider settings or environment variables
        const dailyLimit = provider === 'sendgrid' ? 100000 : 50000;
        const monthlyLimit = provider === 'sendgrid' ? 3000000 : 1500000;

        quotas.push({
          provider,
          dailyLimit,
          monthlyLimit,
          dailyUsed,
          monthlyUsed,
          resetTime: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          isExceeded: dailyUsed >= dailyLimit || monthlyUsed >= monthlyLimit
        });
      }

      return quotas;

    } catch (error) {
      console.error('Error getting quota usage:', error);
      throw error;
    }
  }

  /**
   * Check provider health status
   */
  async checkProviderHealth(): Promise<ProviderHealth[]> {
    const providers = ['sendgrid', 'resend'];
    const healthChecks: ProviderHealth[] = [];

    for (const provider of providers) {
      try {
        const startTime = Date.now();
        
        // Simulate health check (in real implementation, make actual API calls)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        const responseTime = Date.now() - startTime;

        // Get recent error rate
        const { data: recentLogs } = await this.supabase
          .from('email_logs')
          .select('status')
          .eq('provider', provider)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        const totalRequests = recentLogs?.length || 0;
        const errorRequests = recentLogs?.filter(log => 
          ['failed', 'bounced'].includes(log.status)
        ).length || 0;

        const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

        let status: 'healthy' | 'degraded' | 'down' = 'healthy';
        const issues: string[] = [];

        if (responseTime > 5000) {
          status = 'degraded';
          issues.push('High response time');
        }

        if (errorRate > 10) {
          status = errorRate > 25 ? 'down' : 'degraded';
          issues.push('High error rate');
        }

        healthChecks.push({
          provider,
          status,
          responseTime,
          errorRate,
          lastChecked: new Date(),
          uptime: 99.9, // This would be calculated from historical data
          issues: issues.length > 0 ? issues : undefined
        });

      } catch (error) {
        healthChecks.push({
          provider,
          status: 'down',
          responseTime: 0,
          errorRate: 100,
          lastChecked: new Date(),
          uptime: 0,
          issues: ['Health check failed']
        });
      }
    }

    return healthChecks;
  }

  /**
   * Save alert to database
   */
  private async saveAlert(alert: EmailAlert): Promise<void> {
    try {
      await this.supabase
        .from('email_alerts')
        .insert({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          threshold: alert.threshold,
          current_value: alert.currentValue,
          provider: alert.provider,
          template_id: alert.templateId,
          triggered_at: alert.triggeredAt.toISOString(),
          resolved_at: alert.resolvedAt?.toISOString(),
          is_resolved: alert.isResolved,
          metadata: alert.metadata
        });

    } catch (error) {
      console.error('Error saving alert:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(
    severity?: EmailAlert['severity'],
    type?: EmailAlert['type']
  ): Promise<EmailAlert[]> {
    try {
      let query = this.supabase
        .from('email_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('triggered_at', { ascending: false });

      if (severity) {
        query = query.eq('severity', severity);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        threshold: alert.threshold,
        currentValue: alert.current_value,
        provider: alert.provider,
        templateId: alert.template_id,
        triggeredAt: new Date(alert.triggered_at),
        resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
        isResolved: alert.is_resolved,
        metadata: alert.metadata
      })) || [];

    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.supabase
        .from('email_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData(): Promise<{
    alerts: EmailAlert[];
    quotas: EmailQuota[];
    providerHealth: ProviderHealth[];
    recentMetrics: any;
  }> {
    try {
      const [alerts, quotas, providerHealth] = await Promise.all([
        this.getActiveAlerts(),
        this.getQuotaUsage(),
        this.checkProviderHealth()
      ]);

      // Get recent metrics for the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: recentLogs } = await this.supabase
        .from('email_logs')
        .select('status, provider, created_at')
        .gte('created_at', yesterday.toISOString());

      const recentMetrics = {
        totalSent: recentLogs?.length || 0,
        delivered: recentLogs?.filter(log => log.status === 'delivered').length || 0,
        bounced: recentLogs?.filter(log => log.status === 'bounced').length || 0,
        failed: recentLogs?.filter(log => log.status === 'failed').length || 0
      };

      return {
        alerts,
        quotas,
        providerHealth,
        recentMetrics
      };

    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }
}