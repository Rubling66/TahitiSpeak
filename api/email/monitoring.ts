import { Request, Response } from 'express';
import { EmailMonitoring } from '../../src/services/email/EmailMonitoring';
import { GDPRCompliance } from '../../src/services/email/GDPRCompliance';
import { supabase } from '../../src/lib/supabase';

const emailMonitoring = new EmailMonitoring(supabase);
const gdprCompliance = new GDPRCompliance(supabase);

/**
 * Get monitoring dashboard data
 * GET /api/email/monitoring/dashboard
 */
export async function getMonitoringDashboard(req: Request, res: Response) {
  try {
    const dashboardData = await emailMonitoring.getDashboardData();

    res.status(200).json({
      success: true,
      data: dashboardData,
      message: 'Monitoring dashboard data retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting monitoring dashboard:', error);
    res.status(500).json({
      error: 'Failed to get monitoring dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get active alerts
 * GET /api/email/monitoring/alerts
 */
export async function getActiveAlerts(req: Request, res: Response) {
  try {
    const { severity, type } = req.query;

    const alerts = await emailMonitoring.getActiveAlerts(
      severity as any,
      type as any
    );

    res.status(200).json({
      success: true,
      data: alerts,
      message: 'Active alerts retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting active alerts:', error);
    res.status(500).json({
      error: 'Failed to get active alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Resolve alert
 * POST /api/email/monitoring/alerts/:alertId/resolve
 */
export async function resolveAlert(req: Request, res: Response) {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        error: 'Alert ID is required'
      });
    }

    await emailMonitoring.resolveAlert(alertId);

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully'
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      error: 'Failed to resolve alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get quota usage
 * GET /api/email/monitoring/quota
 */
export async function getQuotaUsage(req: Request, res: Response) {
  try {
    const quotas = await emailMonitoring.getQuotaUsage();

    res.status(200).json({
      success: true,
      data: quotas,
      message: 'Quota usage retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting quota usage:', error);
    res.status(500).json({
      error: 'Failed to get quota usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Check provider health
 * GET /api/email/monitoring/health
 */
export async function checkProviderHealth(req: Request, res: Response) {
  try {
    const healthChecks = await emailMonitoring.checkProviderHealth();

    res.status(200).json({
      success: true,
      data: healthChecks,
      message: 'Provider health checked successfully'
    });

  } catch (error) {
    console.error('Error checking provider health:', error);
    res.status(500).json({
      error: 'Failed to check provider health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Run monitoring check
 * POST /api/email/monitoring/check
 */
export async function runMonitoringCheck(req: Request, res: Response) {
  try {
    const { timeWindow } = req.body;

    let window;
    if (timeWindow) {
      window = {
        start: new Date(timeWindow.start),
        end: new Date(timeWindow.end)
      };
    }

    const alerts = await emailMonitoring.monitorMetrics(window);

    res.status(200).json({
      success: true,
      data: {
        alertsTriggered: alerts.length,
        alerts
      },
      message: 'Monitoring check completed successfully'
    });

  } catch (error) {
    console.error('Error running monitoring check:', error);
    res.status(500).json({
      error: 'Failed to run monitoring check',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Record user consent
 * POST /api/email/gdpr/consent
 */
export async function recordConsent(req: Request, res: Response) {
  try {
    const {
      userId,
      email,
      consentType,
      consentGiven,
      ipAddress,
      userAgent,
      source,
      legalBasis
    } = req.body;

    if (!userId || !email || !consentType || consentGiven === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: userId, email, consentType, consentGiven'
      });
    }

    const consentRecord = await gdprCompliance.recordConsent({
      userId,
      email,
      consentType,
      consentGiven,
      consentDate: new Date(),
      ipAddress,
      userAgent,
      source: source || 'api',
      legalBasis: legalBasis || 'consent'
    });

    res.status(200).json({
      success: true,
      data: consentRecord,
      message: 'Consent recorded successfully'
    });

  } catch (error) {
    console.error('Error recording consent:', error);
    res.status(500).json({
      error: 'Failed to record consent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Withdraw consent
 * POST /api/email/gdpr/consent/withdraw
 */
export async function withdrawConsent(req: Request, res: Response) {
  try {
    const { userId, consentType, reason, ipAddress, userAgent } = req.body;

    if (!userId || !consentType) {
      return res.status(400).json({
        error: 'Missing required fields: userId, consentType'
      });
    }

    await gdprCompliance.withdrawConsent(
      userId,
      consentType,
      reason,
      { ipAddress, userAgent }
    );

    res.status(200).json({
      success: true,
      message: 'Consent withdrawn successfully'
    });

  } catch (error) {
    console.error('Error withdrawing consent:', error);
    res.status(500).json({
      error: 'Failed to withdraw consent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get user consent history
 * GET /api/email/gdpr/consent/:userId
 */
export async function getUserConsentHistory(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const consentHistory = await gdprCompliance.getUserConsentHistory(userId);

    res.status(200).json({
      success: true,
      data: consentHistory,
      message: 'User consent history retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting user consent history:', error);
    res.status(500).json({
      error: 'Failed to get user consent history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Request data export
 * POST /api/email/gdpr/export
 */
export async function requestDataExport(req: Request, res: Response) {
  try {
    const { userId, email, requestType } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        error: 'Missing required fields: userId, email'
      });
    }

    const exportRequest = await gdprCompliance.requestDataExport(
      userId,
      email,
      requestType || 'full_export'
    );

    res.status(200).json({
      success: true,
      data: exportRequest,
      message: 'Data export request submitted successfully'
    });

  } catch (error) {
    console.error('Error requesting data export:', error);
    res.status(500).json({
      error: 'Failed to request data export',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Request data deletion
 * POST /api/email/gdpr/delete
 */
export async function requestDataDeletion(req: Request, res: Response) {
  try {
    const { userId, email, deletionType, reason, retentionPeriod } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        error: 'Missing required fields: userId, email'
      });
    }

    const deletionRequest = await gdprCompliance.requestDataDeletion(
      userId,
      email,
      deletionType || 'full_deletion',
      reason,
      retentionPeriod
    );

    res.status(200).json({
      success: true,
      data: deletionRequest,
      message: 'Data deletion request submitted successfully'
    });

  } catch (error) {
    console.error('Error requesting data deletion:', error);
    res.status(500).json({
      error: 'Failed to request data deletion',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get GDPR compliance report
 * GET /api/email/gdpr/report
 */
export async function getComplianceReport(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const report = await gdprCompliance.getComplianceReport(start, end);

    res.status(200).json({
      success: true,
      data: report,
      message: 'GDPR compliance report retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting compliance report:', error);
    res.status(500).json({
      error: 'Failed to get compliance report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get audit logs
 * GET /api/email/gdpr/audit
 */
export async function getAuditLogs(req: Request, res: Response) {
  try {
    const {
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // This would typically query the audit logs table
    // For now, return a mock response
    const auditLogs = [
      {
        id: 'audit_1',
        userId: userId || 'user_123',
        action: action || 'consent_given',
        details: { consentType: 'marketing' },
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        source: 'gdpr_compliance'
      }
    ];

    res.status(200).json({
      success: true,
      data: auditLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: auditLogs.length,
        totalPages: Math.ceil(auditLogs.length / Number(limit))
      },
      message: 'Audit logs retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      error: 'Failed to get audit logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Validate email compliance
 * POST /api/email/gdpr/validate
 */
export async function validateEmailCompliance(req: Request, res: Response) {
  try {
    const { userId, email, emailType } = req.body;

    if (!userId || !email || !emailType) {
      return res.status(400).json({
        error: 'Missing required fields: userId, email, emailType'
      });
    }

    // Check if user has given consent for this type of email
    const consentHistory = await gdprCompliance.getUserConsentHistory(userId);
    
    const relevantConsent = consentHistory.find(consent => 
      consent.consentType === emailType && 
      consent.consentGiven && 
      !consent.withdrawnAt
    );

    const isCompliant = !!relevantConsent;
    const canSendEmail = isCompliant;

    res.status(200).json({
      success: true,
      data: {
        isCompliant,
        canSendEmail,
        consentStatus: relevantConsent ? 'given' : 'not_given',
        lastConsentDate: relevantConsent?.consentDate,
        legalBasis: relevantConsent?.legalBasis
      },
      message: 'Email compliance validated successfully'
    });

  } catch (error) {
    console.error('Error validating email compliance:', error);
    res.status(500).json({
      error: 'Failed to validate email compliance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}