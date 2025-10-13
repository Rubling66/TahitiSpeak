import { useState, useEffect, useCallback } from 'react';
import { getEmailService, EmailPreferences, EmailTemplate, EmailAnalytics, SendEmailOptions } from '../services/EmailService';
import { useAuth } from './useAuth';

interface UseEmailOptions {
  autoLoadPreferences?: boolean;
}

interface EmailState {
  preferences: EmailPreferences | null;
  templates: EmailTemplate[];
  analytics: EmailAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const useEmail = (options: UseEmailOptions = {}) => {
  const { autoLoadPreferences = true } = options;
  const { user } = useAuth();
  const [state, setState] = useState<EmailState>({
    preferences: null,
    templates: [],
    analytics: null,
    isLoading: false,
    error: null
  });

  const emailService = getEmailService();

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const preferences = await emailService.getUserPreferences(user.id);
      setState(prev => ({ ...prev, preferences, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load preferences',
        isLoading: false 
      }));
    }
  }, [user?.id, emailService]);

  // Update user preferences
  const updatePreferences = useCallback(async (updates: Partial<EmailPreferences>): Promise<boolean> => {
    if (!user?.id) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const updatedPreferences = await emailService.updateUserPreferences(user.id, updates);
      setState(prev => ({ ...prev, preferences: updatedPreferences, isLoading: false }));
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update preferences',
        isLoading: false 
      }));
      return false;
    }
  }, [user?.id, emailService]);

  // Load email templates
  const loadTemplates = useCallback(async (category?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const templates = await emailService.listTemplates(category);
      setState(prev => ({ ...prev, templates, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load templates',
        isLoading: false 
      }));
    }
  }, [emailService]);

  // Send email
  const sendEmail = useCallback(async (options: SendEmailOptions): Promise<SendEmailResult> => {
    try {
      const messageId = await emailService.sendEmail({
        ...options,
        userId: options.userId || user?.id
      });
      
      return { success: true, messageId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }, [emailService, user?.id]);

  // Schedule email
  const scheduleEmail = useCallback(async (
    options: SendEmailOptions & { scheduledAt: Date }
  ): Promise<SendEmailResult> => {
    try {
      const messageId = await emailService.scheduleEmail({
        ...options,
        userId: options.userId || user?.id
      });
      
      return { success: true, messageId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to schedule email' 
      };
    }
  }, [emailService, user?.id]);

  // Load analytics
  const loadAnalytics = useCallback(async (
    startDate?: Date,
    endDate?: Date,
    templateName?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const analytics = await emailService.getEmailAnalytics(startDate, endDate, templateName);
      setState(prev => ({ ...prev, analytics, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load analytics',
        isLoading: false 
      }));
    }
  }, [emailService]);

  // Unsubscribe with token
  const unsubscribeWithToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      return await emailService.unsubscribe(token);
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }, [emailService]);

  // Auto-load preferences on mount
  useEffect(() => {
    if (autoLoadPreferences && user?.id) {
      loadPreferences();
    }
  }, [autoLoadPreferences, user?.id, loadPreferences]);

  return {
    // State
    preferences: state.preferences,
    templates: state.templates,
    analytics: state.analytics,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadPreferences,
    updatePreferences,
    loadTemplates,
    sendEmail,
    scheduleEmail,
    loadAnalytics,
    unsubscribeWithToken,

    // Utilities
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
};

// Specialized hook for email preferences management
export const useEmailPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailService = getEmailService();

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const prefs = await emailService.getUserPreferences(user.id);
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, emailService]);

  const updatePreference = useCallback(async (
    key: keyof EmailPreferences,
    value: any
  ): Promise<boolean> => {
    if (!user?.id) return false;

    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPrefs = await emailService.updateUserPreferences(user.id, { [key]: value });
      setPreferences(updatedPrefs);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, emailService]);

  const togglePreference = useCallback(async (key: keyof EmailPreferences): Promise<boolean> => {
    if (!preferences) return false;
    
    const currentValue = preferences[key];
    if (typeof currentValue === 'boolean') {
      return updatePreference(key, !currentValue);
    }
    return false;
  }, [preferences, updatePreference]);

  const unsubscribeAll = useCallback(async (): Promise<boolean> => {
    return updatePreference('isUnsubscribed', true);
  }, [updatePreference]);

  const resubscribe = useCallback(async (): Promise<boolean> => {
    return updatePreference('isUnsubscribed', false);
  }, [updatePreference]);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id, loadPreferences]);

  return {
    preferences,
    isLoading,
    error,
    loadPreferences,
    updatePreference,
    togglePreference,
    unsubscribeAll,
    resubscribe,
    clearError: () => setError(null)
  };
};

// Hook for email automation and workflows
export const useEmailAutomation = () => {
  const { user } = useAuth();
  const emailService = getEmailService();

  // Send welcome email
  const sendWelcomeEmail = useCallback(async (userData: {
    email: string;
    name: string;
    userId?: string;
  }): Promise<SendEmailResult> => {
    try {
      const messageId = await emailService.sendEmail({
        templateName: 'welcome',
        recipientEmail: userData.email,
        userId: userData.userId,
        templateData: {
          userName: userData.name,
          dashboardUrl: `${window.location.origin}/dashboard`,
          unsubscribeUrl: `${window.location.origin}/unsubscribe`,
          preferencesUrl: `${window.location.origin}/email-preferences`
        }
      });
      
      return { success: true, messageId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send welcome email' 
      };
    }
  }, [emailService]);

  // Send lesson reminder
  const sendLessonReminder = useCallback(async (userData: {
    email: string;
    name: string;
    userId?: string;
    streakDays: number;
    nextLesson?: { title: string; description: string };
  }): Promise<SendEmailResult> => {
    try {
      const messageId = await emailService.sendEmail({
        templateName: 'lesson_reminder',
        recipientEmail: userData.email,
        userId: userData.userId,
        templateData: {
          userName: userData.name,
          streakDays: userData.streakDays,
          nextLesson: userData.nextLesson,
          lessonUrl: `${window.location.origin}/lessons/next`,
          unsubscribeUrl: `${window.location.origin}/unsubscribe`,
          preferencesUrl: `${window.location.origin}/email-preferences`
        }
      });
      
      return { success: true, messageId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send lesson reminder' 
      };
    }
  }, [emailService]);

  // Send achievement notification
  const sendAchievementNotification = useCallback(async (userData: {
    email: string;
    name: string;
    userId?: string;
    achievement: {
      name: string;
      description: string;
      icon: string;
      points: number;
    };
    userStats: {
      totalPoints: number;
      totalAchievements: number;
      streakDays: number;
    };
  }): Promise<SendEmailResult> => {
    try {
      const messageId = await emailService.sendEmail({
        templateName: 'achievement_unlocked',
        recipientEmail: userData.email,
        userId: userData.userId,
        templateData: {
          userName: userData.name,
          achievementName: userData.achievement.name,
          achievementDescription: userData.achievement.description,
          achievementIcon: userData.achievement.icon,
          achievementPoints: userData.achievement.points,
          totalPoints: userData.userStats.totalPoints,
          totalAchievements: userData.userStats.totalAchievements,
          streakDays: userData.userStats.streakDays,
          profileUrl: `${window.location.origin}/profile`,
          unsubscribeUrl: `${window.location.origin}/unsubscribe`,
          preferencesUrl: `${window.location.origin}/email-preferences`
        }
      });
      
      return { success: true, messageId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send achievement notification' 
      };
    }
  }, [emailService]);

  // Send progress update
  const sendProgressUpdate = useCallback(async (userData: {
    email: string;
    name: string;
    userId?: string;
    weeklyStats: {
      lessonsCompleted: number;
      wordsLearned: number;
      studyTime: number;
      streakDays: number;
      milestones?: string[];
    };
  }): Promise<SendEmailResult> => {
    try {
      const messageId = await emailService.sendEmail({
        templateName: 'progress_update',
        recipientEmail: userData.email,
        userId: userData.userId,
        templateData: {
          userName: userData.name,
          lessonsCompleted: userData.weeklyStats.lessonsCompleted,
          wordsLearned: userData.weeklyStats.wordsLearned,
          studyTime: userData.weeklyStats.studyTime,
          streakDays: userData.weeklyStats.streakDays,
          milestones: userData.weeklyStats.milestones,
          dashboardUrl: `${window.location.origin}/dashboard`,
          unsubscribeUrl: `${window.location.origin}/unsubscribe`,
          preferencesUrl: `${window.location.origin}/email-preferences`
        }
      });
      
      return { success: true, messageId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send progress update' 
      };
    }
  }, [emailService]);

  // Send weekly digest
  const sendWeeklyDigest = useCallback(async (userData: {
    email: string;
    name: string;
    userId?: string;
    digestData: {
      newLessons?: string[];
      newWords?: string;
      communityStats?: {
        activeUsers: number;
        lessonsCompleted: number;
        topAchievement: string;
      };
    };
  }): Promise<SendEmailResult> => {
    try {
      const messageId = await emailService.sendEmail({
        templateName: 'weekly_digest',
        recipientEmail: userData.email,
        userId: userData.userId,
        templateData: {
          userName: userData.name,
          newLessons: userData.digestData.newLessons,
          newWords: userData.digestData.newWords,
          communityStats: userData.digestData.communityStats,
          dashboardUrl: `${window.location.origin}/dashboard`,
          unsubscribeUrl: `${window.location.origin}/unsubscribe`,
          preferencesUrl: `${window.location.origin}/email-preferences`
        }
      });
      
      return { success: true, messageId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send weekly digest' 
      };
    }
  }, [emailService]);

  return {
    sendWelcomeEmail,
    sendLessonReminder,
    sendAchievementNotification,
    sendProgressUpdate,
    sendWeeklyDigest
  };
};