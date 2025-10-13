import { Request, Response } from 'express';
import { EmailAnalytics } from '../../src/services/email/EmailAnalytics';
import { supabase } from '../../src/lib/supabase';

const emailAnalytics = new EmailAnalytics(supabase);

/**
 * Get email analytics summary
 * GET /api/email/analytics/summary
 */
export async function getAnalyticsSummary(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      provider,
      templateId
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const filters = {
      provider: provider as string,
      templateId: templateId as string
    };

    const summary = await emailAnalytics.getEmailMetrics(dateRange, filters);

    res.status(200).json({
      success: true,
      data: summary,
      message: 'Analytics summary retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({
      error: 'Failed to get analytics summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get delivery metrics
 * GET /api/email/analytics/delivery
 */
export async function getDeliveryMetrics(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      provider,
      groupBy = 'day'
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const filters = {
      provider: provider as string
    };

    const metrics = await emailAnalytics.getDeliveryMetrics(
      dateRange,
      filters,
      groupBy as 'hour' | 'day' | 'week'
    );

    res.status(200).json({
      success: true,
      data: metrics,
      message: 'Delivery metrics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting delivery metrics:', error);
    res.status(500).json({
      error: 'Failed to get delivery metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get engagement metrics
 * GET /api/email/analytics/engagement
 */
export async function getEngagementMetrics(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      templateId,
      segmentBy
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const filters = {
      templateId: templateId as string
    };

    const metrics = await emailAnalytics.getEngagementMetrics(
      dateRange,
      filters,
      segmentBy as 'device' | 'location' | 'time'
    );

    res.status(200).json({
      success: true,
      data: metrics,
      message: 'Engagement metrics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    res.status(500).json({
      error: 'Failed to get engagement metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get template performance comparison
 * GET /api/email/analytics/templates/performance
 */
export async function getTemplatePerformance(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      templateIds,
      metric = 'openRate'
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    let templateIdList: string[] = [];
    if (templateIds) {
      templateIdList = Array.isArray(templateIds) 
        ? templateIds as string[]
        : (templateIds as string).split(',');
    }

    const performance = await emailAnalytics.getTemplatePerformance(
      templateIdList,
      dateRange,
      metric as 'openRate' | 'clickRate' | 'deliveryRate'
    );

    res.status(200).json({
      success: true,
      data: performance,
      message: 'Template performance retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting template performance:', error);
    res.status(500).json({
      error: 'Failed to get template performance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get campaign analytics
 * GET /api/email/analytics/campaigns/:campaignId
 */
export async function getCampaignAnalytics(req: Request, res: Response) {
  try {
    const { campaignId } = req.params;
    const {
      includeTimeline = 'true',
      includeGeography = 'false',
      includeDevices = 'false'
    } = req.query;

    if (!campaignId) {
      return res.status(400).json({
        error: 'Campaign ID is required'
      });
    }

    const options = {
      includeTimeline: includeTimeline === 'true',
      includeGeography: includeGeography === 'true',
      includeDevices: includeDevices === 'true'
    };

    const analytics = await emailAnalytics.getCampaignAnalytics(campaignId, options);

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Campaign analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    res.status(500).json({
      error: 'Failed to get campaign analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get real-time analytics
 * GET /api/email/analytics/realtime
 */
export async function getRealtimeAnalytics(req: Request, res: Response) {
  try {
    const {
      hours = 24,
      provider
    } = req.query;

    const hoursBack = Number(hours);
    const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const endDate = new Date();

    const filters = {
      provider: provider as string
    };

    const analytics = await emailAnalytics.getEmailMetrics(
      { startDate, endDate },
      filters
    );

    // Get recent activity timeline
    const timeline = await emailAnalytics.getEngagementTimeline(
      { startDate, endDate },
      filters,
      'hour'
    );

    res.status(200).json({
      success: true,
      data: {
        summary: analytics,
        timeline,
        lastUpdated: new Date().toISOString()
      },
      message: 'Real-time analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting real-time analytics:', error);
    res.status(500).json({
      error: 'Failed to get real-time analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get bounce analysis
 * GET /api/email/analytics/bounces
 */
export async function getBounceAnalysis(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      bounceType,
      provider
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const filters = {
      bounceType: bounceType as 'hard' | 'soft',
      provider: provider as string
    };

    const bounceAnalysis = await emailAnalytics.getBounceAnalysis(dateRange, filters);

    res.status(200).json({
      success: true,
      data: bounceAnalysis,
      message: 'Bounce analysis retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting bounce analysis:', error);
    res.status(500).json({
      error: 'Failed to get bounce analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get user engagement analysis
 * GET /api/email/analytics/users/engagement
 */
export async function getUserEngagementAnalysis(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      userId,
      segmentBy = 'activity'
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const filters = {
      userId: userId as string
    };

    const engagement = await emailAnalytics.getUserEngagement(
      dateRange,
      filters,
      segmentBy as 'activity' | 'preference' | 'device'
    );

    res.status(200).json({
      success: true,
      data: engagement,
      message: 'User engagement analysis retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting user engagement analysis:', error);
    res.status(500).json({
      error: 'Failed to get user engagement analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Export analytics data
 * GET /api/email/analytics/export
 */
export async function exportAnalytics(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      format = 'csv',
      type = 'summary',
      provider
    } = req.query;

    if (!['csv', 'json'].includes(format as string)) {
      return res.status(400).json({
        error: 'Format must be either "csv" or "json"'
      });
    }

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const filters = {
      provider: provider as string
    };

    let data;
    switch (type) {
      case 'summary':
        data = await emailAnalytics.getEmailMetrics(dateRange, filters);
        break;
      case 'delivery':
        data = await emailAnalytics.getDeliveryMetrics(dateRange, filters);
        break;
      case 'engagement':
        data = await emailAnalytics.getEngagementMetrics(dateRange, filters);
        break;
      default:
        return res.status(400).json({
          error: 'Type must be one of: summary, delivery, engagement'
        });
    }

    // Set appropriate headers for download
    const filename = `email-analytics-${type}-${Date.now()}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      // Convert to CSV format (simplified)
      const csv = JSON.stringify(data); // In real implementation, use proper CSV conversion
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        filename
      });
    }

  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      error: 'Failed to export analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}