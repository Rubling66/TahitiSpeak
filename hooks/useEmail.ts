import { useState, useCallback } from 'react';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  requiredData: string[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  emailCount: number;
  analytics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
}

export interface EmailAnalytics {
  summary: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
  };
  timeSeries: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  }>;
  campaigns?: EmailCampaign[];
  topPerformingCampaigns?: EmailCampaign[];
}

export interface SendEmailOptions {
  to: { email: string; name?: string } | Array<{ email: string; name?: string }>;
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  categories?: string[];
}

export interface SendTemplateEmailOptions {
  templateType: 'welcome' | 'password_reset' | 'lesson_completion' | 'weekly_progress' | 'subscription';
  recipients: Array<{
    email: string;
    name?: string;
    data?: Record<string, any>;
  }>;
}

export interface TriggerAutomationOptions {
  event: string;
  userId: string;
  data: Record<string, any>;
}

export function useEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }, []);

  const handleApiError = useCallback((error: any) => {
    console.error('Email API error:', error);
    if (error.response?.data?.error) {
      setError(error.response.data.error);
    } else if (error.message) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  // Send single email
  const sendEmail = useCallback(async (options: SendEmailOptions): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'single',
          email: options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const data = await response.json();
      return data.messageId;
    } catch (error) {
      handleApiError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Send bulk emails
  const sendBulkEmails = useCallback(async (emails: SendEmailOptions[]): Promise<{
    messageIds: string[];
    summary: { total: number; successful: number; failed: number };
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'bulk',
          emails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send bulk emails');
      }

      const data = await response.json();
      return {
        messageIds: data.messageIds,
        summary: data.summary,
      };
    } catch (error) {
      handleApiError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Send template email
  const sendTemplateEmail = useCallback(async (options: SendTemplateEmailOptions): Promise<{
    results: Array<{ email: string; success: boolean; messageId?: string; error?: string }>;
    summary: { total: number; successful: number; failed: number };
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'template',
          templateType: options.templateType,
          recipients: options.recipients,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send template email');
      }

      const data = await response.json();
      return {
        results: data.results,
        summary: data.summary,
      };
    } catch (error) {
      handleApiError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Trigger email automation
  const triggerAutomation = useCallback(async (options: TriggerAutomationOptions): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'automation',
          automationEvent: options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger automation');
      }

      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Get email templates
  const getTemplates = useCallback(async (): Promise<EmailTemplate[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send?action=templates', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch templates');
      }

      const data = await response.json();
      return data.templates;
    } catch (error) {
      handleApiError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Get email campaigns
  const getCampaigns = useCallback(async (): Promise<EmailCampaign[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send?action=campaigns', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch campaigns');
      }

      const data = await response.json();
      return data.campaigns;
    } catch (error) {
      handleApiError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Get email analytics
  const getAnalytics = useCallback(async (options?: {
    campaignId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<EmailAnalytics | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.campaignId) params.append('campaignId', options.campaignId);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      if (options?.groupBy) params.append('groupBy', options.groupBy);

      const response = await fetch(`/api/email/analytics?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      handleApiError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Update campaign status
  const updateCampaignStatus = useCallback(async (campaignId: string, status: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/analytics', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'update_campaign_status',
          campaignId,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update campaign status');
      }

      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Trigger campaign
  const triggerCampaign = useCallback(async (campaignId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/analytics', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'trigger_campaign',
          campaignId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger campaign');
      }

      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Predefined email helpers
  const sendWelcomeEmail = useCallback(async (email: string, name: string): Promise<boolean> => {
    const result = await sendTemplateEmail({
      templateType: 'welcome',
      recipients: [{ email, name }],
    });
    return result?.summary.successful === 1;
  }, [sendTemplateEmail]);

  const sendPasswordResetEmail = useCallback(async (email: string, resetToken: string): Promise<boolean> => {
    const result = await sendTemplateEmail({
      templateType: 'password_reset',
      recipients: [{ email, data: { resetToken } }],
    });
    return result?.summary.successful === 1;
  }, [sendTemplateEmail]);

  const sendLessonCompletionEmail = useCallback(async (
    email: string,
    name: string,
    lessonTitle: string
  ): Promise<boolean> => {
    const result = await sendTemplateEmail({
      templateType: 'lesson_completion',
      recipients: [{ email, name, data: { lessonTitle } }],
    });
    return result?.summary.successful === 1;
  }, [sendTemplateEmail]);

  const sendWeeklyProgressEmail = useCallback(async (
    email: string,
    name: string,
    progressData: Record<string, any>
  ): Promise<boolean> => {
    const result = await sendTemplateEmail({
      templateType: 'weekly_progress',
      recipients: [{ email, name, data: progressData }],
    });
    return result?.summary.successful === 1;
  }, [sendTemplateEmail]);

  const sendSubscriptionEmail = useCallback(async (
    email: string,
    name: string,
    subscriptionType: string
  ): Promise<boolean> => {
    const result = await sendTemplateEmail({
      templateType: 'subscription',
      recipients: [{ email, name, data: { subscriptionType } }],
    });
    return result?.summary.successful === 1;
  }, [sendTemplateEmail]);

  // Automation helpers
  const triggerUserRegistration = useCallback(async (userId: string, userEmail: string, userName: string): Promise<boolean> => {
    return triggerAutomation({
      event: 'user.registered',
      userId,
      data: { userEmail, userName },
    });
  }, [triggerAutomation]);

  const triggerLessonCompletion = useCallback(async (
    userId: string,
    userEmail: string,
    userName: string,
    lessonTitle: string
  ): Promise<boolean> => {
    return triggerAutomation({
      event: 'lesson.completed',
      userId,
      data: { userEmail, userName, lessonTitle },
    });
  }, [triggerAutomation]);

  const triggerUserInactive = useCallback(async (
    userId: string,
    userEmail: string,
    userName: string,
    daysInactive: number
  ): Promise<boolean> => {
    return triggerAutomation({
      event: 'user.inactive',
      userId,
      data: { userEmail, userName, daysInactive },
    });
  }, [triggerAutomation]);

  const triggerStreakAchieved = useCallback(async (
    userId: string,
    userEmail: string,
    userName: string,
    streakDays: number
  ): Promise<boolean> => {
    return triggerAutomation({
      event: 'streak.achieved',
      userId,
      data: { userEmail, userName, streakDays },
    });
  }, [triggerAutomation]);

  const triggerUserChurned = useCallback(async (
    userId: string,
    userEmail: string,
    userName: string,
    daysInactive: number
  ): Promise<boolean> => {
    return triggerAutomation({
      event: 'user.churned',
      userId,
      data: { userEmail, userName, daysInactive },
    });
  }, [triggerAutomation]);

  return {
    loading,
    error,
    
    // Core email functions
    sendEmail,
    sendBulkEmails,
    sendTemplateEmail,
    triggerAutomation,
    
    // Data fetching
    getTemplates,
    getCampaigns,
    getAnalytics,
    
    // Campaign management
    updateCampaignStatus,
    triggerCampaign,
    
    // Predefined email helpers
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendLessonCompletionEmail,
    sendWeeklyProgressEmail,
    sendSubscriptionEmail,
    
    // Automation helpers
    triggerUserRegistration,
    triggerLessonCompletion,
    triggerUserInactive,
    triggerStreakAchieved,
    triggerUserChurned,
  };
}