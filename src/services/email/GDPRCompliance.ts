import { SupabaseClient } from '@supabase/supabase-js';

export interface DataExportRequest {
  id: string;
  userId: string;
  email: string;
  requestedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  requestType: 'full_export' | 'email_data_only';
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  email: string;
  requestedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletionType: 'full_deletion' | 'anonymization' | 'email_data_only';
  retentionPeriod?: number; // days
  reason?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  email: string;
  consentType: 'marketing' | 'notifications' | 'analytics' | 'cookies';
  consentGiven: boolean;
  consentDate: Date;
  ipAddress?: string;
  userAgent?: string;
  source: 'registration' | 'preference_center' | 'email_link' | 'api';
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  withdrawnAt?: Date;
  withdrawalReason?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  email?: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  source: string;
}

export class GDPRCompliance {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Record user consent
   */
  async recordConsent(consent: Omit<ConsentRecord, 'id'>): Promise<ConsentRecord> {
    try {
      const consentRecord: ConsentRecord = {
        id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...consent
      };

      await this.supabase
        .from('consent_records')
        .insert({
          id: consentRecord.id,
          user_id: consentRecord.userId,
          email: consentRecord.email,
          consent_type: consentRecord.consentType,
          consent_given: consentRecord.consentGiven,
          consent_date: consentRecord.consentDate.toISOString(),
          ip_address: consentRecord.ipAddress,
          user_agent: consentRecord.userAgent,
          source: consentRecord.source,
          legal_basis: consentRecord.legalBasis,
          withdrawn_at: consentRecord.withdrawnAt?.toISOString(),
          withdrawal_reason: consentRecord.withdrawalReason
        });

      // Log the consent action
      await this.logAuditAction({
        userId: consent.userId,
        email: consent.email,
        action: consent.consentGiven ? 'consent_given' : 'consent_withdrawn',
        details: {
          consentType: consent.consentType,
          legalBasis: consent.legalBasis,
          source: consent.source
        },
        timestamp: new Date(),
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        source: 'gdpr_compliance'
      });

      return consentRecord;

    } catch (error) {
      console.error('Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    reason?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    try {
      const withdrawnAt = new Date();

      await this.supabase
        .from('consent_records')
        .update({
          consent_given: false,
          withdrawn_at: withdrawnAt.toISOString(),
          withdrawal_reason: reason
        })
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .eq('consent_given', true);

      // Log the withdrawal
      await this.logAuditAction({
        userId,
        action: 'consent_withdrawn',
        details: {
          consentType,
          reason,
          withdrawnAt: withdrawnAt.toISOString()
        },
        timestamp: withdrawnAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        source: 'gdpr_compliance'
      });

      // Update user preferences based on consent withdrawal
      await this.updatePreferencesOnConsentWithdrawal(userId, consentType);

    } catch (error) {
      console.error('Error withdrawing consent:', error);
      throw error;
    }
  }

  /**
   * Get user consent history
   */
  async getUserConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', userId)
        .order('consent_date', { ascending: false });

      if (error) throw error;

      return data?.map(record => ({
        id: record.id,
        userId: record.user_id,
        email: record.email,
        consentType: record.consent_type,
        consentGiven: record.consent_given,
        consentDate: new Date(record.consent_date),
        ipAddress: record.ip_address,
        userAgent: record.user_agent,
        source: record.source,
        legalBasis: record.legal_basis,
        withdrawnAt: record.withdrawn_at ? new Date(record.withdrawn_at) : undefined,
        withdrawalReason: record.withdrawal_reason
      })) || [];

    } catch (error) {
      console.error('Error getting user consent history:', error);
      throw error;
    }
  }

  /**
   * Request data export
   */
  async requestDataExport(
    userId: string,
    email: string,
    requestType: DataExportRequest['requestType'] = 'full_export'
  ): Promise<DataExportRequest> {
    try {
      const exportRequest: DataExportRequest = {
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        email,
        requestedAt: new Date(),
        status: 'pending',
        requestType
      };

      await this.supabase
        .from('data_export_requests')
        .insert({
          id: exportRequest.id,
          user_id: exportRequest.userId,
          email: exportRequest.email,
          requested_at: exportRequest.requestedAt.toISOString(),
          status: exportRequest.status,
          request_type: exportRequest.requestType
        });

      // Log the export request
      await this.logAuditAction({
        userId,
        email,
        action: 'data_export_requested',
        details: {
          requestId: exportRequest.id,
          requestType
        },
        timestamp: new Date(),
        source: 'gdpr_compliance'
      });

      // Process the export asynchronously
      this.processDataExport(exportRequest.id).catch(error => {
        console.error('Error processing data export:', error);
      });

      return exportRequest;

    } catch (error) {
      console.error('Error requesting data export:', error);
      throw error;
    }
  }

  /**
   * Process data export
   */
  private async processDataExport(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await this.supabase
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Get the request details
      const { data: request } = await this.supabase
        .from('data_export_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Export request not found');

      // Collect user data
      const userData = await this.collectUserData(request.user_id, request.request_type);

      // Generate export file (in real implementation, this would create a downloadable file)
      const exportData = {
        exportId: requestId,
        userId: request.user_id,
        email: request.email,
        exportedAt: new Date().toISOString(),
        requestType: request.request_type,
        data: userData
      };

      // In a real implementation, you would:
      // 1. Create a secure downloadable file (JSON, CSV, etc.)
      // 2. Upload it to secure storage
      // 3. Generate a time-limited download URL
      const downloadUrl = `https://secure-storage.example.com/exports/${requestId}.json`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update request with completion details
      await this.supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          download_url: downloadUrl,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', requestId);

      // Log completion
      await this.logAuditAction({
        userId: request.user_id,
        email: request.email,
        action: 'data_export_completed',
        details: {
          requestId,
          downloadUrl,
          expiresAt: expiresAt.toISOString()
        },
        timestamp: new Date(),
        source: 'gdpr_compliance'
      });

    } catch (error) {
      console.error('Error processing data export:', error);
      
      // Update status to failed
      await this.supabase
        .from('data_export_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);
    }
  }

  /**
   * Collect user data for export
   */
  private async collectUserData(userId: string, requestType: DataExportRequest['requestType']): Promise<any> {
    try {
      const data: any = {};

      if (requestType === 'full_export' || requestType === 'email_data_only') {
        // Email preferences
        const { data: preferences } = await this.supabase
          .from('email_preferences')
          .select('*')
          .eq('user_id', userId);

        // Email logs
        const { data: emailLogs } = await this.supabase
          .from('email_logs')
          .select('*')
          .eq('user_id', userId);

        // Email events
        const { data: emailEvents } = await this.supabase
          .from('email_events')
          .select('*')
          .eq('user_id', userId);

        // Consent records
        const { data: consentRecords } = await this.supabase
          .from('consent_records')
          .select('*')
          .eq('user_id', userId);

        data.emailData = {
          preferences,
          emailLogs,
          emailEvents,
          consentRecords
        };
      }

      if (requestType === 'full_export') {
        // Add other user data (profile, learning progress, etc.)
        // This would include data from other parts of the application
        data.profile = {}; // Placeholder
        data.learningProgress = {}; // Placeholder
        data.achievements = {}; // Placeholder
      }

      return data;

    } catch (error) {
      console.error('Error collecting user data:', error);
      throw error;
    }
  }

  /**
   * Request data deletion
   */
  async requestDataDeletion(
    userId: string,
    email: string,
    deletionType: DataDeletionRequest['deletionType'] = 'full_deletion',
    reason?: string,
    retentionPeriod?: number
  ): Promise<DataDeletionRequest> {
    try {
      const deletionRequest: DataDeletionRequest = {
        id: `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        email,
        requestedAt: new Date(),
        status: 'pending',
        deletionType,
        reason,
        retentionPeriod
      };

      await this.supabase
        .from('data_deletion_requests')
        .insert({
          id: deletionRequest.id,
          user_id: deletionRequest.userId,
          email: deletionRequest.email,
          requested_at: deletionRequest.requestedAt.toISOString(),
          status: deletionRequest.status,
          deletion_type: deletionRequest.deletionType,
          reason: deletionRequest.reason,
          retention_period: deletionRequest.retentionPeriod
        });

      // Log the deletion request
      await this.logAuditAction({
        userId,
        email,
        action: 'data_deletion_requested',
        details: {
          requestId: deletionRequest.id,
          deletionType,
          reason,
          retentionPeriod
        },
        timestamp: new Date(),
        source: 'gdpr_compliance'
      });

      // Process the deletion asynchronously (with appropriate delays for legal requirements)
      this.processDataDeletion(deletionRequest.id).catch(error => {
        console.error('Error processing data deletion:', error);
      });

      return deletionRequest;

    } catch (error) {
      console.error('Error requesting data deletion:', error);
      throw error;
    }
  }

  /**
   * Process data deletion
   */
  private async processDataDeletion(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await this.supabase
        .from('data_deletion_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Get the request details
      const { data: request } = await this.supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Deletion request not found');

      // Apply retention period if specified
      if (request.retention_period) {
        const deletionDate = new Date(Date.now() + request.retention_period * 24 * 60 * 60 * 1000);
        // Schedule deletion for later
        console.log(`Data deletion scheduled for ${deletionDate.toISOString()}`);
        return;
      }

      // Perform the actual deletion based on type
      switch (request.deletion_type) {
        case 'full_deletion':
          await this.performFullDeletion(request.user_id);
          break;
        case 'anonymization':
          await this.performAnonymization(request.user_id);
          break;
        case 'email_data_only':
          await this.performEmailDataDeletion(request.user_id);
          break;
      }

      // Update request status
      await this.supabase
        .from('data_deletion_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Log completion
      await this.logAuditAction({
        userId: request.user_id,
        email: request.email,
        action: 'data_deletion_completed',
        details: {
          requestId,
          deletionType: request.deletion_type
        },
        timestamp: new Date(),
        source: 'gdpr_compliance'
      });

    } catch (error) {
      console.error('Error processing data deletion:', error);
      
      // Update status to failed
      await this.supabase
        .from('data_deletion_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);
    }
  }

  /**
   * Perform full data deletion
   */
  private async performFullDeletion(userId: string): Promise<void> {
    try {
      // Delete from all tables (in correct order to respect foreign key constraints)
      const tables = [
        'email_events',
        'email_logs',
        'email_preferences',
        'consent_records',
        'data_export_requests',
        'data_deletion_requests'
        // Add other tables as needed
      ];

      for (const table of tables) {
        await this.supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
      }

    } catch (error) {
      console.error('Error performing full deletion:', error);
      throw error;
    }
  }

  /**
   * Perform data anonymization
   */
  private async performAnonymization(userId: string): Promise<void> {
    try {
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const anonymousEmail = `anonymous_${Date.now()}@deleted.local`;

      // Anonymize email preferences
      await this.supabase
        .from('email_preferences')
        .update({
          user_id: anonymousId,
          email: anonymousEmail
        })
        .eq('user_id', userId);

      // Anonymize email logs
      await this.supabase
        .from('email_logs')
        .update({
          user_id: anonymousId,
          recipient_email: anonymousEmail
        })
        .eq('user_id', userId);

      // Anonymize email events
      await this.supabase
        .from('email_events')
        .update({
          user_id: anonymousId,
          email: anonymousEmail
        })
        .eq('user_id', userId);

    } catch (error) {
      console.error('Error performing anonymization:', error);
      throw error;
    }
  }

  /**
   * Perform email data deletion only
   */
  private async performEmailDataDeletion(userId: string): Promise<void> {
    try {
      const emailTables = [
        'email_events',
        'email_logs',
        'email_preferences'
      ];

      for (const table of emailTables) {
        await this.supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
      }

    } catch (error) {
      console.error('Error performing email data deletion:', error);
      throw error;
    }
  }

  /**
   * Update preferences when consent is withdrawn
   */
  private async updatePreferencesOnConsentWithdrawal(
    userId: string,
    consentType: ConsentRecord['consentType']
  ): Promise<void> {
    try {
      const updates: any = {};

      switch (consentType) {
        case 'marketing':
          updates.marketing = false;
          break;
        case 'notifications':
          updates.notifications = false;
          break;
        case 'analytics':
          // Handle analytics consent withdrawal
          break;
      }

      if (Object.keys(updates).length > 0) {
        await this.supabase
          .from('email_preferences')
          .update(updates)
          .eq('user_id', userId);
      }

    } catch (error) {
      console.error('Error updating preferences on consent withdrawal:', error);
      throw error;
    }
  }

  /**
   * Log audit action
   */
  private async logAuditAction(log: Omit<AuditLog, 'id'>): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...log
      };

      await this.supabase
        .from('gdpr_audit_logs')
        .insert({
          id: auditLog.id,
          user_id: auditLog.userId,
          email: auditLog.email,
          action: auditLog.action,
          details: auditLog.details,
          timestamp: auditLog.timestamp.toISOString(),
          ip_address: auditLog.ipAddress,
          user_agent: auditLog.userAgent,
          source: auditLog.source
        });

    } catch (error) {
      console.error('Error logging audit action:', error);
      // Don't throw here to avoid breaking the main operation
    }
  }

  /**
   * Get GDPR compliance report
   */
  async getComplianceReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    consentRecords: number;
    exportRequests: number;
    deletionRequests: number;
    auditLogs: number;
    activeConsents: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      // Get counts for the period
      const [consentCount, exportCount, deletionCount, auditCount] = await Promise.all([
        this.supabase
          .from('consent_records')
          .select('id', { count: 'exact' })
          .gte('consent_date', start.toISOString())
          .lte('consent_date', end.toISOString()),
        
        this.supabase
          .from('data_export_requests')
          .select('id', { count: 'exact' })
          .gte('requested_at', start.toISOString())
          .lte('requested_at', end.toISOString()),
        
        this.supabase
          .from('data_deletion_requests')
          .select('id', { count: 'exact' })
          .gte('requested_at', start.toISOString())
          .lte('requested_at', end.toISOString()),
        
        this.supabase
          .from('gdpr_audit_logs')
          .select('id', { count: 'exact' })
          .gte('timestamp', start.toISOString())
          .lte('timestamp', end.toISOString())
      ]);

      // Get active consents by type
      const { data: activeConsents } = await this.supabase
        .from('consent_records')
        .select('consent_type')
        .eq('consent_given', true)
        .is('withdrawn_at', null);

      const activeConsentsByType = activeConsents?.reduce((acc, record) => {
        acc[record.consent_type] = (acc[record.consent_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get recent audit activity
      const { data: recentAuditLogs } = await this.supabase
        .from('gdpr_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      const recentActivity = recentAuditLogs?.map(log => ({
        id: log.id,
        userId: log.user_id,
        email: log.email,
        action: log.action,
        details: log.details,
        timestamp: new Date(log.timestamp),
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        source: log.source
      })) || [];

      return {
        consentRecords: consentCount.count || 0,
        exportRequests: exportCount.count || 0,
        deletionRequests: deletionCount.count || 0,
        auditLogs: auditCount.count || 0,
        activeConsents: activeConsentsByType,
        recentActivity
      };

    } catch (error) {
      console.error('Error getting compliance report:', error);
      throw error;
    }
  }
}